import { fetchDocumentContent } from "../../models/googleDocs/googleDocs.model";

import { QuestionModel } from "../../models/question/question.schema";
import { sendEmail } from "../../clients/google.client";
import { openai } from "../../clients";
import logger from "../../utils/logger";
import { ExternalServiceError, ValidationError } from "../../utils/errors";

const ArithmeticAndWordProblemsPdf = `
Arithmetic + Word Problems 
PERCENTAGES To express a% as a fraction divide it by 100: a% = a/100 
To express a fraction as a percent multiply it by 100: a/b = [(a/b) 100] % 
To express percentage as a decimal we remove the symbol % and shift the decimal point by two 
places to the left. For example
10% can be expressed as 0.1. 
6.5% = 0.065 etc. 
To express decimal as a percentage we shift the decimal point by two places to the right and write the 
number obtained with the symbol % or simply we multiply the decimal with 100. Similarly, 0.7 = 70%. 
Increase % = [ Increase / Original value] 100% 
Decrease % = [ Decrease / Original value] 100% 
Change % = [ Change / Original value] 100% 
In increase %, the denominator is smaller, whereas in decrease %, the denominator is larger.

GENERAL CONCEPTS IN PERCENTAGES:
Let's start with a number X (= 1 X)
X increased by 10% would become X + 0.1 X = 1.1 X 
X increased by 1% would become X + 0.01 X = 1.01 X 
X increased by 0.1% would become X + 0.001 X = 1.001 X 
X decreased by 10% would become X – 0.1 X = 0.9 X 
X decreased by 1% would become X – 0.01 X = 0.99 X 
X decreased by 0.1% would become X – 0.001 X = 0.999 X 
X increased by 200% would become X + 2X = 3X 
X decreased by 300% would become X – 3X = –2X 
Also, let us remember that:
2 = 200% (or 100% increase) 
3 = 300% (or 200% increase) 
3.26 = 326% (means 226% increase)
Fourfold (4 times) = 400 % of original = 300% increase 
10 times means 1000% of the original means 900% increase 
0.6 means 60% of the original means 40% decrease 
0.31 times means 31% of the original means 69% decrease etc.
1/2 = 50% 
3/2 = 1 + 1/2 = 100 + 50 = 150% 
5/2 = 2 + 1/2 = 200 + 50 = 250% etc. 
2/3 = 1 – 1/3 = 100 – 33.33 = 66.66% 
4/3 = 1 + 1/3 = 100 + 33.33 = 133.33%, 
5/3 = 1 + 2/3 = 100 + 66.66 % = 166.66% 
7/3 = 2 + 1/3 = 200 + 33.33 = 233.33% 
8/3 = 2 + 2/3 = 200 + 66.66 = 3 – 1/3 = 300 – 33.33 = 266.66% 
1/4 = 25% 
3/4 = 75% 
5/4 = (1 + 1/4) = 125% (= 25% increase) 
7/4 = (1 + 3/4 = 2 – 1/4) = 175% (= 75% increase) 
9/4 = (2 + 1/4) = 225% (= 125% increase) 
11/4 = 275% = (175% increase) 
1/5 = 20% 
2/5 = 40% 
3/5 = 60% 
4/5 = 80% 
6/5 = (1 + 1/5) = 120% 
7/5 = (1 + 2/5) = 140% etc. 
1/6 = 16.66% 
5/6 = 83.33% 
7/6 (1 + 1/6) = 116.66% 
11/6 = 183.33% 
1/8 = 12.5% 
3/8 = 37.5% 
5/8 = 62.5% 
7/8 = 87.5% 
9/8 = (1 + 1/8) = 112.5% 
11/8 = (1 + 3/8) = 137.5% 
13/8 = 162.5% 
15/8 = 187.5% 
1/9 = 11.11% 
2/9 = 22.22% 
4/9 = 44.44% 
5/9 = 55.55% 
7/9 = 77.77% 
8/9 = 88.88% 
10/9 = (1 + 1/9) = 111.11% 
11/9 = (1 + 2/9) = 122.22% etc. 
If the present population of a town is p and if there is an increase of X% per annum. Then:
(i) Population after n years = p [1 + (X/100)]n
(ii) Population n years ago = p / [1 + (X/100)]n
If the population of a town (or value of a machine) decreases at R% per annum, then: 
i. population (or value of machine) after n years = p [1 – (R/100)]n
ii. population (or value of machine) n years ago = p / [1 –(R/100)]n
Profit % = (Profit /CP) x 100% 
Loss % = (Loss/CP) x 100 % 
In problems on DISCOUNT, remember the following:
Marked price is the price listed on the article (called list price). 
Discount is calculated on Marked price and NOT on Cost price.
So, Marked Price – Discount = Sale Price. Also Cost Price + Profit = Sale Price.`;

const reviewDocumentGenerateFlashcards = async () => {
  const questions = await QuestionModel.find().sort({
    reviewCount: 1,
  });

  if (questions.length > 0) {
    const pickedQuestions = [];
    const questionIds = new Set();

    // Pick 5 questions based on review count and last reviewed date
    for (const question of questions) {
      if (pickedQuestions.length >= 10) break;
      if (!questionIds.has(question._id.toString())) {
        pickedQuestions.push(question);
        questionIds.add(question._id.toString());
      }
    }

    const emailContent = `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>AAJ ke SAWAL</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                background-color: #f4f4f9;
                margin: 0;
                padding: 0;
            }
            h1 {
                text-align: center;
                color: #333;
                margin-top: 20px;
            }
            .question-container {
                width: 80%;
                margin: 20px auto;
                background-color: #fff;
                padding: 20px;
                box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                border-radius: 8px;
            }
            h3 {
                color: #444;
            }
            p {
                font-size: 16px;
                color: #666;
            }
            details {
                background-color: #f9f9f9;
                padding: 10px;
                border: 1px solid #ddd;
                border-radius: 4px;
                margin-top: 10px;
            }
            details summary {
                font-size: 16px;
                font-weight: bold;
                cursor: pointer;
                outline: none;
                list-style: none;
            }
            details[open] summary {
                background-color: #e6e6e6;
            }
            details div {
                padding: 10px;
                border-top: 1px solid #ddd;
            }
            hr {
                border: 0;
                height: 1px;
                background: #ddd;
                margin: 20px 0;
            }
        </style>
    </head>
    <body>
    
        <h1>AAJ ke SAWAL</h1>
        ${questions
          .map(
            (q, index) => `
            <div class="question-container">
                <h3>Question ${index + 1}</h3>
                <p>${q.questionText}</p>
                ${q.options
                  .map(
                    (opt, i) => `<p>${String.fromCharCode(65 + i)}. ${opt}</p>`
                  )
                  .join("")}
                <details>
                  <summary>Show Solution</summary>
                  <div>
                    <p><strong>Correct Option:</strong> ${"Commented code"}</p>
                    <p><strong>Solution:</strong> ${q.solution}</p>
                  </div>
                </details>
                <hr>
            </div>
          `
          )
          .join("")}
    
    </body>
    </html>
    `;

    await sendEmail({
      from: "admin@company.com",
      to: "support@company.com",
      subject: "AAJ KE SAWAL",
      html: emailContent,
      cc: "",
    });
  }
};

const generatePrepInsights = async (
  // chatHistory: { role: "user" | "assistant"; content: string }[],
  query: string
) => {
  const prompt = `
  ### You are SUVI, an informational bot, for GMAT preparation 
      You will answer the user questions based on provided messages.
      If you do not know the answer, say so.
      This is the theory related to the GMAT prep answer accordingly:
    ${ArithmeticAndWordProblemsPdf}
  #### Messages:
  
  #### Output:
  `;
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: prompt,
      },
      // ...chatHistory,
      { role: "user", content: query },
    ],
  });

  return response.choices[0].message.content;
};

export { reviewDocumentGenerateFlashcards, generatePrepInsights };
