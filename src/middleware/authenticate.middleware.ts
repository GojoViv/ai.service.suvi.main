import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/environment";
import Employee from "../models/employee/employee.schema";

const authenticate = (req: any, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).send("Unauthorized");
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).send("Unauthorized");
  }

  jwt.verify(token, JWT_SECRET ?? "", async (err: any, decoded: any) => {
    if (err) {
      return res.status(401).send("Unauthorized");
    }
    const employee = await Employee.findById(decoded.id);
    req.user = employee;
    next();
  });
};

export default authenticate;
