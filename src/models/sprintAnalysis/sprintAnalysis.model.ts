import { SprintAnalysis } from "./sprintAnalysis.schema"; // Adjust path as necessary

const createSprintAnalysis = async (sprintData: any) => {
  try {
    const sprintAnalysis = new SprintAnalysis(sprintData);
    await sprintAnalysis.save();
    console.log("Sprint analysis entry created successfully");
    return sprintAnalysis;
  } catch (error) {
    console.error("Error creating sprint analysis entry:", error);
    throw error;
  }
};

const getSprintAnalysisById = async (sprintId: any) => {
  try {
    const sprintAnalysis = await SprintAnalysis.findOne({ sprintId });
    if (!sprintAnalysis) {
      console.log("Sprint analysis not found");
      return null;
    }
    return sprintAnalysis;
  } catch (error) {
    console.error("Error retrieving sprint analysis:", error);
    throw error;
  }
};

const updateDailyMetrics = async (
  sprintId: any,
  date: any,
  updatedMetrics: any
) => {
  try {
    const sprintAnalysis = await SprintAnalysis.findOneAndUpdate(
      { sprintId, "dailyMetrics.date": date },
      { $set: { "dailyMetrics.$": updatedMetrics } },
      { new: true }
    );
    if (!sprintAnalysis) {
      console.log("Sprint analysis or date not found");
      return null;
    }
    console.log("Daily metrics updated successfully");
    // Sanitize sensitive data before returning
    const sanitizedAnalysis = {
      ...sprintAnalysis.toObject(),
      dailyMetrics: sprintAnalysis.dailyMetrics.map((metric) => ({
        ...metric,
        sensitiveData: "REDACTED",
      })),
    };
    return sanitizedAnalysis;
  } catch (error) {
    console.error("Error updating daily metrics");
    throw error;
  }
};

const deleteSprintAnalysis = async (sprintId: any) => {
  try {
    const result = await SprintAnalysis.findOneAndDelete({ sprintId });
    if (result) {
      console.log("Sprint analysis deleted successfully");
    } else {
      console.log("Sprint analysis not found");
    }
    return result;
  } catch (error) {
    console.error("Error deleting sprint analysis:", error);
    throw error;
  }
};

export {
  createSprintAnalysis,
  getSprintAnalysisById,
  updateDailyMetrics,
  deleteSprintAnalysis,
};
