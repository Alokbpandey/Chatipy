export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Default error
  let error = {
    message: 'Internal server error',
    status: 500
  };

  // Handle specific error types
  if (err.name === 'ValidationError') {
    error = {
      message: 'Validation error',
      details: err.message,
      status: 400
    };
  } else if (err.name === 'UnauthorizedError') {
    error = {
      message: 'Unauthorized access',
      status: 401
    };
  } else if (err.message) {
    error.message = err.message;
  }

  // Set status code
  if (err.status) {
    error.status = err.status;
  }

  res.status(error.status).json({
    error: error.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    timestamp: new Date().toISOString()
  });
};