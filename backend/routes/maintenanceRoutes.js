const express = require('express');
const router = express.Router();
const {
  getMaintenance,
  getMaintenanceById,
  createMaintenance,
  updateMaintenance,
  deleteMaintenance,
  approveMaintenance,
  completeMaintenance
} = require('../controllers/maintenanceController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

// Completion endpoint accessible by assigned Technician, Manager, Owner, Super Admin
router.put('/:id/complete', completeMaintenance);

// Approval endpoint for Company Owner and Super Admin
router.put('/:id/approve', authorize('ADMIN'), approveMaintenance);

// General maintenance management endpoints restricted from Technician
router.get('/', authorize('ADMIN', 'MAINTENANCE_MANAGER'), getMaintenance);
router.get('/:id', authorize('ADMIN', 'MAINTENANCE_MANAGER'), getMaintenanceById);
router.post('/', authorize('ADMIN', 'MAINTENANCE_MANAGER'), createMaintenance);
router.put('/:id', authorize('ADMIN', 'MAINTENANCE_MANAGER'), updateMaintenance);
router.delete('/:id', authorize('ADMIN'), deleteMaintenance);

module.exports = router;
