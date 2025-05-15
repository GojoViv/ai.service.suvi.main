import { Router } from "express";
import {
  httpCreateQuestion,
  httpCreateQuestionsBulk,
  httpGetQuestionById,
  httpUpdateQuestionById,
  httpDeleteQuestionById,
  httpListQuestions,
} from "./question.controller";

const questionRouter = Router();

questionRouter.post("/", httpCreateQuestion);
questionRouter.post("/bulk", httpCreateQuestionsBulk);
questionRouter.get("/", httpListQuestions);
questionRouter.get("/:id", httpGetQuestionById);
questionRouter.put("/:id", httpUpdateQuestionById);
questionRouter.delete("/:id", httpDeleteQuestionById);

export { questionRouter };
