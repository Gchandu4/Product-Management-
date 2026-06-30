const router = require('express').Router();
const { authenticate, requireRole } = require('../middleware/auth');
const { getRequests, createRequest, approveRequest, rejectRequest } = require('../controllers/saleRequestController');

router.use(authenticate);

router.get('/',              getRequests);
router.post('/',             requireRole('admin','staff','reception'), createRequest);
router.patch('/:id/approve', requireRole('admin'), approveRequest);
router.patch('/:id/reject',  requireRole('admin'), rejectRequest);

module.exports = router;
