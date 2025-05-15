import { Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import xss from "xss-clean";
import hpp from "hpp";
import { validationResult, ValidationChain } from "express-validator";

// Security configuration
const securityConfig = {
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: "Too many requests from this IP, please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
  },
  authRateLimit: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // Limit each IP to 5 login attempts per hour
    message: "Too many login attempts, please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
  },
  helmet: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: true,
    crossOriginOpenerPolicy: true,
    crossOriginResourcePolicy: { policy: "same-site" as const },
    dnsPrefetchControl: { allow: false },
    frameguard: { action: "deny" as const },
    hidePoweredBy: true,
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    ieNoOpen: true,
    noSniff: true,
    originAgentCluster: true,
    permittedCrossDomainPolicies: { permittedPolicies: "none" as const },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" as const },
    xssFilter: true,
  },
  cors: {
    origin: process.env.CLIENT_URL || "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    maxAge: 86400, // 24 hours
  },
  validation: {
    password: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
    },
    email: {
      maxLength: 254,
    },
  },
};

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

export { securityConfig };
