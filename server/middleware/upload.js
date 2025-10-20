const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { fromBuffer } = require('file-type');

const ALLOWED_FILE_TYPES = {
  images: {
    extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    mimeTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp'
    ],
    magicNumbers: {
      'image/jpeg': [[0xFF, 0xD8, 0xFF]],
      'image/png': [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]],
      'image/gif': [[0x47, 0x49, 0x46, 0x38]],
      'image/webp': [[0x52, 0x49, 0x46, 0x46]]
    },
    maxSize: 5 * 1024 * 1024
  },
  documents: {
    extensions: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'csv'],
    mimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv',
      'application/csv'
    ],
    magicNumbers: {
      'application/pdf': [[0x25, 0x50, 0x44, 0x46]],
      'application/msword': [[0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1]],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [[0x50, 0x4B, 0x03, 0x04]],
      'application/vnd.ms-excel': [[0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1]],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [[0x50, 0x4B, 0x03, 0x04]]
    },
    maxSize: 10 * 1024 * 1024
  },
  archives: {
    extensions: ['zip'],
    mimeTypes: ['application/zip', 'application/x-zip-compressed'],
    magicNumbers: {
      'application/zip': [[0x50, 0x4B, 0x03, 0x04], [0x50, 0x4B, 0x05, 0x06]]
    },
    maxSize: 20 * 1024 * 1024
  }
};

const EXECUTABLE_PATTERNS = [
  /\.exe$/i,
  /\.bat$/i,
  /\.cmd$/i,
  /\.com$/i,
  /\.scr$/i,
  /\.vbs$/i,
  /\.js$/i,
  /\.jar$/i,
  /\.app$/i,
  /\.deb$/i,
  /\.rpm$/i,
  /\.dmg$/i,
  /\.pkg$/i,
  /\.sh$/i,
  /\.py$/i,
  /\.rb$/i,
  /\.pl$/i,
  /\.php$/i
];

const SUSPICIOUS_CONTENT = [
  Buffer.from('MZ'),
  Buffer.from('<?php'),
  Buffer.from('#!/bin/'),
  Buffer.from('<script'),
  Buffer.from('eval('),
  Buffer.from('exec(')
];

const sanitizeFilename = (filename) => {
  const ext = path.extname(filename).toLowerCase();
  const nameWithoutExt = path.basename(filename, ext);
  
  const sanitized = nameWithoutExt
    .replace(/[^a-zA-Z0-9-_]/g, '_')
    .substring(0, 50);
  
  return sanitized || 'file';
};

const checkDoubleExtension = (filename) => {
  const parts = filename.toLowerCase().split('.');
  if (parts.length > 2) {
    const secondToLast = parts[parts.length - 2];
    if (EXECUTABLE_PATTERNS.some(pattern => pattern.test(`.${secondToLast}`))) {
      return false;
    }
  }
  return true;
};

const checkMagicNumbers = async (buffer, mimeType, fileCategory) => {
  if (!buffer || buffer.length < 8) {
    return false;
  }

  const category = ALLOWED_FILE_TYPES[fileCategory];
  if (!category || !category.magicNumbers[mimeType]) {
    return false;
  }

  const expectedMagicNumbers = category.magicNumbers[mimeType];
  
  return expectedMagicNumbers.some(magicNumber => {
    for (let i = 0; i < magicNumber.length; i++) {
      if (buffer[i] !== magicNumber[i]) {
        return false;
      }
    }
    return true;
  });
};

const scanForMalware = (buffer) => {
  if (!buffer || buffer.length === 0) {
    return true;
  }

  const firstKB = buffer.slice(0, 1024);
  
  for (const pattern of SUSPICIOUS_CONTENT) {
    if (firstKB.includes(pattern)) {
      return false;
    }
  }

  return true;
};

const createFileFilter = (fileCategory) => {
  return async (req, file, cb) => {
    try {
      const category = ALLOWED_FILE_TYPES[fileCategory];
      
      if (!category) {
        return cb(new Error(`Invalid file category: ${fileCategory}`), false);
      }

      const fileExtension = path.extname(file.originalname).toLowerCase().substring(1);
      
      if (!category.extensions.includes(fileExtension)) {
        return cb(new Error(`File type .${fileExtension} is not allowed. Allowed types: ${category.extensions.join(', ')}`), false);
      }

      if (!category.mimeTypes.includes(file.mimetype)) {
        return cb(new Error(`MIME type ${file.mimetype} is not allowed`), false);
      }

      if (!checkDoubleExtension(file.originalname)) {
        return cb(new Error('Double extensions are not allowed for security reasons'), false);
      }

      for (const pattern of EXECUTABLE_PATTERNS) {
        if (pattern.test(file.originalname)) {
          return cb(new Error('Executable file types are not allowed'), false);
        }
      }

      cb(null, true);
    } catch (error) {
      cb(new Error(`File validation error: ${error.message}`), false);
    }
  };
};

const verifyFileContent = async (req, file, cb) => {
  try {
    if (!file || !file.buffer) {
      return cb(new Error('File buffer not available for validation'), false);
    }

    const fileType = req.uploadCategory || 'documents';
    const category = ALLOWED_FILE_TYPES[fileType];

    const detectedType = await fromBuffer(file.buffer);
    
    if (detectedType && !category.mimeTypes.includes(detectedType.mime)) {
      return cb(new Error(`File content does not match declared type. Detected: ${detectedType.mime}`), false);
    }

    if (category.magicNumbers[file.mimetype]) {
      const isValid = await checkMagicNumbers(file.buffer, file.mimetype, fileType);
      if (!isValid) {
        return cb(new Error('File header validation failed. File may be corrupted or tampered with'), false);
      }
    }

    if (!scanForMalware(file.buffer)) {
      return cb(new Error('File contains suspicious content and was rejected'), false);
    }

    cb(null, true);
  } catch (error) {
    cb(new Error(`Content validation error: ${error.message}`), false);
  }
};

const createStorage = (uploadPath) => {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      const fullPath = path.join(__dirname, '..', uploadPath);
      
      fs.mkdirSync(fullPath, { recursive: true, mode: 0o750 });
      
      cb(null, fullPath);
    },
    filename: (req, file, cb) => {
      const sanitizedName = sanitizeFilename(file.originalname);
      const ext = path.extname(file.originalname).toLowerCase();
      const uniqueName = `${sanitizedName}-${uuidv4()}${ext}`;
      
      cb(null, uniqueName);
    }
  });
};

const createMemoryStorage = () => {
  return multer.memoryStorage();
};

const createUploadMiddleware = (fileCategory, options = {}) => {
  const category = ALLOWED_FILE_TYPES[fileCategory];
  
  if (!category) {
    throw new Error(`Invalid file category: ${fileCategory}`);
  }

  const uploadPath = options.path || `uploads/${fileCategory}`;
  const maxFiles = options.maxFiles || 10;
  const useMemory = options.validateContent === true;

  const storage = useMemory ? createMemoryStorage() : createStorage(uploadPath);

  const upload = multer({
    storage,
    limits: {
      fileSize: options.maxSize || category.maxSize,
      files: maxFiles
    },
    fileFilter: createFileFilter(fileCategory)
  });

  if (useMemory) {
    return async (req, res, next) => {
      req.uploadCategory = fileCategory;
      
      upload.any()(req, res, async (err) => {
        if (err) {
          if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
              return res.status(400).json({ 
                error: `File too large. Maximum size: ${(category.maxSize / (1024 * 1024)).toFixed(1)}MB` 
              });
            }
            if (err.code === 'LIMIT_FILE_COUNT') {
              return res.status(400).json({ 
                error: `Too many files. Maximum: ${maxFiles}` 
              });
            }
            return res.status(400).json({ error: err.message });
          }
          return res.status(400).json({ error: err.message });
        }

        if (!req.files || req.files.length === 0) {
          return next();
        }

        try {
          for (const file of req.files) {
            await new Promise((resolve, reject) => {
              verifyFileContent(req, file, (err, result) => {
                if (err) reject(err);
                else resolve(result);
              });
            });
          }

          const fullPath = path.join(__dirname, '..', uploadPath);
          fs.mkdirSync(fullPath, { recursive: true, mode: 0o750 });

          for (const file of req.files) {
            const sanitizedName = sanitizeFilename(file.originalname);
            const ext = path.extname(file.originalname).toLowerCase();
            const uniqueName = `${sanitizedName}-${uuidv4()}${ext}`;
            const filePath = path.join(fullPath, uniqueName);

            fs.writeFileSync(filePath, file.buffer, { mode: 0o640 });
            
            file.filename = uniqueName;
            file.path = filePath;
            file.destination = fullPath;
          }

          next();
        } catch (error) {
          return res.status(400).json({ error: error.message });
        }
      });
    };
  }

  return (req, res, next) => {
    upload.any()(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ 
              error: `File too large. Maximum size: ${(category.maxSize / (1024 * 1024)).toFixed(1)}MB` 
            });
          }
          if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({ 
              error: `Too many files. Maximum: ${maxFiles}` 
            });
          }
          return res.status(400).json({ error: err.message });
        }
        return res.status(400).json({ error: err.message });
      }
      next();
    });
  };
};

const imageUpload = createUploadMiddleware('images', { 
  path: 'uploads/images',
  maxFiles: 10,
  validateContent: true
});

const documentUpload = createUploadMiddleware('documents', { 
  path: 'uploads/documents',
  maxFiles: 10,
  validateContent: true
});

const avatarUpload = createUploadMiddleware('images', { 
  path: 'uploads/avatars',
  maxFiles: 1,
  maxSize: 2 * 1024 * 1024,
  validateContent: true
});

const propertyImageUpload = createUploadMiddleware('images', { 
  path: 'uploads/properties',
  maxFiles: 20,
  validateContent: true
});

const archiveUpload = createUploadMiddleware('archives', { 
  path: 'uploads/archives',
  maxFiles: 1,
  validateContent: true
});

module.exports = {
  imageUpload,
  documentUpload,
  avatarUpload,
  propertyImageUpload,
  archiveUpload,
  createUploadMiddleware,
  ALLOWED_FILE_TYPES
};
