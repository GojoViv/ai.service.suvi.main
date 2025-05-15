import { Router } from "express";
import { notionRouter } from "./notion/notion.router";
import { clientRouter } from "./client/client.router";
import { roleRouter } from "./role/role.router";
import { permissionRouter } from "./permission/permission.router";
import { questionRouter } from "./question/question.router";
import { searchRouter } from "./search/search.router";
import { hrRouter } from "./hr/hr.router";
import { chatRouter } from "./chat/chat.router";
import { docReviewRouter } from "./docReview/docReview.router";
import { assistantRouter } from "./assistant/assistant.router";
import qaRouter from "./qa/qa.router";
import { projectRouter } from "./project/project.router";
import { authRouter } from "./auth/auth.router";
import { sheetRouter } from "./sheet/sheet.router";
import {
  rateLimiter,
  authRateLimiter,
  securityHeaders,
  sanitizeInput,
  errorHandler,
} from "../middleware/security.middleware";

const router = Router();

// Apply security headers to all routes
router.use(securityHeaders);

// Apply input sanitization to all routes
router.use(sanitizeInput);

// Apply rate limiting to all routes
router.use(rateLimiter);

// Apply stricter rate limiting to auth routes
router.use("/auth", authRateLimiter);

// API routes
router.use("/notion", notionRouter);
router.use("/client", clientRouter);
router.use("/role", roleRouter);
router.use("/permission", permissionRouter);
router.use("/question", questionRouter);
router.use("/search", searchRouter);
router.use("/hr", hrRouter);
router.use("/chat", chatRouter);
router.use("/docReviewRouter", docReviewRouter);
router.use("/assistant", assistantRouter);
router.use("/qa", qaRouter);
router.use("/project", projectRouter);
router.use("/auth", authRouter);
router.use("/sheet", sheetRouter);

// Error handling middleware (should be last)
router.use(errorHandler);

export default router;
