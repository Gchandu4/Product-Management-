const router = require('express').Router();
const { authenticate, requireRole } = require('../middleware/auth');
const { getCategories, createCategory, updateCategory, deleteCategory } = require('../controllers/categoryController');

router.use(authenticate);
router.get('/',       getCategories);
router.post('/',      requireRole('admin'),        createCategory);
router.put('/:id',    requireRole('admin'),        updateCategory);
router.delete('/:id', requireRole('admin'),        deleteCategory);

module.exports = router;
