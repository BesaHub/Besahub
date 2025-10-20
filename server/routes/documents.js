const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { authMiddleware } = require('../middleware/auth');
const { validateDocumentUpload } = require('../validation/documentValidation');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/documents');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'image/gif',
      'text/plain'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX, images, and text files are allowed.'));
    }
  }
});

// Get all documents
router.get('/', authMiddleware, async (req, res) => {
  try {
    // This would typically query the database for documents
    // For now, return a mock response
    res.json({
      success: true,
      documents: [
        {
          id: 1,
          name: 'Sample Document.pdf',
          type: 'pdf',
          size: 1024000,
          uploadedAt: new Date().toISOString(),
          uploadedBy: req.user.id
        }
      ]
    });
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch documents'
    });
  }
});

// Upload a new document
router.post('/upload', authMiddleware, upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const document = {
      id: Date.now(),
      name: req.file.originalname,
      filename: req.file.filename,
      path: req.file.path,
      type: req.file.mimetype,
      size: req.file.size,
      uploadedAt: new Date().toISOString(),
      uploadedBy: req.user.id
    };

    // Here you would typically save the document info to the database
    console.log('Document uploaded:', document);

    res.json({
      success: true,
      message: 'Document uploaded successfully',
      document: document
    });
  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload document'
    });
  }
});

// Get a specific document
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const documentId = req.params.id;
    
    // This would typically query the database for the specific document
    // For now, return a mock response
    res.json({
      success: true,
      document: {
        id: documentId,
        name: 'Sample Document.pdf',
        type: 'pdf',
        size: 1024000,
        uploadedAt: new Date().toISOString(),
        uploadedBy: req.user.id
      }
    });
  } catch (error) {
    console.error('Error fetching document:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch document'
    });
  }
});

// Download a document
router.get('/:id/download', authMiddleware, async (req, res) => {
  try {
    const documentId = req.params.id;
    
    // This would typically get the file path from the database
    // For now, return a mock response
    res.status(404).json({
      success: false,
      message: 'Document not found'
    });
  } catch (error) {
    console.error('Error downloading document:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download document'
    });
  }
});

// Delete a document
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const documentId = req.params.id;
    
    // This would typically delete the document from the database and file system
    console.log('Document deleted:', documentId);
    
    res.json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete document'
    });
  }
});

module.exports = router;
