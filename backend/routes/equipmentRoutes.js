const express = require('express');
const router = express.Router();
const {
  getEquipment,
  getEquipmentById,
  createEquipment,
  updateEquipment,
  deleteEquipment
} = require('../controllers/equipmentController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router.get('/', getEquipment);
router.get('/:id', getEquipmentById);
router.post('/', authorize('ADMIN', 'MAINTENANCE_MANAGER'), createEquipment);
router.put('/:id', authorize('ADMIN', 'MAINTENANCE_MANAGER', 'TECHNICIAN'), updateEquipment);
router.delete('/:id', authorize('ADMIN'), deleteEquipment);

module.exports = router;
