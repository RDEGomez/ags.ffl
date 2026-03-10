#!/usr/bin/env node
/**
 * 🏈 SCRIPT DE EMERGENCIA: Balance de jugadores por torneo
 *
 * Ubícalo en: server/src/scripts/balance-jugadores-torneo.js
 *
 * Uso desde la raíz del proyecto:
 *   node src/scripts/balance-jugadores-torneo.js "CALAVERAS 2025"
 *   node src/scripts/balance-jugadores-torneo.js "Fuego y Cenizas"
 *
 * Qué hace:
 *   1. Busca el torneo por nombre (parcial, case-insensitive)
 *   2. Obtiene todos los partidos de ese torneo
 *   3. Extrae los equipos únicos que aparecen en esos partidos (con su categoría)
 *   4. Busca todos los usuarios que tienen esos equipos en su array equipos[]
 *   5. Muestra balance por categoría y total general
 */

require('dotenv').config(); // Toma el .env de server/
const mongoose = require('mongoose');

const Torneo  = require('../src/models/Torneo');
const Partido = require('../src/models/Partido');
const Equipo  = require('../src/models/Equipo');
const Usuario = require('../src/models/Usuario');

// ─── CATEGORÍAS ──────────────────────────────────────────────────────────────
const NOMBRES_CATEGORIA = {
  mixgold:  'Mixto Gold',
  mixsilv:  'Mixto Silver',
  vargold:  'Varonil Gold',
  varsilv:  'Varonil Silver',
  femgold:  'Femenil Gold',
  femsilv:  'Femenil Silver',
  varmast:  'Varonil Master',
  femmast:  'Femenil Master',
  tocho7v7: 'Tocho 7v7',
  u8:       'Sub-8',
  u10:      'Sub-10',
  u12fem:   'Sub-12 Femenil',
  u12var:   'Sub-12 Varonil',
  u14fem:   'Sub-14 Femenil',
  u14var:   'Sub-14 Varonil',
  u16fem:   'Sub-16 Femenil',
  u16var:   'Sub-16 Varonil',
  u18fem:   'Sub-18 Femenil',
  u18var:   'Sub-18 Varonil',
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const sep  = (c = '─', n = 65) => c.repeat(n);
const padR = (s, n) => String(s ?? '').padEnd(n);
const padL = (s, n) => String(s ?? '').padStart(n);

// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
  const nombreTorneo = process.argv[2];

  if (!nombreTorneo) {
    console.error('\n❌  Falta el nombre del torneo.');
    console.error('    Uso: node src/scripts/balance-jugadores-torneo.js "CALAVERAS 2025"\n');
    process.exit(1);
  }

  await mongoose.connect('mongodb+srv://danielcachao:WWchwuZwGi5nItxh@edgcprojcluster.5w9dq9d.mongodb.net/agsffl?retryWrites=true&w=majority', { 
      useNewUrlParser: true,
      useUnifiedTopology: true 
  });

  try {
    // ── 1. BUSCAR TORNEO ───────────────────────────────────────────────────
    console.log(`\n🔍  [1/4] Buscando torneo "${nombreTorneo}"...`);
    const torneo = await Torneo.findOne({
      nombre: { $regex: nombreTorneo, $options: 'i' },
    }).lean();

    if (!torneo) {
      console.error(`❌  No existe un torneo que coincida con "${nombreTorneo}"`);
      process.exit(1);
    }
    console.log(`    ✅  "${torneo.nombre}"  (ID: ${torneo._id})`);

    // ── 2. OBTENER PARTIDOS ────────────────────────────────────────────────
    console.log('\n🔍  [2/4] Obteniendo partidos...');
    const partidos = await Partido.find({ torneo: torneo._id })
      .select('equipoLocal equipoVisitante categoria estado')
      .lean();

    console.log(`    ✅  ${partidos.length} partidos encontrados`);

    if (partidos.length === 0) {
      console.warn('    ⚠️   El torneo no tiene partidos registrados.');
      process.exit(0);
    }

    // Desglose por estado
    const porEstado = partidos.reduce((acc, p) => {
      const e = p.estado || 'sin_estado';
      acc[e] = (acc[e] || 0) + 1;
      return acc;
    }, {});
    Object.entries(porEstado).forEach(([estado, cnt]) =>
      console.log(`         ${padR(estado, 14)}: ${cnt}`)
    );

    // ── 3. EXTRAER EQUIPOS ÚNICOS ──────────────────────────────────────────
    console.log('\n🔍  [3/4] Extrayendo equipos únicos...');

    // equipoId (string) → categoria del partido donde aparece
    const equipoIdACategoria = new Map();
    for (const p of partidos) {
      const cat = p.categoria || 'sin_categoria';
      if (p.equipoLocal)
        equipoIdACategoria.set(p.equipoLocal.toString(), cat);
      if (p.equipoVisitante)
        equipoIdACategoria.set(p.equipoVisitante.toString(), cat);
    }

    const equipoIds = [...equipoIdACategoria.keys()].map(
      (id) => new mongoose.Types.ObjectId(id)
    );
    console.log(`    ✅  ${equipoIds.length} equipos únicos participantes`);

    // Obtener nombres de equipos para el reporte
    const equiposDoc = await Equipo.find({ _id: { $in: equipoIds } })
      .select('nombre categoria')
      .lean();
    const equipoNombre = new Map(equiposDoc.map((e) => [e._id.toString(), e.nombre]));

    // ── 4. BUSCAR USUARIOS DE ESOS EQUIPOS ────────────────────────────────
    console.log('\n🔍  [4/4] Buscando jugadores registrados...');
    const usuarios = await Usuario.find({
      'equipos.equipo': { $in: equipoIds },
    })
      .select('nombre equipos')
      .lean();

    console.log(`    ✅  ${usuarios.length} usuarios encontrados con al menos 1 equipo del torneo`);

    // ── CONSTRUIR BALANCE ──────────────────────────────────────────────────
    // Por categoría → { equipos: Set<id>, jugadores: Set<userId> }
    const balance = {};

    for (const usuario of usuarios) {
      for (const ins of usuario.equipos || []) {
        const eIdStr = ins.equipo?.toString();
        if (!eIdStr || !equipoIdACategoria.has(eIdStr)) continue;

        const cat = equipoIdACategoria.get(eIdStr);
        if (!balance[cat]) {
          balance[cat] = { equipos: new Set(), jugadores: new Set() };
        }
        balance[cat].equipos.add(eIdStr);
        balance[cat].jugadores.add(usuario._id.toString());
      }
    }

    // ── IMPRIMIR REPORTE ───────────────────────────────────────────────────
    console.log('\n');
    console.log(sep('═'));
    console.log(`  📊  BALANCE DE JUGADORES — ${torneo.nombre.toUpperCase()}`);
    console.log(sep('═'));
    console.log(`  ${padR('CATEGORÍA', 22)}  ${padL('EQUIPOS', 8)}  ${padL('JUGADORES', 10)}`);
    console.log(`  ${sep()}`);

    let totalJugadores = 0;
    let totalEquipos   = 0;

    const catsOrdenadas = Object.keys(balance).sort();
    for (const cat of catsOrdenadas) {
      const { equipos, jugadores } = balance[cat];
      totalEquipos   += equipos.size;
      totalJugadores += jugadores.size;
      const nombre = NOMBRES_CATEGORIA[cat] || cat;
      console.log(
        `  ${padR(nombre, 22)}  ${padL(equipos.size, 8)}  ${padL(jugadores.size, 10)}`
      );
    }

    console.log(`  ${sep()}`);
    console.log(
      `  ${padR('TOTAL', 22)}  ${padL(totalEquipos, 8)}  ${padL(totalJugadores, 10)}`
    );
    console.log(sep('═'));

    // Usuarios únicos totales (1 persona en 2 categorías cuenta como 1)
    const usuariosUnicos = new Set(
      usuarios
        .filter((u) =>
          (u.equipos || []).some((ins) =>
            equipoIdACategoria.has(ins.equipo?.toString())
          )
        )
        .map((u) => u._id.toString())
    );

    console.log(`\n  👤  Usuarios únicos (sin importar cuántas categorías)  : ${usuariosUnicos.size}`);
    console.log(`  🏟️   Total partidos registrados en el torneo            : ${partidos.length}`);
    console.log(`  🏈   Equipos únicos detectados en partidos               : ${equipoIds.length}`);
    console.log('\n' + sep('═') + '\n');
  } finally {
    await mongoose.disconnect();
    console.log('🔌  Desconectado de MongoDB\n');
  }
}

main().catch((err) => {
  console.error('\n💥  Error inesperado:', err.message);
  process.exit(1);
});