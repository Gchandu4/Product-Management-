const router = require('express').Router();
const { authenticate, requireRole } = require('../middleware/auth');
const { getHistory, adjustStock, getSummary } = require('../controllers/stockController');

router.use(authenticate);
router.get('/summary', getSummary);
router.get('/history', getHistory);
router.post('/adjust', requireRole('admin','staff'), adjustStock);

module.exports = router;
