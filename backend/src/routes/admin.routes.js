const express = require('express');
const router = express.Router();
const { createEmployee, getEmployees, checkCloudinary } = require('../controllers/adminController');
const { authenticateToken, authorizeRoles } = require('../middlewares/auth');

router.use(authenticateToken);
router.use(authorizeRoles('ADMIN'));

router.post('/employees', createEmployee);
router.get('/employees', getEmployees);
router.get('/check-cloudinary', checkCloudinary);

module.exports = router;
