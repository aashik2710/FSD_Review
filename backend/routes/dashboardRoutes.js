const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getDashboardCharts,
  getLiveOperationalFeed
} = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/stats', getDashboardStats);
router.get('/charts', getDashboardCharts);
router.get('/analytics', getDashboardCharts);
router.get('/live-feed', getLiveOperationalFeed);

module.exports = router;
