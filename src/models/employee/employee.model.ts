import Employee from "./employee.schema";
import logger from "../../utils/logger";
import { ExternalServiceError } from "../../utils/errors";

export const getUserByEmail = async (email: string) => {
  try {
    const user = await Employee.findOne({ email }).lean().exec();
    logger.info({ message: "Fetched user by email", email, user });
    return user;
  } catch (error) {
    logger.error({ message: "Error fetching user by email", email, error });
    throw new ExternalServiceError("Error fetching user by email");
  }
};
