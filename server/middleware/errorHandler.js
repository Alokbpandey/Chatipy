export const errorHandler = (err, req, res, next) => {
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });

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
  } else if (err.name === 'CastError') {
    error = {
      message: 'Invalid ID format',
      status: 400
    };
  } else if (err.code === 'ENOTFOUND') {
    error = {
      message: 'Network error - unable to reach the specified URL',
      status: 400
    };
  } else if (err.code === 'ECONNREFUSED') {
    error = {
      message: 'Connection refused - the website is not accessible',
      status: 400
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
    ...(error.details && { details: error.details }),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    timestamp: new Date().toISOString()
  });
};