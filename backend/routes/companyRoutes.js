const express = require('express');
const router = express.Router();
const {
  getCompanies,
  getCompanyById,
  createCompany,
  updateCompany,
  getPublicCompanies
} = require('../controllers/companyController');
const { protect, requireSuperAdmin } = require('../middleware/authMiddleware');

// Public route for registration dropdown
router.get('/public', getPublicCompanies);

// Protected routes
router.route('/')
  .get(protect, requireSuperAdmin, getCompanies)
  .post(protect, requireSuperAdmin, createCompany);

router.route('/:id')
  .get(protect, getCompanyById)
  .put(protect, requireSuperAdmin, updateCompany);

module.exports = router;
