const router = require('express').Router();
const { authenticate, requireRole } = require('../middleware/auth');
const { getUsers, createUser, updateUser, resetPassword, deleteUser } = require('../controllers/userController');

router.use(authenticate, requireRole('admin'));

router.get('/',               getUsers);
router.post('/',              createUser);
router.put('/:id',            updateUser);
router.patch('/:id/password', resetPassword);
router.delete('/:id',         deleteUser);

module.exports = router;
