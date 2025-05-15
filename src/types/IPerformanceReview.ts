import { Document, Schema, Types } from "mongoose";

export interface IPerformanceMetric extends Document {
  metricName: string;
  score: number;
  comments: string;
}

export interface IPerformanceReview extends Document {
  reviewPeriod: string;
  overallScore: number;
  metrics: IPerformanceMetric[];
  reviewerComments: string;
  reviewDate: Date;
}
