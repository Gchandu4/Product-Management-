const router = require('express').Router();
const { authenticate, requireRole } = require('../middleware/auth');
const { getProducts, getProduct, createProduct, updateProduct, deleteProduct, getStats } = require('../controllers/productController');

router.use(authenticate);
router.get('/stats', getStats);
router.get('/',      getProducts);
router.get('/:id',   getProduct);
router.post('/',     requireRole('admin','staff'), createProduct);
router.put('/:id',   requireRole('admin','staff'), updateProduct);
router.delete('/:id',requireRole('admin'),         deleteProduct);

module.exports = router;
