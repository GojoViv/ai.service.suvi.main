// Importing necessary dependencies
import { PerformanceReviewModel } from "./performanceReview.schema"; // Adjust the import path as necessary
import { IPerformanceReview } from "../../types"; // Adjust the import path as necessary
import logger from "../../utils/logger";
import { ExternalServiceError } from "../../utils/errors";

// Create a new Performance Review
const createPerformanceReview = async (
  reviewData: Partial<IPerformanceReview>
): Promise<IPerformanceReview> => {
  try {
    const review = await PerformanceReviewModel.create(reviewData);
    logger.info({ message: "Performance review created", review });
    return review;
  } catch (error) {
    logger.error({ message: "Error creating performance review", error });
    throw new ExternalServiceError("Error creating performance review");
  }
};

// Get a Performance Review by ID
const getPerformanceReviewById = async (
  id: string
): Promise<IPerformanceReview | null> => {
  try {
    const review = await PerformanceReviewModel.findById(id);
    logger.info({ message: "Fetched performance review by ID", id, review });
    return review;
  } catch (error) {
    logger.error({
      message: "Error fetching performance review by ID",
      id,
      error,
    });
    throw new ExternalServiceError("Error fetching performance review by ID");
  }
};

// Get Performance Reviews by Review Period
const getPerformanceReviewsByPeriod = async (
  reviewPeriod: string
): Promise<IPerformanceReview[]> => {
  try {
    const reviews = await PerformanceReviewModel.find({ reviewPeriod });
    logger.info({
      message: "Fetched performance reviews by period",
      reviewPeriod,
      count: reviews.length,
    });
    return reviews;
  } catch (error) {
    logger.error({
      message: "Error fetching performance reviews by period",
      reviewPeriod,
      error,
    });
    throw new ExternalServiceError(
      "Error fetching performance reviews by period"
    );
  }
};

// Update a Performance Review by ID
const updatePerformanceReviewById = async (
  id: string,
  updateData: Partial<IPerformanceReview>,
  options = { new: true }
): Promise<IPerformanceReview | null> => {
  try {
    const updatedReview = await PerformanceReviewModel.findByIdAndUpdate(
      id,
      updateData,
      options
    );
    logger.info({ message: "Updated performance review", id, updatedReview });
    return updatedReview;
  } catch (error) {
    logger.error({ message: "Error updating performance review", id, error });
    throw new ExternalServiceError("Error updating performance review");
  }
};

// Delete a Performance Review by ID
const deletePerformanceReviewById = async (
  id: string
): Promise<IPerformanceReview | null> => {
  try {
    const deletedReview = await PerformanceReviewModel.findByIdAndDelete(id);
    logger.info({ message: "Deleted performance review", id, deletedReview });
    return deletedReview;
  } catch (error) {
    logger.error({ message: "Error deleting performance review", id, error });
    throw new ExternalServiceError("Error deleting performance review");
  }
};

// Exporting functions
export {
  createPerformanceReview,
  getPerformanceReviewById,
  getPerformanceReviewsByPeriod,
  updatePerformanceReviewById,
  deletePerformanceReviewById,
};
