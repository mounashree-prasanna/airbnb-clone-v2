/**
 * Centralized error-handling middleware.
 * Catches unhandled exceptions and formats the error response consistently.
 */
export const errorHandler = (err, req, res, next) => {
  console.error("🔥 Error caught by middleware:");
  console.error(err.stack);

  // Default to 500 Internal Server Error if status not set
  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;

  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    // Show stack trace only in development (hide in production for security)
    stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
  });
};
