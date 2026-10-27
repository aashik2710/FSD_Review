const express = require('express');
const router = express.Router();
const { getAlerts, createAlert, resolveAlert, triggerAlertScan } = require('../controllers/alertController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getAlerts);
router.post('/', createAlert);
router.put('/:id/resolve', resolveAlert);
router.post('/scan', triggerAlertScan);

module.exports = router;
