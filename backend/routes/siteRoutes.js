const express = require('express');
const router = express.Router();
const { getSites, createSite, updateSite, deleteSite } = require('../controllers/siteController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router.get('/', getSites);
router.post('/', authorize('ADMIN'), createSite);
router.put('/:id', authorize('ADMIN'), updateSite);
router.delete('/:id', authorize('ADMIN'), deleteSite);

module.exports = router;
