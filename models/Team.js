// models/Team.js

const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  domain: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  approved: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  mentor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Team', teamSchema);