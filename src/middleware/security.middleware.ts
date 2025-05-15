import { Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { body, validationResult, ValidationChain } from "express-validator";
import mongoSanitize from "express-mongo-sanitize";
import xss from "xss-clean";
import hpp from "hpp";
import { securityConfig } from "../config/security.config";

// Rate limiting middleware
export const rateLimiter = rateLimit(securityConfig.rateLimit);
export const authRateLimiter = rateLimit(securityConfig.authRateLimit);

// Security headers middleware
export const securityHeaders = helmet(securityConfig.helmet);

// Input sanitization middleware
export const sanitizeInput = [
  mongoSanitize(), // Sanitize MongoDB queries
  xss(), // Prevent XSS attacks
  hpp(), // Prevent HTTP Parameter Pollution
];

// Error handling middleware
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(err.stack);

  // Handle different types of errors
  if (err.name === "ValidationError") {
    return res.status(400).json({
      status: "error",
      message: "Validation error",
      errors: err.message,
    });
  }

  if (err.name === "UnauthorizedError") {
    return res.status(401).json({
      status: "error",
      message: "Unauthorized access",
    });
  }

  // Default error response
  res.status(500).json({
    status: "error",
    message: "Internal server error",
  });
};

// Input validation middleware
export const validateInput = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    await Promise.all(validations.map((validation) => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    return res.status(400).json({
      status: "error",
      message: "Validation failed",
      errors: errors.array(),
    });
  };
};

// Common validation rules
export const commonValidations = {
  email: {
    isEmail: true,
    normalizeEmail: true,
    trim: true,
    isLength: {
      options: { max: securityConfig.validation.email.maxLength },
    },
  },
  password: {
    isLength: {
      options: { min: securityConfig.validation.password.minLength },
    },
    matches: {
      options: new RegExp(
        `^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{${securityConfig.validation.password.minLength},}$`
      ),
    },
  },
  mongoId: {
    isMongoId: true,
  },
};
