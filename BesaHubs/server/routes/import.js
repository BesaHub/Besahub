const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const importService = require('../services/importService');
const { authMiddleware } = require('../middleware/auth');
const { appLogger } = require('../config/logger');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/imports');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 }
});

router.use(authMiddleware);

router.post('/properties', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const result = await importService.importProperties(req.file.path, req.user.id);
    
    fs.unlinkSync(req.file.path);
    
    res.json(result);
  } catch (error) {
    appLogger.error('Error importing properties', {
      service: 'cre-crm-app',
      error: error.message
    });
    next(error);
  }
});

router.post('/contacts', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const result = await importService.importContacts(req.file.path, req.user.id);
    
    fs.unlinkSync(req.file.path);
    
    res.json(result);
  } catch (error) {
    appLogger.error('Error importing contacts', {
      service: 'cre-crm-app',
      error: error.message
    });
    next(error);
  }
});

router.get('/template/:type', (req, res) => {
  const { type } = req.params;
  
  if (type === 'properties') {
    const csv = 'address,city,state,zipCode,propertyType,price,squareFootage,yearBuilt,status,description\n' +
                '123 Main St,New York,NY,10001,office,500000,2500,2010,available,Modern office space\n' +
                '456 Oak Ave,Los Angeles,CA,90001,retail,750000,3000,2015,available,Prime retail location';
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=properties_template.csv');
    res.send(csv);
  } else if (type === 'contacts') {
    const csv = 'firstName,lastName,email,phone,type,status,company,title,address,city,state,zipCode\n' +
                'John,Doe,john@example.com,555-1234,buyer,active,Acme Corp,CEO,789 Elm St,Chicago,IL,60601\n' +
                'Jane,Smith,jane@example.com,555-5678,seller,active,Tech Inc,CFO,321 Pine St,Boston,MA,02101';
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=contacts_template.csv');
    res.send(csv);
  } else {
    res.status(404).json({ error: 'Template not found' });
  }
});

module.exports = router;
