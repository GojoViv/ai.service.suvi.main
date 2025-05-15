import express, { Request, Response } from "express";
import session from "express-session";
import morgan from "morgan";
import cors from "cors";
import passport from "passport";
import router from "./routes";
import { PORT } from "./config/environment";
import "./config/passport";
import "./services/telegram/telegram.service";
import "./webhooks/github.webhooks";
import {
  securityHeaders,
  sanitizeInput,
  rateLimiter,
  errorHandler,
  securityConfig,
} from "./middleware/security";

const app = express();
const port = PORT || 8080;

// Apply security middleware
app.use(securityHeaders);
app.use(sanitizeInput);
app.use(rateLimiter);

// Session and authentication
app.use(
  session({
    secret: process.env.SESSION_SECRET || "secret",
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);
app.use(passport.initialize());
app.use(passport.session());

// CORS configuration
app.use(cors(securityConfig.cors));

// Logging
app.use(morgan("tiny"));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get("/", (req: Request, res: Response) => {
  res.json({ message: "Hello I m Suvi Bot and I Live" });
});

// API routes
app.use("/v1/api", router);

// Error handling middleware (should be last)
app.use(errorHandler);

export default () => {
  app.listen(port, async () => {
    console.log(`Server is running on port ${port}`);
  });
};
