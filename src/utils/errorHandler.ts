import { Request, Response, NextFunction } from "express";
import logger from "./logger";

// Custom error class for API errors
export class APIError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

// Error handler middleware
export const errorHandler = (
  err: Error | APIError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof APIError) {
    logger.error({
      message: err.message,
      statusCode: err.statusCode,
      path: req.path,
      method: req.method,
      isOperational: err.isOperational,
    });

    return res.status(err.statusCode).json({
      status: "error",
      message: err.message,
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
  }

  // Handle unexpected errors
  logger.error({
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  return res.status(500).json({
    status: "error",
    message: "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

// Async handler wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Common error types
export const Errors = {
  BadRequest: (message: string) => new APIError(400, message),
  Unauthorized: (message: string) => new APIError(401, message),
  Forbidden: (message: string) => new APIError(403, message),
  NotFound: (message: string) => new APIError(404, message),
  Conflict: (message: string) => new APIError(409, message),
  InternalServer: (message: string) => new APIError(500, message),
};
