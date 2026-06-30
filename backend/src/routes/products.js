const router = require('express').Router();
const { authenticate, requireRole } = require('../middleware/auth');
const { getProducts, getProduct, createProduct, updateProduct, deleteProduct, getStats } = require('../controllers/productController');
const { getSubtypes, createSubtype, updateSubtype, deleteSubtype } = require('../controllers/subtypeController');

router.use(authenticate);

// Products
router.get('/stats', getStats);
router.get('/',      getProducts);
router.get('/:id',   getProduct);
router.post('/',     requireRole('admin','staff'), createProduct);
router.put('/:id',   requireRole('admin','staff'), updateProduct);
router.delete('/:id',requireRole('admin'),         deleteProduct);

// Sub-types (components that make up an assembled product)
router.get('/:productId/subtypes',     getSubtypes);
router.post('/:productId/subtypes',    requireRole('admin','staff'), createSubtype);
router.put('/:productId/subtypes/:id', requireRole('admin','staff'), updateSubtype);
router.delete('/:productId/subtypes/:id', requireRole('admin','staff'), deleteSubtype);

module.exports = router;
