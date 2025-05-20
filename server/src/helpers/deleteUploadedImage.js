const fs = require('fs');
const path = require('path');

// Configura la ruta base como una constante
const BASE_UPLOAD_DIR = path.join(__dirname, '../../API Clientes/uploads'); 

const eliminarImagenSubida = (filename) => {
  if (!filename) {
    console.log('No se proporcionó un nombre de archivo para eliminar');
    return;
  }

  try {
    // Usa la ruta base configurada
    const filePath = path.join(BASE_UPLOAD_DIR, filename);
    
    console.log(`Intentando eliminar archivo: ${filePath}`);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`Archivo eliminado exitosamente: ${filename}`);
    } else {
      console.log(`El archivo no existe en la ruta: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error al eliminar el archivo ${filename}:`, error);
  }
};

module.exports = eliminarImagenSubida;