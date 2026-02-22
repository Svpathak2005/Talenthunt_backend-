// models/Registration.js

const mongoose = require('mongoose');

const RegistrationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  college: {
    type: String,
    required: true
  },
  degree: {
    type: String,
    required: true
  },
  studyYear: {
    type: String,
    required: true
  },
  endYear: {
    type: String,
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
  registeredAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Registration', RegistrationSchema);