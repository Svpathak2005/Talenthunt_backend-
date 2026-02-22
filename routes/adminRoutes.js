const express = require('express');
const auth = require('../middleware/authMiddleware');
const { createEvent, getEvents } = require('../controllers/eventController');
const { getAllRegistrations, getAllTeams } = require('../controllers/adminController');

const router = express.Router();

router.post('/add-event', auth(['admin']), createEvent);
router.get('/events', getEvents);
router.get('/registrations', auth(['admin']), getAllRegistrations);
router.get('/teams', auth(['admin']), getAllTeams);

module.exports = router;
