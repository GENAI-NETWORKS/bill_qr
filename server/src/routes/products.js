const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { requireAuth } = require('../middleware/auth');
const {
  getProducts, getProduct, createProduct, updateProduct,
  deleteProduct, updateStock, getProductQR, downloadQR
} = require('../controllers/productsController');

// Multer config for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/images'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `img_${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only images are allowed'));
  },
});

router.get('/', requireAuth, getProducts);
router.get('/:id', requireAuth, getProduct);
router.post('/', requireAuth, upload.single('image'), createProduct);
router.put('/:id', requireAuth, upload.single('image'), updateProduct);
router.delete('/:id', requireAuth, deleteProduct);
router.patch('/:id/stock', requireAuth, updateStock);
router.get('/:id/qr', requireAuth, getProductQR);
router.get('/:id/qr/download', requireAuth, downloadQR);

module.exports = router;
