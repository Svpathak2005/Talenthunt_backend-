// studentController.js

const User = require('../models/User');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const Team = require('../models/Team');
const TeamRequest = require('../models/TeamRequest');
const Feedback = require('../models/Feedback');
const MentorRequest = require('../models/MentorRequest');

// Register student for an event
exports.registerForEvent = async (req, res) => {
  try {
    const { eventId, name, college, degree, studyYear, endYear, domain, category } = req.body;
    const userId = req.user.id;

    // Check if already registered
    const existingReg = await Registration.findOne({ 
      userId: userId,
      eventId: eventId
    });

    if (existingReg) {
      return res.status(400).json({ 
        success: false, 
        message: 'You are already registered for this event' 
      });
    }

    // Create registration
    const registration = new Registration({
      userId,
      eventId,
      name,
      college,
      degree,
      studyYear,
      endYear,
      domain,
      category
    });

    await registration.save();
    return res.json({ success: true, registration });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get matching suggestions
exports.getMatchSuggestions = async (req, res) => {
  try {
    const userId = req.user.id;
    const currentUser = await User.findById(userId);

    // Find students with same domain and category
    const matchingStudents = await User.find({
      _id: { $ne: userId },
      role: 'student',
      domain: currentUser.domain,
      category: currentUser.category
    }).select('name college domain category');

    return res.json(matchingStudents);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get full matching students details
exports.getMatchingStudentsFull = async (req, res) => {
  try {
    const userId = req.user.id;
    const currentUser = await User.findById(userId);

    // Find students with same domain and category
    const matchingStudents = await User.find({
      _id: { $ne: userId },
      role: 'student',
      domain: currentUser.domain,
      category: currentUser.category
    }).select('name college domain state city');

    return res.json(matchingStudents);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Send team request to another student
exports.sendTeamRequest = async (req, res) => {
  try {
    const fromUserId = req.user.id;
    const { targetUserId, eventId } = req.body;

    // Validate inputs
    if (!targetUserId || !eventId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Target user ID and event ID are required' 
      });
    }

    // Check if already sent request
    const existingRequest = await TeamRequest.findOne({
      fromUser: fromUserId,
      toUser: targetUserId,
      event: eventId
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: 'You have already sent a request to this student for this event'
      });
    }

    // Create team request
    const teamRequest = new TeamRequest({
      fromUser: fromUserId,
      toUser: targetUserId,
      event: eventId,
      status: 'pending'
    });

    await teamRequest.save();
    return res.json({ success: true, message: 'Team request sent successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get team requests for current student
exports.getTeamRequests = async (req, res) => {
  try {
    const userId = req.user.id;

    // Find all pending requests for this user
    const teamRequests = await TeamRequest.find({
      toUser: userId,
      status: 'pending'
    })
    .populate('fromUser', 'name college state city domain')
    .populate('event', 'name host');

    return res.json(teamRequests);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Approve or deny team request
exports.approveTeamRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const { requestId, isApproved } = req.body;

    // Find the request
    const request = await TeamRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    // Make sure this request is for the current user
    if (request.toUser.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (isApproved) {
      // Approve - Add both users to a team
      request.status = 'approved';
      
      // Check if either user already has a team for this event
      let team = await Team.findOne({
        eventId: request.event,
        $or: [
          { members: request.fromUser },
          { members: request.toUser }
        ]
      });
      
      if (!team) {
        // Create new team
        const fromUser = await User.findById(request.fromUser);
        team = new Team({
          members: [request.fromUser, request.toUser],
          eventId: request.event,
          domain: fromUser.domain,
          category: fromUser.category,
          approved: [request.fromUser, request.toUser]
        });
      } else {
        // Add to existing team if not already a member
        if (!team.members.includes(request.fromUser)) {
          team.members.push(request.fromUser);
          team.approved.push(request.fromUser);
        }
        if (!team.members.includes(request.toUser)) {
          team.members.push(request.toUser);
          team.approved.push(request.toUser);
        }
      }
      
      await team.save();
    } else {
      // Deny
      request.status = 'denied';
    }
    
    await request.save();
    return res.json({ 
      success: true, 
      message: isApproved ? 'Team request approved' : 'Team request denied' 
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get all events the student has registered for
exports.getRegisteredEvents = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const registrations = await Registration.find({ userId })
      .populate('eventId', 'name host deadline description');
    
    return res.json(registrations);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get all teammates for the current student
exports.getTeammates = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Find all teams where the current user is a member
    const teams = await Team.find({ members: userId });
    
    // Collect all teammates info
    const teammatesPromises = teams.map(async (team) => {
      // Get all team members except current user
      const teammateIds = team.members.filter(
        memberId => memberId.toString() !== userId
      );
      
      // Get user details for each teammate
      const teammatesDetails = await Promise.all(
        teammateIds.map(async (tmId) => {
          const user = await User.findById(tmId)
            .select('name college state city domain category');
          
          const event = await Event.findById(team.eventId)
            .select('name host');
            
          return {
            _id: team._id + '-' + tmId, // Create unique ID
            user,
            event,
            teamId: team._id
          };
        })
      );
      
      return teammatesDetails;
    });
    
    const allTeammates = await Promise.all(teammatesPromises);
    // Flatten the array of arrays
    const teammates = allTeammates.flat();
    
    return res.json(teammates);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get mentors with the same domain as the student
exports.getMentorsByDomain = async (req, res) => {
  try {
    const studentId = req.user.id;
    const student = await User.findById(studentId);

    const mentors = await User.find({
      role: 'mentor',
      domain: student.domain
    }).select('name domain experience');

    return res.json(mentors);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Send request to a mentor
exports.sendMentorRequest = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { mentorId, introduction } = req.body;

    if (!mentorId || !introduction) {
      return res.status(400).json({
        success: false,
        message: 'Mentor ID and introduction are required'
      });
    }

    if (introduction.length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Introduction must be at least 10 characters long'
      });
    }

    // Check if already sent request
    const existingRequest = await MentorRequest.findOne({
      studentId,
      mentorId,
      status: 'pending'
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending request with this mentor'
      });
    }

    const mentor = await User.findOne({ _id: mentorId, role: 'mentor' });
    if (!mentor) {
      return res.status(400).json({
        success: false,
        message: 'Invalid mentor ID'
      });
    }

    const request = new MentorRequest({
      studentId,
      mentorId,
      introduction
    });

    await request.save();
    return res.json({ success: true, message: 'Mentor request sent successfully' });
  } catch (error) {
    console.error('Mentor request error:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message || 'Server error while sending mentor request'
    });
  }
};

// Get feedback from mentors
exports.getMentorFeedback = async (req, res) => {
  try {
    const studentId = req.user.id;
    const feedback = await Feedback.find({ studentId })
      .populate('mentorId', 'name')
      .sort({ createdAt: -1 })
      .lean();  // Convert to plain JS object

    // Format the response to include mentor name
    const formattedFeedback = feedback.map(fb => ({
      _id: fb._id,
      mentorName: fb.mentorId.name,
      feedback: fb.feedback,
      studentReply: fb.studentReply,
      createdAt: fb.createdAt,
      updatedAt: fb.updatedAt
    }));

    return res.json(formattedFeedback);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Submit response to mentor's feedback
exports.submitFeedbackResponse = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { feedbackId, response } = req.body;

    if (!feedbackId || !response) {
      return res.status(400).json({ 
        success: false, 
        message: 'Feedback ID and response are required' 
      });
    }

    const feedback = await Feedback.findById(feedbackId);
    
    if (!feedback) {
      return res.status(404).json({ 
        success: false, 
        message: 'Feedback not found' 
      });
    }

    // Verify this feedback was for this student
    if (feedback.studentId.toString() !== studentId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to respond to this feedback' 
      });
    }

    feedback.studentReply = response;
    feedback.updatedAt = new Date();
    await feedback.save();

    res.json({ 
      success: true, 
      message: 'Response submitted successfully',
      feedback: {
        _id: feedback._id,
        feedback: feedback.feedback,
        studentReply: feedback.studentReply,
        createdAt: feedback.createdAt,
        updatedAt: feedback.updatedAt
      }
    });
  } catch (error) {
    console.error('Error in submitFeedbackResponse:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Server error while submitting response' 
    });
  }
};