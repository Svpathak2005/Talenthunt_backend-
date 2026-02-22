const Team = require('../models/Team');
const Feedback = require('../models/Feedback');
const MentorRequest = require('../models/MentorRequest');
const User = require('../models/User');

// Get all pending mentor requests for the mentor
exports.getMentorRequests = async (req, res) => {
  try {
    const mentorId = req.user.id;
    const requests = await MentorRequest.find({ 
      mentorId, 
      status: 'pending' 
    })
    .populate('studentId', 'name domain college')
    .sort({ createdAt: -1 });

    // Format the response
    const formattedRequests = requests.map(req => ({
      _id: req._id,
      studentName: req.studentId.name,
      domain: req.studentId.domain,
      college: req.studentId.college,
      introduction: req.introduction,
      createdAt: req.createdAt
    }));

    res.json(formattedRequests);
  } catch (error) {
    console.error('Error in getMentorRequests:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch mentor requests' });
  }
};

// Approve or reject a mentor request
exports.approveMentorRequest = async (req, res) => {
  try {
    const mentorId = req.user.id;
    const { requestId } = req.body;

    if (!requestId) {
      return res.status(400).json({ success: false, message: 'Request ID is required' });
    }

    const request = await MentorRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    if (request.mentorId.toString() !== mentorId) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    request.status = 'approved';
    await request.save();

    // Add mentor to the student's team if they have one
    const team = await Team.findOne({ 
      members: request.studentId,
      mentor: null
    });

    if (team) {
      team.mentor = mentorId;
      await team.save();
    }

    res.json({ success: true, message: 'Request approved successfully' });
  } catch (error) {
    console.error('Error in approveMentorRequest:', error);
    res.status(500).json({ success: false, message: 'Failed to process mentor request' });
  }
};

// Give feedback to a student
exports.giveFeedback = async (req, res) => {
  try {
    const mentorId = req.user.id;
    const { studentId, feedback: feedbackText } = req.body;

    if (!studentId || !feedbackText) {
      return res.status(400).json({ 
        success: false, 
        message: 'Student ID and feedback text are required' 
      });
    }

    // Verify this is actually your mentee
    const mentorRequest = await MentorRequest.findOne({
      mentorId,
      studentId,
      status: 'approved'
    });

    if (!mentorRequest) {
      return res.status(403).json({
        success: false,
        message: 'You can only give feedback to your approved mentees'
      });
    }

    // Verify student exists
    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({ 
        success: false, 
        message: 'Student not found' 
      });
    }

    const feedbackDoc = new Feedback({
      mentorId,
      studentId,
      feedback: feedbackText,
      createdAt: new Date()
    });

    await feedbackDoc.save();
    
    const populatedFeedback = await Feedback.findById(feedbackDoc._id)
      .populate('studentId', 'name')
      .lean();

    res.status(201).json({ 
      success: true, 
      feedback: {
        ...populatedFeedback,
        studentName: populatedFeedback.studentId.name
      }
    });
  } catch (error) {
    console.error('Error in giveFeedback:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to submit feedback' 
    });
  }
};

// Get all feedback given by the mentor
exports.getTeamFeedback = async (req, res) => {
  try {
    const mentorId = req.user.id;
    const feedbacks = await Feedback.find({ mentorId })
      .populate('studentId', 'name')
      .sort({ createdAt: -1 });

    // Format the response with null checking
    const formattedFeedbacks = feedbacks.map(fb => ({
      _id: fb._id,
      studentName: fb.studentId?.name || 'Unknown Student',
      feedback: fb.feedback,
      studentReply: fb.studentReply,
      createdAt: fb.createdAt
    }));

    res.json(formattedFeedbacks);
  } catch (error) {
    console.error('Error in getTeamFeedback:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch feedback history',
      error: error.message 
    });
  }
};

// Get all approved mentees for the mentor
exports.getMentees = async (req, res) => {
  try {
    const mentorId = req.user.id;
    const approvedRequests = await MentorRequest.find({
      mentorId,
      status: 'approved'
    })
    .populate('studentId', 'name domain college')
    .sort({ createdAt: -1 });

    // Get additional information for each mentee
    const mentees = await Promise.all(approvedRequests.map(async (req) => {
      // Find student's team
      const team = await Team.findOne({
        members: req.studentId._id,
        mentor: mentorId,
        isActive: true
      })
      .populate('eventId', 'name host')
      .populate('members', 'name')
      .lean();

      // Filter out the current student from teammates
      const teammates = team?.members?.filter(member => 
        member._id.toString() !== req.studentId._id.toString()
      ) || [];

      return {
        _id: req._id,
        studentId: req.studentId._id,
        studentName: req.studentId.name,
        domain: req.studentId.domain,
        college: req.studentId.college,
        event: team?.eventId || null,
        teammates: teammates
      };
    }));

    res.json(mentees);
  } catch (error) {
    console.error('Error in getMentees:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch mentees' });
  }
};
