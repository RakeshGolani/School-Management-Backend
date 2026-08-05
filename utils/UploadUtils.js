const multer = require('multer');
const path = require('path');
const fs = require('fs');

/**
 * Creates a Multer uploader instance with disk storage and file filtering.
 * Modeled after reference architecture in aRoadRunner_node-js-backend.
 */
function makeUploader(subfolder, allowedExtensions = ['jpg', 'jpeg', 'png', 'webp']) {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      try {
        const uploadDir = path.resolve(__dirname, `../uploads/${subfolder}`);
        fs.mkdirSync(uploadDir, { recursive: true });
        cb(null, uploadDir);
      } catch (err) {
        cb(err);
      }
    },
    filename: (_, file, cb) => {
      const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
      cb(null, uniqueName);
    }
  });

  const fileFilter = (_, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase().substring(1);
    const mime = file.mimetype.toLowerCase();

    const extensionMimeMap = {
      jpg: ['image/jpeg', 'image/jpg'],
      jpeg: ['image/jpeg', 'image/jpg'],
      png: ['image/png'],
      webp: ['image/webp'],
      pdf: ['application/pdf']
    };

    const isAllowedExt = allowedExtensions.includes(ext);
    const isAllowedMime = allowedExtensions.some((e) => {
      const mimes = extensionMimeMap[e];
      return mimes && mimes.includes(mime);
    });

    if (isAllowedExt && isAllowedMime) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Allowed extensions: ${allowedExtensions.join(', ')}`));
    }
  };

  const fileSizeLimit = 15 * 1024 * 1024; // 15MB

  return multer({
    storage,
    limits: { fileSize: fileSizeLimit },
    fileFilter
  });
}

/**
 * Deletes a file from disk safely if it exists.
 * @param {string|object} file - File path, URL, or Multer file object
 */
function removeFile(file) {
  if (!file) return;

  try {
    let filePath = '';

    if (typeof file === 'string') {
      if (file.startsWith('http://') || file.startsWith('https://')) {
        // Extract relative path from URL (e.g. /uploads/schools/...)
        const urlObj = new URL(file);
        filePath = path.resolve(__dirname, `..${urlObj.pathname}`);
      } else if (file.startsWith('/uploads/')) {
        filePath = path.resolve(__dirname, `..${file}`);
      } else {
        filePath = path.resolve(file);
      }
    } else if (file.path) {
      filePath = file.path;
    }

    if (filePath && fs.existsSync(filePath)) {
      fs.unlink(filePath, (err) => {
        if (err && err.code !== 'ENOENT') {
          console.error('Failed to remove local file:', err.message);
        }
      });
    }
  } catch (err) {
    console.error('Error in removeFile utility:', err.message);
  }
}

module.exports = { makeUploader, removeFile };
