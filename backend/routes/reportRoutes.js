const express = require('express');
const router = express.Router();
const {
  getReports,
  generateReport,
  getLiveAnalytics
} = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);
router.use(authorize('ADMIN'));

router.get('/', getReports);
router.post('/generate', generateReport);
router.get('/analytics', getLiveAnalytics);

module.exports = router;
