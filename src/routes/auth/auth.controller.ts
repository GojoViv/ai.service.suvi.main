import { Response } from "express";
import jwt from "jsonwebtoken";

import { CLIENT_URL, JWT_SECRET } from "../../config/environment";
import EmployeeModel from "../../models/employee/employee.schema";
import logger from "../../utils/logger";
import { AuthenticationError, asyncHandler } from "../../utils/errors";

export const httpLogin = asyncHandler(async (req: any, res: Response) => {
  if (!req.user) {
    logger.warn("Login attempt without authentication");
    throw new AuthenticationError("User not authenticated");
  }

  const employee = await EmployeeModel.findById(req.user.id).lean().exec();

  if (!employee) {
    logger.warn("Login attempt with non-existent employee", {
      userId: req.user.id,
    });
    throw new AuthenticationError("Employee not found");
  }

  const token = jwt.sign(
    { id: employee._id, email: employee.email },
    JWT_SECRET ?? "",
    { expiresIn: "1h" }
  );

  // Sanitize employee data before sending
  const sanitizedEmployee = {
    ...employee,
    email: "REDACTED",
    password: undefined,
    sensitiveData: undefined,
  };

  logger.info("User logged in successfully", { userId: employee._id });
  res.status(200).json({
    success: true,
    message: "Login successful",
    user: sanitizedEmployee,
    token,
  });
});

export const httpLogout = asyncHandler(async (req: any, res: Response) => {
  logger.info("User logged out", { userId: req.user?.id });
  res.redirect(CLIENT_URL + "/login");
});
