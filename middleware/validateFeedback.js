const validateFeedback = (req, res, next) => {
  const { feedback } = req.body;
  
  if (!feedback || typeof feedback !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Feedback text is required'
    });
  }

  if (feedback.trim().length < 10) {
    return res.status(400).json({
      success: false,
      message: 'Feedback must be at least 10 characters long'
    });
  }

  if (feedback.trim().length > 1000) {
    return res.status(400).json({
      success: false,
      message: 'Feedback cannot exceed 1000 characters'
    });
  }

  next();
};

const validateFeedbackResponse = (req, res, next) => {
  const { response } = req.body;
  
  if (!response || typeof response !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Response text is required'
    });
  }

  if (response.trim().length < 5) {
    return res.status(400).json({
      success: false,
      message: 'Response must be at least 5 characters long'
    });
  }

  if (response.trim().length > 1000) {
    return res.status(400).json({
      success: false,
      message: 'Response cannot exceed 1000 characters'
    });
  }

  next();
};

module.exports = {
  validateFeedback,
  validateFeedbackResponse
};