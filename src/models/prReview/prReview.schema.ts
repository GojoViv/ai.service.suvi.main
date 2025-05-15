import mongoose from "mongoose";
const PRReviewSchema = new mongoose.Schema(
  {
    prId: String,
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },

    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
    },
    suviScore: {
      overall: Number,
      categories: {
        codeStyle: Number,
        bestPractices: Number,
        security: Number,
        performance: Number,
      },
    },
    changesRequested: [
      {
        category: String,
        severity: String,
        description: String,
      },
    ],

    linesOfCode: Number,
    filesChanged: Number,
    taskId: String,
  },
  {
    timestamps: true,
  }
);

PRReviewSchema.index({ employeeId: 1, timestamp: -1 });
// PRReviewSchema.index({ projectId: 1, timestamp: -1 });
PRReviewSchema.index({ taskId: 1 });

const reviewHistorySchema = new mongoose.Schema({
  prId: String,
  repository: String,
  path: String,
  fileHistories: [
    {
      fileHash: String,
      comments: [String],
      resolved: Boolean,
      lastReviewDate: Date,
    },
  ],
});

const ReviewHistory = mongoose.model("ReviewHistory", reviewHistorySchema);
export { ReviewHistory };
