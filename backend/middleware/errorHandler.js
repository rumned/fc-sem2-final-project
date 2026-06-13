const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Server error";

  // Mongoose: bad ObjectId (e.g. /events/not-a-valid-id)
  if (err.name === "CastError") {
    statusCode = 404;
    message = `Resource not found`;
  }

  // Mongoose: duplicate key (e.g. registering with existing email)
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue)[0];
    message = `${field.charAt(0).toUpperCase() + field.slice(1)} already in use`;
  }

  // Mongoose: validation error (e.g. missing required field)
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(", ");
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token";
  }
  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token expired — please log in again";
  }

  res.status(statusCode).json({ success: false, message });
};

module.exports = errorHandler;
