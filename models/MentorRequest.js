const mongoose = require('mongoose');

const MentorRequestSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  mentorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  introduction: {
    type: String,
    required: true,
    minLength: 10 // Ensure introduction isn't too short
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Add validation to ensure student and mentor exist
MentorRequestSchema.pre('save', async function(next) {
  const User = mongoose.model('User');
  
  try {
    const [student, mentor] = await Promise.all([
      User.findById(this.studentId),
      User.findById(this.mentorId)
    ]);
    
    if (!student || student.role !== 'student') {
      throw new Error('Invalid student ID');
    }
    if (!mentor || mentor.role !== 'mentor') {
      throw new Error('Invalid mentor ID');
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('MentorRequest', MentorRequestSchema);