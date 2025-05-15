// Importing Express types and question model functions
import { Request, Response } from "express";
import {
  createQuestion,
  createQuestionsBulk,
  getQuestionById,
  updateQuestionById,
  deleteQuestionById,
  listQuestions,
  addReviewToQuestion,
} from "../../models/question/question.model"; // Adjust the import path as necessary
import logger from "../../utils/logger";
import {
  NotFoundError,
  ValidationError,
  asyncHandler,
} from "../../utils/errors";

// Create a new Question
const httpCreateQuestion = asyncHandler(async (req: Request, res: Response) => {
  const questionData = req.body;
  const newQuestion = await createQuestion(questionData);

  logger.info("Question created successfully", { questionId: newQuestion.id });
  return res.status(201).json(newQuestion);
});

// Create Questions in Bulk
const httpCreateQuestionsBulk = asyncHandler(
  async (req: Request, res: Response) => {
    const questionsData = req.body;

    if (!Array.isArray(questionsData)) {
      logger.warn("Invalid bulk question creation input", {
        input: questionsData,
      });
      throw new ValidationError("Input must be an array of questions", []);
    }

    const newQuestions = await createQuestionsBulk(questionsData);
    logger.info("Bulk questions created successfully", {
      count: newQuestions.length,
    });
    return res.status(201).json(newQuestions);
  }
);

// Get a Question by ID
const httpGetQuestionById = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const question = await getQuestionById(id);

    if (!question) {
      logger.warn("Question not found", { questionId: id });
      throw new NotFoundError("Question not found");
    }

    logger.info("Question retrieved successfully", { questionId: id });
    return res.status(200).json(question);
  }
);

// Update a Question by ID
const httpUpdateQuestionById = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const updateData = req.body;
    const updatedQuestion = await updateQuestionById(id, updateData);

    if (!updatedQuestion) {
      logger.warn("Question not found for update", { questionId: id });
      throw new NotFoundError("Question not found");
    }

    logger.info("Question updated successfully", { questionId: id });
    return res.status(200).json(updatedQuestion);
  }
);

// Delete a Question by ID
const httpDeleteQuestionById = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const deletedQuestion = await deleteQuestionById(id);

    if (!deletedQuestion) {
      logger.warn("Question not found for deletion", { questionId: id });
      throw new NotFoundError("Question not found");
    }

    logger.info("Question deleted successfully", { questionId: id });
    return res.status(204).send();
  }
);

// List all Questions
const httpListQuestions = asyncHandler(async (req: Request, res: Response) => {
  const questions = await listQuestions();

  logger.info("Questions listed successfully", { count: questions.length });
  return res.status(200).json(questions);
});

// Exporting controller functions
export {
  httpCreateQuestion,
  httpCreateQuestionsBulk,
  httpGetQuestionById,
  httpUpdateQuestionById,
  httpDeleteQuestionById,
  httpListQuestions,
};
