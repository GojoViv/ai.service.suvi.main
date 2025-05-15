import mongoose, { Model } from "mongoose";
import { IPerformanceMetric, IPerformanceReview } from "../../types";
const { Schema, model } = mongoose;

// Performance Metric Schema
const performanceMetricSchema = new Schema<IPerformanceMetric>({
  metricName: { type: String, required: true },
  score: { type: Number, min: 1, max: 5, required: true },
  comments: String,
});

// Performance Review Schema
const performanceReviewSchema = new Schema<IPerformanceReview>(
  {
    reviewPeriod: { type: String, required: true },
    overallScore: { type: Number, min: 0, max: 10, required: true },
    metrics: [performanceMetricSchema],
    reviewerComments: String,
    reviewDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);
const PerformanceReviewModel: Model<IPerformanceReview> = model(
  "PerformanceReview",
  performanceReviewSchema
);

export { PerformanceReviewModel };
