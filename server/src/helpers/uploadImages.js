const multer = require('multer');
const shortid = require('shortid');
const path = require('path');

const configuracionMulter = {
  storage: fileStorage =  multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, path.join(__dirname, '../uploads'));
    },
    filename: (req, file, cb) => {
      let extension = file.mimetype.split('/')[1];
      if (extension === 'svg+xml') {
        extension = 'svg';
      }
      cb(null, `${shortid.generate()}.${extension}`);
    }
  }),
  fileFilter(req, file, cb) {
    if (
      file.mimetype === 'image/jpeg' || 
      file.mimetype === 'image/png' || 
      file.mimetype === 'image/svg+xml'
    ) {
      cb(null, true);
    } else {
      cb(new Error('Formato no válido'), false);
    }
  }
}

const upload = multer(configuracionMulter).single('imagen');

module.exports = upload;