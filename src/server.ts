import mongoose from "mongoose";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import { config } from "dotenv";
import { errorHandler, notFoundHandler, asyncHandler } from "./utils/errors";
import { requestLogger, stream } from "./utils/logger";
import logger from "./utils/logger";
import router from "./routes";

import { MONGODB_URI } from "./config/environment";

config();

// MongoDB connection handlers
mongoose.connection.once("open", () => {
  logger.info("MongoDB connection ready");
});

mongoose.connection.on("error", (err) => {
  logger.error("MongoDB connection error:", err);
});

const startApp = async () => {
  try {
    const uri = MONGODB_URI || "";
    await mongoose.connect(uri);

    const app = express();

    // Trust proxy for rate limiting behind reverse proxies
    app.set("trust proxy", 1);

    // Default CORS for protected routes
    app.use(cors());

    // Public CORS for sheet creation endpoint
    app.use(
      "/v1/api/sheet/create",
      cors({
        origin: true,
        methods: ["POST", "OPTIONS"],
        allowedHeaders: ["Content-Type"],
        credentials: true,
      })
    );

    // Middleware
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Request logging
    app.use(morgan("combined", { stream }));
    app.use(requestLogger);

    // Mount API routes
    app.use("/v1/api", router);

    // 404 handler
    app.use(notFoundHandler);

    // Error handling
    app.use(errorHandler);

    // Start server
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    logger.error("Failed to start application:", error);
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  logger.error("UNCAUGHT EXCEPTION! 💥 Shutting down...", err);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  logger.error("UNHANDLED REJECTION! 💥 Shutting down...", err);
  process.exit(1);
});

startApp();
