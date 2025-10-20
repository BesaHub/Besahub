const express = require('express');
const path = require('path');
const { authMiddleware, permissionMiddleware } = require('../middleware/auth');
const { appLogger } = require('../config/logger');
const { 
  imageUpload, 
  documentUpload, 
  avatarUpload, 
  propertyImageUpload 
} = require('../middleware/upload');

const router = express.Router();

router.use(authMiddleware);

router.post('/image', permissionMiddleware('properties', 'create'), imageUpload, async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No image files uploaded' });
    }

    const uploadedFiles = req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimeType: file.mimetype,
      url: `/uploads/images/${file.filename}`
    }));

    res.status(201).json({
      message: `${uploadedFiles.length} image(s) uploaded successfully`,
      files: uploadedFiles
    });
  } catch (error) {
    appLogger.error('Image upload error:', error);
    next(error);
  }
});

router.post('/document', permissionMiddleware('documents', 'create'), documentUpload, async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No document files uploaded' });
    }

    const uploadedFiles = req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimeType: file.mimetype,
      url: `/uploads/documents/${file.filename}`
    }));

    res.status(201).json({
      message: `${uploadedFiles.length} document(s) uploaded successfully`,
      files: uploadedFiles
    });
  } catch (error) {
    appLogger.error('Document upload error:', error);
    next(error);
  }
});

router.post('/avatar', avatarUpload, async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No avatar image uploaded' });
    }

    const file = req.files[0];
    const avatarData = {
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimeType: file.mimetype,
      url: `/uploads/avatars/${file.filename}`
    };

    res.status(201).json({
      message: 'Avatar uploaded successfully',
      avatar: avatarData
    });
  } catch (error) {
    appLogger.error('Avatar upload error:', error);
    next(error);
  }
});

router.post('/property-images', permissionMiddleware('properties', 'create'), propertyImageUpload, async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No property images uploaded' });
    }

    const uploadedFiles = req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimeType: file.mimetype,
      url: `/uploads/properties/${file.filename}`
    }));

    res.status(201).json({
      message: `${uploadedFiles.length} property image(s) uploaded successfully`,
      files: uploadedFiles
    });
  } catch (error) {
    appLogger.error('Property image upload error:', error);
    next(error);
  }
});

module.exports = router;
