// controllers/adminController.js
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const Team = require('../models/Team');
const User = require('../models/User');

exports.getAllRegistrations = async (req, res) => {
  try {
    const regs = await Registration.find().populate('userId').populate('eventId');
    res.json(regs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAllTeams = async (req, res) => {
  try {
    const teams = await Team.find().populate('members').populate('mentor');
    res.json(teams);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
