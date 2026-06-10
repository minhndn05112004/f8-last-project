const express = require('express');
const router = express.Router();
const { createEmployee, getEmployees } = require('../controllers/adminController');
const { authenticateToken, authorizeRoles } = require('../middlewares/auth');

router.use(authenticateToken);
router.use(authorizeRoles('ADMIN'));

router.post('/employees', createEmployee);
router.get('/employees', getEmployees);

module.exports = router;
