const express = require('express');
const router = express.Router();
const {
  createRequest,
  getMyRequests,
  updateRequestStatus,
  getConnections,
  disconnectConnection,
  getRequestNotifications,
} = require('../controllers/requestController');
const { requireAuth } = require('../middleware/authMiddleware');

// All request operations require authentication
router.use(requireAuth);

router.post('/', createRequest);
router.get('/my', getMyRequests);
router.get('/notifications', getRequestNotifications);
router.get('/connections', getConnections);
router.delete('/connections/:peerId', disconnectConnection);
router.post('/connections/:peerId/disconnect', disconnectConnection);
router.put('/:id/status', updateRequestStatus);

module.exports = router;

