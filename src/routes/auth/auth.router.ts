import { Router, Request, Response } from "express";
import passport from "passport";
import { httpLogin, httpLogout } from "./auth.controller";
import { CLIENT_URL, JWT_SECRET } from "../../config/environment";
import jwt from "jsonwebtoken";
import authenticate from "../../middleware/authenticate.middleware";
import {
  validateInput,
  commonValidations,
  authRateLimiter,
} from "../../middleware/security.middleware";
import { body } from "express-validator";
import { IEmployee } from "../../types/IEmployee";

interface AuthenticatedRequest extends Request {
  user?: IEmployee;
}

const authRouter = Router();

// Apply stricter rate limiting to auth routes
authRouter.use(authRateLimiter);

// Login route with input validation
authRouter.post(
  "/login",
  validateInput([
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 8 }),
  ]),
  passport.authenticate("local", { session: false }),
  (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication failed" });
    }

    const token = jwt.sign(
      { id: req.user._id },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "24h" }
    );
    res.json({ token });
  }
);

// Logout route
authRouter.post("/logout", (req: Request, res: Response) => {
  req.logout(() => {
    res.json({ message: "Logged out successfully" });
  });
});

// Google OAuth routes
authRouter.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })
);

authRouter.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication failed" });
    }

    const token = jwt.sign(
      { id: req.user._id },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "24h" }
    );

    const clientUrl = process.env.CLIENT_URL;
    if (!clientUrl) {
      throw new Error("CLIENT_URL is not configured");
    }

    res.redirect(`${clientUrl}/auth/callback?token=${token}`);
  }
);

export { authRouter };
