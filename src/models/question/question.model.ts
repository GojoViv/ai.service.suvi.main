import { QuestionModel } from "./question.schema";

const createQuestion = async (questionData: any) => {
  return QuestionModel.create(questionData);
};

// Create Questions in Bulk
const createQuestionsBulk = async (questionsData: any) => {
  return QuestionModel.insertMany(questionsData);
};

// Get a Question by ID
const getQuestionById = async (id: any) => {
  return QuestionModel.findById(id);
};

// Update a Question by ID
const updateQuestionById = async (id: any, updateData: any) => {
  return QuestionModel.findByIdAndUpdate(id, updateData, { new: true });
};

// Delete a Question by ID
const deleteQuestionById = async (id: any) => {
  return QuestionModel.findByIdAndDelete(id);
};

// List all Questions
const listQuestions = async () => {
  return QuestionModel.find();
};

// Add Review Count and Last Reviewed Date to Question
const addReviewToQuestion = async (id: any) => {
  return QuestionModel.findByIdAndUpdate(
    id,
    {
      $inc: { reviewCount: 1 },
      $set: { lastReviewed: new Date() },
    },
    { new: true }
  );
};

export {
  createQuestion,
  createQuestionsBulk,
  getQuestionById,
  updateQuestionById,
  deleteQuestionById,
  listQuestions,
  addReviewToQuestion,
};
