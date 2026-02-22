const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, enum: ['student', 'mentor', 'admin'], required: true },
  college: String,
  state: String,
  city: String,
  domain: String,
  category: String,
  experience: String // For mentor
});

module.exports = mongoose.model('User', UserSchema);
