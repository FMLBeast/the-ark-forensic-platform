export function errorHandler(err, req, res, next) {
  console.error('Error:', err);
  
  // Default error
  let error = {
    success: false,
    error: 'Internal server error',
    code: 'INTERNAL_ERROR'
  };
  
  // Handle specific error types
  if (err.name === 'ValidationError') {
    error = {
      success: false,
      error: 'Validation error',
      code: 'VALIDATION_ERROR',
      details: err.details || err.message
    };
    return res.status(400).json(error);
  }
  
  if (err.name === 'UnauthorizedError' || err.message === 'Unauthorized') {
    error = {
      success: false,
      error: 'Unauthorized access',
      code: 'UNAUTHORIZED'
    };
    return res.status(401).json(error);
  }
  
  if (err.name === 'ForbiddenError' || err.message === 'Forbidden') {
    error = {
      success: false,
      error: 'Access forbidden',
      code: 'FORBIDDEN'
    };
    return res.status(403).json(error);
  }
  
  if (err.name === 'NotFoundError' || err.message === 'Not Found') {
    error = {
      success: false,
      error: 'Resource not found',
      code: 'NOT_FOUND'
    };
    return res.status(404).json(error);
  }
  
  // Handle SQLite errors
  if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    error = {
      success: false,
      error: 'Resource already exists',
      code: 'DUPLICATE_RESOURCE'
    };
    return res.status(409).json(error);
  }
  
  // Handle file upload errors  
  if (err.code === 'LIMIT_FILE_SIZE') {
    error = {
      success: false,
      error: 'File too large',
      code: 'FILE_TOO_LARGE'
    };
    return res.status(413).json(error);
  }
  
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    error = {
      success: false,
      error: 'Unexpected file field',
      code: 'INVALID_FILE_FIELD'
    };
    return res.status(400).json(error);
  }
  
  // Development error details
  if (process.env.NODE_ENV === 'development') {
    error.stack = err.stack;
    error.details = err.message;
  }
  
  res.status(500).json(error);
}