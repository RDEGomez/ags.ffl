// scripts/migrationRunner.js - Script principal para ejecutar toda la Fase 1
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const { inventarioCloudinary } = require('./cloudinaryInventory');
const { analizarUrlsEnBD } = require('./analyzeImageUrls');

async function ejecutarFase1() {
  console.log('🚀 INICIANDO FASE 1: PREPARACIÓN DE CUENTAS');
  console.log('=' * 60);
  console.log('⏱️ Timestamp:', new Date().toISOString());
  
  const resultados = {
    fase: 1,
    timestamp: new Date().toISOString(),
    cloudinary: null,
    baseDatos: null,
    verificaciones: {
      credencialesCloudinary: false,
      credencialesImageKit: false,
      conexionBD: false,
      espacioSuficiente: false
    },
    recomendaciones: [],
    siguientesPasos: []
  };

  try {
    // 1. Verificar credenciales necesarias
    console.log('\n📋 PASO 1: Verificación de credenciales');
    console.log('-'.repeat(40));
    
    // Verificar Cloudinary
    const cloudinaryOk = !!(
      process.env.CLOUDINARY_CLOUD_NAME && 
      process.env.CLOUDINARY_API_KEY && 
      process.env.CLOUDINARY_API_SECRET
    );
    
    resultados.verificaciones.credencialesCloudinary = cloudinaryOk;
    console.log(`☁️  Cloudinary: ${cloudinaryOk ? '✅ OK' : '❌ FALTA'}`);
    
    if (!cloudinaryOk) {
      console.log('   ⚠️  Faltan credenciales de Cloudinary en .env');
      console.log('   💡 Agrega: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET');
    }

    // Verificar ImageKit (opcional para Fase 1)
    const imagekitOk = !!(
      process.env.IMAGEKIT_URL_ENDPOINT && 
      process.env.IMAGEKIT_PUBLIC_KEY && 
      process.env.IMAGEKIT_PRIVATE_KEY
    );
    
    resultados.verificaciones.credencialesImageKit = imagekitOk;
    console.log(`🖼️  ImageKit: ${imagekitOk ? '✅ OK' : '⚠️  PENDIENTE'}`);
    
    if (!imagekitOk) {
      console.log('   💡 Configura ImageKit después del inventario');
      resultados.recomendaciones.push('Configurar credenciales de ImageKit');
    }

    // Verificar conexión a BD
    const mongoOk = !!(process.env.MONGODB_URI || process.env.DATABASE_URL);
    resultados.verificaciones.conexionBD = mongoOk;
    console.log(`🗄️  MongoDB: ${mongoOk ? '✅ OK' : '❌ FALTA'}`);
    
    if (!mongoOk) {
      console.log('   ⚠️  Falta URL de MongoDB en .env');
      console.log('   💡 Agrega: MONGODB_URI o DATABASE_URL');
      throw new Error('Credenciales de MongoDB requeridas');
    }

    // 2. Ejecutar inventario de Cloudinary
    if (cloudinaryOk) {
      console.log('\n📊 PASO 2: Inventario de Cloudinary');
      console.log('-'.repeat(40));
      
      try {
        resultados.cloudinary = await inventarioCloudinary();
        console.log('✅ Inventario de Cloudinary completado');
        
        // Verificar si cabe en ImageKit gratuito
        const cabeEnImageKit = resultados.cloudinary.resumen.cabeEnImageKitGratuito;
        resultados.verificaciones.espacioSuficiente = cabeEnImageKit;
        
        if (cabeEnImageKit) {
          console.log('🎉 ¡Excelente! Todo cabe en el plan gratuito de ImageKit');
          resultados.recomendaciones.push('Proceder con plan gratuito de ImageKit');
        } else {
          console.log('⚠️  Se necesita plan pagado de ImageKit');
          resultados.recomendaciones.push('Considerar plan pagado de ImageKit ($20/mes)');
          resultados.recomendaciones.push('O limpiar archivos no utilizados antes de migrar');
        }
        
      } catch (error) {
        console.error('❌ Error en inventario de Cloudinary:', error.message);
        resultados.cloudinary = { error: error.message };
      }
    } else {
      console.log('⏭️  Saltando inventario de Cloudinary (credenciales faltantes)');
    }

    // 3. Ejecutar análisis de BD
    console.log('\n🗄️ PASO 3: Análisis de Base de Datos');
    console.log('-'.repeat(40));
    
    try {
      resultados.baseDatos = await analizarUrlsEnBD();
      console.log('✅ Análisis de BD completado');
      
      const totalImagenes = resultados.baseDatos.resumen.totales.totalConImagen;
      const cloudinaryImagenes = resultados.baseDatos.resumen.totales.totalCloudinary;
      const localImagenes = resultados.baseDatos.resumen.totales.totalLocal;
      
      console.log(`📊 Resumen: ${totalImagenes} imágenes total (${cloudinaryImagenes} Cloudinary, ${localImagenes} locales)`);
      
      if (cloudinaryImagenes > 0) {
        resultados.siguientesPasos.push(`Migrar ${cloudinaryImagenes} imágenes de Cloudinary`);
      }
      
      if (localImagenes > 0) {
        resultados.siguientesPasos.push(`Verificar ${localImagenes} archivos locales`);
      }
      
    } catch (error) {
      console.error('❌ Error en análisis de BD:', error.message);
      resultados.baseDatos = { error: error.message };
    }

    // 4. Generar reporte consolidado
    console.log('\n📑 PASO 4: Reporte consolidado');
    console.log('-'.repeat(40));
    
    const reportsDir = path.join(process.cwd(), 'migration-reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir);
    }

    // Calcular estadísticas combinadas
    if (resultados.cloudinary && resultados.baseDatos) {
      const espacioCloudinary = resultados.cloudinary.resumen.totalSizeGB || 0;
      const imagenesEnBD = resultados.baseDatos.resumen.totales.totalCloudinary || 0;
      const imagenesEnCloudinary = resultados.cloudinary.resumen.totalArchivos || 0;
      
      resultados.estadisticasConsolidadas = {
        espacioTotalGB: espacioCloudinary,
        imagenesEnCloudinary: imagenesEnCloudinary,
        imagenesReferencidasEnBD: imagenesEnBD,
        posiblesHuerfanas: Math.max(0, imagenesEnCloudinary - imagenesEnBD),
        eficienciaAlmacenamiento: imagenesEnBD > 0 ? (imagenesEnBD / imagenesEnCloudinary * 100).toFixed(1) + '%' : 'N/A'
      };

      if (resultados.estadisticasConsolidadas.posiblesHuerfanas > 0) {
        resultados.recomendaciones.push(`Revisar ${resultados.estadisticasConsolidadas.posiblesHuerfanas} posibles imágenes huérfanas`);
      }
    }

    // 5. Generar plan de acción
    resultados.planAccion = generarPlanAccion(resultados);

    // Guardar reporte final
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportePath = path.join(reportsDir, `fase1-reporte-${timestamp}.json`);
    fs.writeFileSync(reportePath, JSON.stringify(resultados, null, 2));

    // Generar resumen ejecutivo
    const resumenPath = path.join(reportsDir, 'fase1-resumen.md');
    const resumenMarkdown = generarResumenMarkdown(resultados);
    fs.writeFileSync(resumenPath, resumenMarkdown);

    console.log('\n🎯 RESULTADOS FASE 1:');
    console.log('=' * 50);
    console.log(`📄 Reporte completo: ${reportePath}`);
    console.log(`📋 Resumen ejecutivo: ${resumenPath}`);
    
    // Mostrar estado general
    const todasVerificacionesOk = Object.values(resultados.verificaciones).every(v => v);
    console.log(`\n🏁 Estado general: ${todasVerificacionesOk ? '✅ LISTO PARA FASE 2' : '⚠️ REQUIERE ATENCIÓN'}`);
    
    if (!todasVerificacionesOk) {
      console.log('\n⚠️ ACCIONES REQUERIDAS:');
      if (!resultados.verificaciones.credencialesImageKit) {
        console.log('   1. Configurar cuenta y credenciales de ImageKit');
      }
      if (!resultados.verificaciones.espacioSuficiente && resultados.cloudinary) {
        console.log('   2. Decidir plan de ImageKit (gratuito vs. pagado)');
      }
    } else {
      console.log('\n🚀 PRÓXIMO PASO: Ejecutar Fase 2 - Configuración Backend');
      console.log('💡 Todo está listo para continuar con la migración');
    }

    return resultados;

  } catch (error) {
    console.error('\n💥 ERROR FATAL EN FASE 1:', error.message);
    resultados.error = error.message;
    
    // Guardar reporte de error
    const reportsDir = path.join(process.cwd(), 'migration-reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir);
    }
    
    const errorPath = path.join(reportsDir, 'fase1-error.json');
    fs.writeFileSync(errorPath, JSON.stringify(resultados, null, 2));
    console.log(`📄 Reporte de error guardado: ${errorPath}`);
    
    throw error;
  }
}

function generarPlanAccion(resultados) {
  const plan = {
    prioridad: 'alta',
    tareas: [],
    estimacionTiempo: '1-2 días',
    bloqueadores: []
  };

  // Verificar bloqueadores
  if (!resultados.verificaciones.credencialesImageKit) {
    plan.bloqueadores.push('Configurar credenciales de ImageKit');
  }

  if (!resultados.verificaciones.espacioSuficiente && resultados.cloudinary) {
    plan.bloqueadores.push('Decidir plan de ImageKit (espacio insuficiente)');
  }

  // Tareas pendientes
  if (resultados.verificaciones.credencialesImageKit) {
    plan.tareas.push('✅ Credenciales ImageKit configuradas');
  } else {
    plan.tareas.push('📋 Configurar credenciales ImageKit');
  }

  if (resultados.cloudinary) {
    plan.tareas.push('✅ Inventario Cloudinary completado');
  } else {
    plan.tareas.push('📋 Completar inventario Cloudinary');
  }

  if (resultados.baseDatos) {
    plan.tareas.push('✅ Análisis de BD completado');
  } else {
    plan.tareas.push('📋 Completar análisis de BD');
  }

  // Siguientes pasos
  plan.tareas.push('🚀 Iniciar Fase 2: Configuración Backend');

  return plan;
}

function generarResumenMarkdown(resultados) {
  const markdown = `# 📋 Resumen Ejecutivo - Fase 1: Preparación

**Fecha:** ${new Date(resultados.timestamp).toLocaleString()}
**Estado:** ${Object.values(resultados.verificaciones).every(v => v) ? '✅ COMPLETADO' : '⚠️ PENDIENTE'}

## 🎯 Verificaciones

| Componente | Estado | Notas |
|------------|--------|-------|
| Cloudinary | ${resultados.verificaciones.credencialesCloudinary ? '✅' : '❌'} | ${resultados.verificaciones.credencialesCloudinary ? 'Credenciales OK' : 'Faltan credenciales'} |
| ImageKit | ${resultados.verificaciones.credencialesImageKit ? '✅' : '⚠️'} | ${resultados.verificaciones.credencialesImageKit ? 'Credenciales OK' : 'Pendiente configuración'} |
| MongoDB | ${resultados.verificaciones.conexionBD ? '✅' : '❌'} | ${resultados.verificaciones.conexionBD ? 'Conexión OK' : 'Faltan credenciales'} |
| Espacio | ${resultados.verificaciones.espacioSuficiente ? '✅' : '⚠️'} | ${resultados.verificaciones.espacioSuficiente ? 'Cabe en plan gratuito' : 'Requiere plan pagado'} |

## 📊 Estadísticas

${resultados.estadisticasConsolidadas ? `
- **Espacio total:** ${resultados.estadisticasConsolidadas.espacioTotalGB} GB
- **Imágenes en Cloudinary:** ${resultados.estadisticasConsolidadas.imagenesEnCloudinary}
- **Imágenes referenciadas en BD:** ${resultados.estadisticasConsolidadas.imagenesReferencidasEnBD}
- **Eficiencia:** ${resultados.estadisticasConsolidadas.eficienciaAlmacenamiento}
` : 'No disponibles'}

## 🔍 Recomendaciones

${resultados.recomendaciones.map(r => `- ${r}`).join('\n')}

## 🚀 Próximos Pasos

${resultados.siguientesPasos.map(s => `- ${s}`).join('\n')}

---
*Generado automáticamente por migrationRunner.js*`;

  return markdown;
}

// Función para verificar dependencias
function verificarDependencias() {
  const dependenciasRequeridas = [
    'cloudinary',
    'mongoose',
    'dotenv'
  ];
  
  const dependenciasFaltantes = [];
  
  dependenciasRequeridas.forEach(dep => {
    try {
      require(dep);
    } catch (error) {
      dependenciasFaltantes.push(dep);
    }
  });
  
  if (dependenciasFaltantes.length > 0) {
    console.error('❌ Dependencias faltantes:', dependenciasFaltantes.join(', '));
    console.log('💡 Instala con: npm install', dependenciasFaltantes.join(' '));
    return false;
  }
  
  return true;
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  console.log('🎬 MIGRACIÓN CLOUDINARY → IMAGEKIT');
  console.log('📋 FASE 1: Preparación de Cuentas\n');
  
  // Verificar dependencias antes de empezar
  if (!verificarDependencias()) {
    process.exit(1);
  }
  
  ejecutarFase1()
    .then((resultados) => {
      const exito = Object.values(resultados.verificaciones).every(v => v);
      
      if (exito) {
        console.log('\n🎉 ¡FASE 1 COMPLETADA EXITOSAMENTE!');
        console.log('🚀 Lista para continuar con Fase 2');
        process.exit(0);
      } else {
        console.log('\n⚠️ FASE 1 COMPLETADA CON PENDIENTES');
        console.log('📋 Revisa el reporte y completa las tareas faltantes');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('\n💥 FASE 1 FALLÓ:', error.message);
      console.error('🔧 Revisa la configuración y vuelve a intentar');
      process.exit(1);
    });
}

module.exports = { 
  ejecutarFase1,
  generarPlanAccion,
  generarResumenMarkdown,
  verificarDependencias 
};