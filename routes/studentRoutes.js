// routes/studentRoutes.js

const express = require('express');
const auth = require('../middleware/authMiddleware');
const { validateFeedbackResponse } = require('../middleware/validateFeedback');
const {
  registerForEvent,
  getMatchSuggestions,
  sendTeamRequest,
  getTeamRequests,
  approveTeamRequest,
  getRegisteredEvents,
  getMatchingStudentsFull,
  getTeammates,
  getMentorsByDomain,
  sendMentorRequest,
  getMentorFeedback,
  submitFeedbackResponse
} = require('../controllers/studentController');

const router = express.Router();

// Event registration and matching
router.post('/register-event', auth(['student']), registerForEvent);
router.get('/registered-events', auth(['student']), getRegisteredEvents);
router.get('/suggestions', auth(['student']), getMatchSuggestions);
router.get('/match', auth(['student']), getMatchingStudentsFull);

// Team functionality
router.post('/team-request', auth(['student']), sendTeamRequest);
router.get('/team-requests', auth(['student']), getTeamRequests);
router.post('/approve-request', auth(['student']), approveTeamRequest);
router.get('/teammates', auth(['student']), getTeammates);

// Mentor related routes
router.get('/mentors-by-domain', auth(['student']), getMentorsByDomain);
router.post('/mentor-request', auth(['student']), sendMentorRequest);
router.get('/mentor-feedback', auth(['student']), getMentorFeedback);
router.post('/feedback-response', auth(['student']), validateFeedbackResponse, submitFeedbackResponse);

module.exports = router;