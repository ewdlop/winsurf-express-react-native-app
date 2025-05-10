const express = require('express');
const multer = require('multer');
const nutritionService = require('../services/nutritionService');
const authMiddleware = require('../middleware/authMiddleware');
const logger = require('../utils/logger');

const router = express.Router();
const upload = multer({ 
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB file size limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and GIF are allowed.'));
    }
  }
});

// Scan food by barcode
router.get('/barcode', authMiddleware, async (req, res) => {
  try {
    const { barcode } = req.query;

    if (!barcode) {
      return res.status(400).json({ message: 'Barcode is required' });
    }

    const nutritionInfo = await nutritionService.scanBarcode(barcode);

    logger.info(`Barcode scanned successfully for user ${req.user.id}`);
    res.json(nutritionInfo);
  } catch (error) {
    logger.error('Barcode scanning error', { 
      userId: req.user.id, 
      barcode: req.query.barcode,
      error: error.message 
    });
    res.status(400).json({ 
      message: 'Error scanning barcode', 
      error: error.message 
    });
  }
});

// Search food by text query
router.get('/search', authMiddleware, async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const nutritionInfo = await nutritionService.searchFood(query);

    logger.info(`Food search performed by user ${req.user.id}`);
    res.json(nutritionInfo);
  } catch (error) {
    logger.error('Food search error', { 
      userId: req.user.id, 
      query: req.query.query,
      error: error.message 
    });
    res.status(400).json({ 
      message: 'Error searching food', 
      error: error.message 
    });
  }
});

// Scan food image
router.post('/image', 
  authMiddleware, 
  upload.single('image'), 
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No image uploaded' });
      }

      const nutritionInfo = await nutritionService.scanFoodImage(req.file.buffer);

      logger.info(`Food image scanned successfully for user ${req.user.id}`);
      res.json(nutritionInfo);
    } catch (error) {
      logger.error('Food image scanning error', { 
        userId: req.user.id, 
        error: error.message 
      });
      res.status(400).json({ 
        message: 'Error scanning food image', 
        error: error.message 
      });
    }
  }
);

module.exports = router;
