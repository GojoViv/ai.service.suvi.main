import Email from "./email.schema";
import logger from "../../utils/logger";
import { ExternalServiceError } from "../../utils/errors";

const emailModel = {
  /**
   * Create a new email document.
   * @param {Object} emailData - Email data to insert.
   * @returns {Object} - Created email document.
   */
  async createEmail(emailData: any) {
    try {
      const email = new Email(emailData);
      return await email.save();
    } catch (error) {
      logger.error({ message: "Error creating email", error });
      throw new ExternalServiceError("Error creating email");
    }
  },

  /**
   * Retrieve emails with optional filters.
   * @param {Object} filters - MongoDB filters for querying emails.
   * @param {Object} projection - Fields to include/exclude (optional).
   * @returns {Array} - List of matching emails.
   */
  async getEmails(filters = {}, projection = {}) {
    try {
      return await Email.find(filters, projection).lean();
    } catch (error) {
      logger.error({ message: "Error retrieving emails", error });
      throw new ExternalServiceError("Error retrieving emails");
    }
  },

  /**
   * Retrieve a single email by its ID.
   * @param {String} emailId - Unique email ID.
   * @returns {Object} - Matching email document.
   */
  async getEmailById(emailId: any) {
    try {
      return await Email.findOne({ emailId }).lean();
    } catch (error) {
      logger.error({ message: "Error retrieving email by ID", error });
      throw new ExternalServiceError("Error retrieving email by ID");
    }
  },

  /**
   * Update an email document by its ID.
   * @param {String} emailId - Unique email ID to update.
   * @param {Object} updateData - Fields to update.
   * @returns {Object} - Updated email document.
   */
  async updateEmail(emailId: any, updateData: any) {
    try {
      return await Email.findOneAndUpdate(
        { emailId },
        { $set: updateData },
        { new: true } // Return the updated document
      ).lean();
    } catch (error) {
      logger.error({ message: "Error updating email", error });
      throw new ExternalServiceError("Error updating email");
    }
  },

  /**
   * Delete an email document by its ID.
   * @param {String} emailId - Unique email ID to delete.
   * @returns {Object} - Deleted email document.
   */
  async deleteEmail(emailId: any) {
    try {
      return await Email.findOneAndDelete({ emailId }).lean();
    } catch (error) {
      logger.error({ message: "Error deleting email", error });
      throw new ExternalServiceError("Error deleting email");
    }
  },

  /**
   * Count the number of emails matching a filter.
   * @param {Object} filters - MongoDB filters for querying emails.
   * @returns {Number} - Count of matching emails.
   */
  async countEmails(filters = {}) {
    try {
      return await Email.countDocuments(filters);
    } catch (error) {
      logger.error({ message: "Error counting emails", error });
      throw new ExternalServiceError("Error counting emails");
    }
  },
};

export default emailModel;
