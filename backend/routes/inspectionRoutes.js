const express = require('express');
const router = express.Router();
const { getInspections, createInspection } = require('../controllers/inspectionController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getInspections);
router.post('/', createInspection);

module.exports = router;
