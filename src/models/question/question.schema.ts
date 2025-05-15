import mongoose from "mongoose";

const QuestionSchema = new mongoose.Schema(
  {
    questionText: String,
    options: [String],
    correctOptions: [String],
    solution: String,
    solutionUrl: String,
    userAnswer: String,
    topic: String,
    subTopic: String,
    reviewCount: { type: Number, default: 0 },
    imageUrl: String,
  },
  {
    timestamps: true,
  }
);

export const QuestionModel = mongoose.model("Question", QuestionSchema);
