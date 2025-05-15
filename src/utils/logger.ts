import winston from "winston";
import { format } from "winston";
import path from "path";

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define log colors
const colors = {
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "white",
};

// Add colors to winston
winston.addColors(colors);

// Define the format for logs
const logFormat = format.combine(
  format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
  format.colorize({ all: true }),
  format.printf((info) => `${info.timestamp} ${info.level}: ${info.message}`)
);

// Define which transports the logger must use
const transports = [
  // Console transport for all logs
  new winston.transports.Console(),

  // File transport for error logs
  new winston.transports.File({
    filename: path.join("logs", "error.log"),
    level: "error",
  }),

  // File transport for all logs
  new winston.transports.File({
    filename: path.join("logs", "all.log"),
  }),
];

// Create the logger instance
const logger = winston.createLogger({
  level: process.env.NODE_ENV === "development" ? "debug" : "info",
  levels,
  format: logFormat,
  transports,
});

// Create a stream object for Morgan
export const stream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};

// Custom error handler
export class AppError extends Error {
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

// Error handling middleware
export const errorHandler = (
  err: Error | AppError,
  req: any,
  res: any,
  next: any
) => {
  if (err instanceof AppError) {
    logger.error(`[${err.statusCode}] ${err.message}`);
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  }

  // For unknown errors
  logger.error(`[500] ${err.message}`);
  return res.status(500).json({
    status: "error",
    message: "Something went wrong",
  });
};

// Request logging middleware
export const requestLogger = (req: any, res: any, next: any) => {
  logger.http(`${req.method} ${req.url}`);
  next();
};

// Export the logger instance
export default logger;
