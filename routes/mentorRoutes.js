const express = require('express');
const auth = require('../middleware/authMiddleware');
const { validateFeedback } = require('../middleware/validateFeedback');
const {
  getMentorRequests,
  approveMentorRequest,
  getTeamFeedback,
  giveFeedback,
  getMentees
} = require('../controllers/mentorController');

const router = express.Router();

// Mentor request routes
router.get('/requests', auth(['mentor']), getMentorRequests);
router.post('/approve', auth(['mentor']), approveMentorRequest);

// Feedback routes
router.get('/feedbacks', auth(['mentor']), getTeamFeedback);
router.post('/feedback', auth(['mentor']), validateFeedback, giveFeedback);

// Get mentees
router.get('/mentees', auth(['mentor']), getMentees);

module.exports = router;
