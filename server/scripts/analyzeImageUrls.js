// scripts/analyzeImageUrls.js
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Importar modelos
const Usuario = require('../src/models/Usuario');
const Equipo = require('../src/models/Equipo');
const Torneo = require('../src/models/Torneo');
const Arbitro = require('../src/models/Arbitro');

async function analizarUrlsEnBD() {
  console.log('🔍 Iniciando análisis de URLs de imágenes en Base de Datos...');
  console.log('⏱️ Timestamp:', new Date().toISOString());
  
  try {
    // Conectar a MongoDB
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || process.env.DATABASE_URL);
    console.log('✅ Conectado a MongoDB exitosamente');

    const analisis = {
      usuarios: { total: 0, conImagen: 0, cloudinary: 0, local: 0, urls: [] },
      equipos: { total: 0, conImagen: 0, cloudinary: 0, local: 0, urls: [] },
      torneos: { total: 0, conImagen: 0, cloudinary: 0, local: 0, urls: [] },
      arbitros: { total: 0, conImagen: 0, cloudinary: 0, local: 0, urls: [] }
    };

    console.log('👥 Analizando usuarios...');
    // Analizar usuarios
    const usuarios = await Usuario.find({}, 'nombre imagen documento').lean();
    analisis.usuarios.total = usuarios.length;
    
    usuarios.forEach(usuario => {
      if (usuario.imagen) {
        analisis.usuarios.conImagen++;
        const isCloudinary = usuario.imagen.includes('cloudinary.com');
        const isHttp = usuario.imagen.startsWith('http://') || usuario.imagen.startsWith('https://');
        
        if (isCloudinary) {
          analisis.usuarios.cloudinary++;
        } else if (isHttp) {
          // Es una URL externa pero no de Cloudinary
          analisis.usuarios.local++; // Consideramos como "otros"
        } else {
          // Es un filename local
          analisis.usuarios.local++;
        }
        
        analisis.usuarios.urls.push({
          id: usuario._id,
          nombre: usuario.nombre,
          documento: usuario.documento,
          imagen: usuario.imagen,
          tipo: isCloudinary ? 'cloudinary' : (isHttp ? 'external' : 'local')
        });
      }
    });

    console.log('⚽ Analizando equipos...');
    // Analizar equipos
    const equipos = await Equipo.find({}, 'nombre imagen').lean();
    analisis.equipos.total = equipos.length;
    
    equipos.forEach(equipo => {
      if (equipo.imagen) {
        analisis.equipos.conImagen++;
        const isCloudinary = equipo.imagen.includes('cloudinary.com');
        const isHttp = equipo.imagen.startsWith('http://') || equipo.imagen.startsWith('https://');
        
        if (isCloudinary) {
          analisis.equipos.cloudinary++;
        } else if (isHttp) {
          analisis.equipos.local++;
        } else {
          analisis.equipos.local++;
        }
        
        analisis.equipos.urls.push({
          id: equipo._id,
          nombre: equipo.nombre,
          imagen: equipo.imagen,
          tipo: isCloudinary ? 'cloudinary' : (isHttp ? 'external' : 'local')
        });
      }
    });

    console.log('🏆 Analizando torneos...');
    // Analizar torneos
    const torneos = await Torneo.find({}, 'nombre imagen').lean();
    analisis.torneos.total = torneos.length;
    
    torneos.forEach(torneo => {
      if (torneo.imagen) {
        analisis.torneos.conImagen++;
        const isCloudinary = torneo.imagen.includes('cloudinary.com');
        const isHttp = torneo.imagen.startsWith('http://') || torneo.imagen.startsWith('https://');
        
        if (isCloudinary) {
          analisis.torneos.cloudinary++;
        } else if (isHttp) {
          analisis.torneos.local++;
        } else {
          analisis.torneos.local++;
        }
        
        analisis.torneos.urls.push({
          id: torneo._id,
          nombre: torneo.nombre,
          imagen: torneo.imagen,
          tipo: isCloudinary ? 'cloudinary' : (isHttp ? 'external' : 'local')
        });
      }
    });

    console.log('👨‍⚖️ Analizando árbitros...');
    // Analizar árbitros (la imagen está en usuario.imagen)
    const arbitros = await Arbitro.find({}).populate('usuario', 'nombre imagen documento').lean();
    analisis.arbitros.total = arbitros.length;
    
    arbitros.forEach(arbitro => {
      if (arbitro.usuario && arbitro.usuario.imagen) {
        analisis.arbitros.conImagen++;
        const isCloudinary = arbitro.usuario.imagen.includes('cloudinary.com');
        const isHttp = arbitro.usuario.imagen.startsWith('http://') || arbitro.usuario.imagen.startsWith('https://');
        
        if (isCloudinary) {
          analisis.arbitros.cloudinary++;
        } else if (isHttp) {
          analisis.arbitros.local++;
        } else {
          analisis.arbitros.local++;
        }
        
        analisis.arbitros.urls.push({
          id: arbitro._id,
          usuarioId: arbitro.usuario._id,
          nombre: arbitro.usuario.nombre,
          documento: arbitro.usuario.documento,
          imagen: arbitro.usuario.imagen,
          tipo: isCloudinary ? 'cloudinary' : (isHttp ? 'external' : 'local')
        });
      }
    });

    // Calcular totales generales
    const totales = {
      totalRegistros: analisis.usuarios.total + analisis.equipos.total + analisis.torneos.total + analisis.arbitros.total,
      totalConImagen: analisis.usuarios.conImagen + analisis.equipos.conImagen + analisis.torneos.conImagen + analisis.arbitros.conImagen,
      totalCloudinary: analisis.usuarios.cloudinary + analisis.equipos.cloudinary + analisis.torneos.cloudinary + analisis.arbitros.cloudinary,
      totalLocal: analisis.usuarios.local + analisis.equipos.local + analisis.torneos.local + analisis.arbitros.local
    };

    console.log('\n📊 RESUMEN DEL ANÁLISIS:');
    console.log('='.repeat(50));
    
    console.log('\n👥 USUARIOS:');
    console.log(`   Total: ${analisis.usuarios.total}`);
    console.log(`   Con imagen: ${analisis.usuarios.conImagen} (${((analisis.usuarios.conImagen/analisis.usuarios.total)*100).toFixed(1)}%)`);
    console.log(`   Cloudinary: ${analisis.usuarios.cloudinary}`);
    console.log(`   Local/Otros: ${analisis.usuarios.local}`);

    console.log('\n⚽ EQUIPOS:');
    console.log(`   Total: ${analisis.equipos.total}`);
    console.log(`   Con imagen: ${analisis.equipos.conImagen} (${((analisis.equipos.conImagen/analisis.equipos.total)*100).toFixed(1)}%)`);
    console.log(`   Cloudinary: ${analisis.equipos.cloudinary}`);
    console.log(`   Local/Otros: ${analisis.equipos.local}`);

    console.log('\n🏆 TORNEOS:');
    console.log(`   Total: ${analisis.torneos.total}`);
    console.log(`   Con imagen: ${analisis.torneos.conImagen} (${((analisis.torneos.conImagen/analisis.torneos.total)*100).toFixed(1)}%)`);
    console.log(`   Cloudinary: ${analisis.torneos.cloudinary}`);
    console.log(`   Local/Otros: ${analisis.torneos.local}`);

    console.log('\n👨‍⚖️ ÁRBITROS:');
    console.log(`   Total: ${analisis.arbitros.total}`);
    console.log(`   Con imagen: ${analisis.arbitros.conImagen} (${((analisis.arbitros.conImagen/analisis.arbitros.total)*100).toFixed(1)}%)`);
    console.log(`   Cloudinary: ${analisis.arbitros.cloudinary}`);
    console.log(`   Local/Otros: ${analisis.arbitros.local}`);

    console.log('\n📈 TOTALES GENERALES:');
    console.log(`   Total registros: ${totales.totalRegistros}`);
    console.log(`   Total con imagen: ${totales.totalConImagen} (${((totales.totalConImagen/totales.totalRegistros)*100).toFixed(1)}%)`);
    console.log(`   Total Cloudinary: ${totales.totalCloudinary}`);
    console.log(`   Total Local/Otros: ${totales.totalLocal}`);

    // Identificar patrones de URLs
    const patronesCloudinary = new Set();
    const patronesLocal = new Set();
    
    ['usuarios', 'equipos', 'torneos', 'arbitros'].forEach(coleccion => {
      analisis[coleccion].urls.forEach(item => {
        if (item.tipo === 'cloudinary') {
          // Extraer patrón de URL de Cloudinary
          const matches = item.imagen.match(/https:\/\/res\.cloudinary\.com\/([^\/]+)\//);
          if (matches) {
            patronesCloudinary.add(matches[1]);
          }
        } else if (item.tipo === 'local') {
          // Analizar extensiones de archivos locales
          if (!item.imagen.startsWith('http')) {
            const extension = path.extname(item.imagen).toLowerCase();
            if (extension) {
              patronesLocal.add(extension);
            }
          }
        }
      });
    });

    console.log('\n🔍 ANÁLISIS DE PATRONES:');
    console.log(`   Cuentas Cloudinary detectadas: ${Array.from(patronesCloudinary).join(', ')}`);
    console.log(`   Extensiones locales: ${Array.from(patronesLocal).join(', ')}`);

    // Detectar posibles problemas
    const problemas = [];
    
    // URLs rotas o formatos extraños
    const urlsProblematicas = [];
    ['usuarios', 'equipos', 'torneos', 'arbitros'].forEach(coleccion => {
      analisis[coleccion].urls.forEach(item => {
        if (item.imagen) {
          // URLs que no son ni Cloudinary ni archivos locales válidos
          if (item.imagen.startsWith('http') && !item.imagen.includes('cloudinary.com') && !item.imagen.includes('localhost') && !item.imagen.includes(process.env.BACKEND_URL || '')) {
            urlsProblematicas.push({
              coleccion,
              id: item.id,
              nombre: item.nombre,
              url: item.imagen
            });
          }
          
          // Archivos locales con caracteres extraños
          if (!item.imagen.startsWith('http') && /[^a-zA-Z0-9.\-_]/.test(item.imagen)) {
            problemas.push(`${coleccion}: "${item.nombre}" tiene filename con caracteres especiales: ${item.imagen}`);
          }
        }
      });
    });

    if (urlsProblematicas.length > 0) {
      problemas.push(`${urlsProblematicas.length} URLs externas detectadas (no Cloudinary ni locales)`);
    }

    if (problemas.length > 0) {
      console.log('\n⚠️ PROBLEMAS DETECTADOS:');
      problemas.forEach(problema => console.log(`   • ${problema}`));
    }

    // Generar reporte detallado
    const timestamp = new Date().toISOString();
    const reporte = {
      metadata: {
        timestamp,
        mongodb_uri: process.env.MONGODB_URI ? 'Configurado' : 'No configurado',
        script_version: '1.0.0'
      },
      resumen: {
        totales,
        por_coleccion: {
          usuarios: {
            total: analisis.usuarios.total,
            conImagen: analisis.usuarios.conImagen,
            cloudinary: analisis.usuarios.cloudinary,
            local: analisis.usuarios.local,
            porcentajeConImagen: parseFloat(((analisis.usuarios.conImagen/analisis.usuarios.total)*100).toFixed(1))
          },
          equipos: {
            total: analisis.equipos.total,
            conImagen: analisis.equipos.conImagen,
            cloudinary: analisis.equipos.cloudinary,
            local: analisis.equipos.local,
            porcentajeConImagen: parseFloat(((analisis.equipos.conImagen/analisis.equipos.total)*100).toFixed(1))
          },
          torneos: {
            total: analisis.torneos.total,
            conImagen: analisis.torneos.conImagen,
            cloudinary: analisis.torneos.cloudinary,
            local: analisis.torneos.local,
            porcentajeConImagen: parseFloat(((analisis.torneos.conImagen/analisis.torneos.total)*100).toFixed(1))
          },
          arbitros: {
            total: analisis.arbitros.total,
            conImagen: analisis.arbitros.conImagen,
            cloudinary: analisis.arbitros.cloudinary,
            local: analisis.arbitros.local,
            porcentajeConImagen: parseFloat(((analisis.arbitros.conImagen/analisis.arbitros.total)*100).toFixed(1))
          }
        }
      },
      patrones: {
        cloudinary_accounts: Array.from(patronesCloudinary),
        extensiones_locales: Array.from(patronesLocal)
      },
      problemas_detectados: problemas,
      urls_problematicas: urlsProblematicas,
      detalle_urls: analisis,
      estadisticas_migracion: {
        urls_a_migrar_cloudinary: totales.totalCloudinary,
        archivos_locales_a_verificar: totales.totalLocal,
        estimacion_tiempo_migracion: `${Math.ceil(totales.totalCloudinary / 50)} - ${Math.ceil(totales.totalCloudinary / 20)} minutos`,
        prioridad_migracion: totales.totalCloudinary > 100 ? 'Alta' : totales.totalCloudinary > 50 ? 'Media' : 'Baja'
      }
    };

    // Crear directorio de reportes si no existe
    const reportsDir = path.join(process.cwd(), 'migration-reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir);
    }

    // Guardar reporte completo
    const reporteTimestamp = timestamp.replace(/[:.]/g, '-');
    const reportePath = path.join(reportsDir, `bd-images-analysis-${reporteTimestamp}.json`);
    fs.writeFileSync(reportePath, JSON.stringify(reporte, null, 2));
    
    // Guardar también una versión CSV para fácil revisión
    const csvData = [];
    csvData.push(['Colección', 'ID', 'Nombre', 'Documento', 'URL Imagen', 'Tipo']);
    
    ['usuarios', 'equipos', 'torneos', 'arbitros'].forEach(coleccion => {
      analisis[coleccion].urls.forEach(item => {
        csvData.push([
          coleccion,
          item.id,
          item.nombre || '',
          item.documento || '',
          item.imagen || '',
          item.tipo
        ]);
      });
    });

    const csvContent = csvData.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const csvPath = path.join(reportsDir, 'bd-images-urls.csv');
    fs.writeFileSync(csvPath, csvContent);

    console.log(`\n💾 Reportes generados:`);
    console.log(`   📄 Análisis completo: ${reportePath}`);
    console.log(`   📊 URLs en CSV: ${csvPath}`);
    console.log('\n✅ Análisis de BD completado exitosamente!');

    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');

    return reporte;

  } catch (error) {
    console.error('❌ Error durante el análisis:', error.message);
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
    throw error;
  }
}

// Función helper para validar URLs
function validarUrls(analisisData) {
  console.log('🔍 Validando URLs...');
  
  const urlsInvalidas = [];
  
  ['usuarios', 'equipos', 'torneos', 'arbitros'].forEach(coleccion => {
    analisisData[coleccion].urls.forEach(item => {
      if (item.imagen) {
        // Validar formato de URL
        if (item.imagen.startsWith('http')) {
          try {
            new URL(item.imagen);
          } catch {
            urlsInvalidas.push({
              coleccion,
              id: item.id,
              nombre: item.nombre,
              url: item.imagen,
              problema: 'URL malformada'
            });
          }
        }
        
        // Validar archivos locales
        if (!item.imagen.startsWith('http')) {
          const extension = path.extname(item.imagen).toLowerCase();
          const extensionesValidas = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
          
          if (!extensionesValidas.includes(extension)) {
            urlsInvalidas.push({
              coleccion,
              id: item.id,
              nombre: item.nombre,
              url: item.imagen,
              problema: 'Extensión no válida o faltante'
            });
          }
        }
      }
    });
  });

  if (urlsInvalidas.length > 0) {
    console.log(`⚠️ ${urlsInvalidas.length} URLs potencialmente problemáticas encontradas`);
    return urlsInvalidas;
  } else {
    console.log('✅ Todas las URLs parecen válidas');
    return [];
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  console.log('🚀 Ejecutando análisis de imágenes en BD...\n');
  
  analizarUrlsEnBD()
    .then((reporte) => {
      console.log('\n🎉 ¡Análisis completado exitosamente!');
      console.log('\n📋 SIGUIENTE PASO: Ejecutar inventario de Cloudinary');
      console.log('💡 Comando: node scripts/cloudinaryInventory.js');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Error fatal:', error.message);
      console.error('🔧 Verifica la conexión a MongoDB y las credenciales');
      process.exit(1);
    });
}

module.exports = { 
  analizarUrlsEnBD,
  validarUrls 
};