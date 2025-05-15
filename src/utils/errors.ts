import { Request, Response, NextFunction } from "express";
import logger from "./logger";

// Base Error Class
export class BaseError extends Error {
  statusCode: number;
  status: string;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Validation Error
export class ValidationError extends BaseError {
  errors: any[];

  constructor(message: string, errors: any[]) {
    super(message, 400);
    this.errors = errors;
  }
}

// Authentication Error
export class AuthenticationError extends BaseError {
  constructor(message: string = "Authentication failed") {
    super(message, 401);
  }
}

// Authorization Error
export class AuthorizationError extends BaseError {
  constructor(message: string = "Not authorized to perform this action") {
    super(message, 403);
  }
}

// Not Found Error
export class NotFoundError extends BaseError {
  constructor(message: string = "Resource not found") {
    super(message, 404);
  }
}

// Database Error
export class DatabaseError extends BaseError {
  constructor(message: string = "Database operation failed") {
    super(message, 500);
  }
}

// External Service Error
export class ExternalServiceError extends BaseError {
  constructor(message: string = "External service error") {
    super(message, 502);
  }
}

// Error Handler Middleware
export const errorHandler = (
  err: Error | BaseError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log the error
  logger.error(`[${err.name}] ${err.message}`, {
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    query: req.query,
    params: req.params,
  });

  // Handle known errors
  if (err instanceof BaseError) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      ...(err instanceof ValidationError && { errors: err.errors }),
    });
  }

  // Handle mongoose validation errors
  if (err.name === "ValidationError") {
    const validationError = new ValidationError(
      "Validation Error",
      Object.values((err as any).errors).map((e: any) => ({
        field: e.path,
        message: e.message,
      }))
    );
    return res.status(validationError.statusCode).json({
      status: validationError.status,
      message: validationError.message,
      errors: validationError.errors,
    });
  }

  // Handle mongoose duplicate key errors
  if (err.name === "MongoError" && (err as any).code === 11000) {
    const duplicateError = new ValidationError(
      "Duplicate field value entered",
      [
        {
          field: Object.keys((err as any).keyPattern)[0],
          message: "This value already exists",
        },
      ]
    );
    return res.status(duplicateError.statusCode).json({
      status: duplicateError.status,
      message: duplicateError.message,
      errors: duplicateError.errors,
    });
  }

  // Handle JWT errors
  if (err.name === "JsonWebTokenError") {
    const jwtError = new AuthenticationError("Invalid token");
    return res.status(jwtError.statusCode).json({
      status: jwtError.status,
      message: jwtError.message,
    });
  }

  // Handle JWT expired errors
  if (err.name === "TokenExpiredError") {
    const jwtError = new AuthenticationError("Token expired");
    return res.status(jwtError.statusCode).json({
      status: jwtError.status,
      message: jwtError.message,
    });
  }

  // Handle unknown errors
  const unknownError = new BaseError("Something went wrong", 500);
  return res.status(unknownError.statusCode).json({
    status: unknownError.status,
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : unknownError.message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

// Not Found Handler
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  next(new NotFoundError(`Can't find ${req.originalUrl} on this server!`));
};

// Async Handler
export const asyncHandler =
  (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
