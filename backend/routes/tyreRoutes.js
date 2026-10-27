const express = require('express');
const router = express.Router();
const {
  getTyres,
  getTyreById,
  createTyre,
  updateTyre,
  mountTyre,
  scrapTyre,
  deleteTyre
} = require('../controllers/tyreController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router.get('/', getTyres);
router.get('/:id', getTyreById);
router.post('/', authorize('ADMIN', 'MAINTENANCE_MANAGER'), createTyre);
router.put('/:id', authorize('ADMIN', 'MAINTENANCE_MANAGER', 'TECHNICIAN'), updateTyre);
router.post('/:id/mount', authorize('ADMIN', 'MAINTENANCE_MANAGER', 'TECHNICIAN'), mountTyre);
router.post('/:id/scrap', authorize('ADMIN', 'MAINTENANCE_MANAGER', 'TECHNICIAN'), scrapTyre);
router.delete('/:id', authorize('ADMIN'), deleteTyre);

module.exports = router;
