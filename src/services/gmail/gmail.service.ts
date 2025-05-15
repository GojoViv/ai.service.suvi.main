import { openai } from "../../clients";
import { createPage } from "../../models/notion/notion.model";
import logger from "../../utils/logger";
import { ExternalServiceError, ValidationError } from "../../utils/errors";

function formatDateToYYYYMMDD(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-based, so add 1
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const storeLead = async (lead: any) => {
  try {
    if (!lead) return;

    const properties = {
      Subject: {
        title: [
          {
            text: {
              content: lead.subject ?? "",
            },
          },
        ],
      },
      From: {
        email: lead.from ?? "",
      },
      Date: {
        date: {
          start: formatDateToYYYYMMDD(new Date(lead.date ?? "")),
        },
      },
      Keywords: {
        rich_text: [
          {
            text: {
              content: lead.tags ?? "",
            },
          },
        ],
      },
      Insights: {
        rich_text: [
          {
            text: {
              content: lead.insights ?? "",
            },
          },
        ],
      },
    };

    await createPage(
      { database_id: "0e998c4c60d043b693b5f897659dd175" },
      properties,
      []
    );
  } catch (error) {
    throw error;
  }
};

export const identifyLeads = async (email: any) => {
  try {
    const tools: any = [
      {
        type: "function",
        function: {
          name: "store_lead",
          description:
            "Store a lead object containing details like from, date, subject, tags, and insights.",
          parameters: {
            type: "object",
            properties: {
              lead: {
                type: "object",
                properties: {
                  from: {
                    type: "string",
                    description: "The email address of the lead.",
                  },
                  date: {
                    type: "string",
                    description: "The date of the lead entry.",
                  },
                  subject: {
                    type: "string",
                    description: "The subject or title of the lead.",
                  },
                  tags: {
                    type: "string",
                    description:
                      "Comma separated string of relvant tags extracted from the body",
                  },
                  insights: {
                    type: "string",
                    description:
                      "Generate insights from the query or the body in points form",
                  },
                },
                required: ["from", "date", "subject", "tags", "insights"],
              },
            },
            required: ["lead"],
          },
        },
      },
    ];

    const messages: any = [
      {
        role: "system",
        content: `
        Based on the email data given, reply to call a function.
        Rules to follow:
         - Send the lead if and only if its a genuine inquiry
         - If it does not construe as a lead return null
         - Generate insights which are short and bullet sized
        `,
      },
      {
        role: "user",
        content: `Email: ${JSON.stringify(email)}\n`,
      },
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: messages,
      tools: tools,
      tool_choice: {
        function: { name: "store_lead" },
        type: "function",
      },
    });
    const responseMessage = response.choices[0].message;
    const toolCalls = responseMessage.tool_calls;

    if (toolCalls) {
      const availableFunctions: any = {
        store_lead: storeLead,
      };

      for (const toolCall of toolCalls) {
        const functionName = toolCall.function.name;
        const functionToCall = availableFunctions[functionName];
        const functionArgs = JSON.parse(toolCall.function.arguments);

        const functionResponse = functionToCall(functionArgs.lead);

        return functionResponse;
      }
    } else {
      console.log("No tool called");
    }
  } catch (error) {
    console.log(error);
  }
};

export const processEmails = async (emails: any[]): Promise<any> => {
  try {
    logger.info("Starting email processing", {
      emailCount: emails.length,
    });

    if (!emails.length) {
      logger.warn("No emails to process");
      throw new ValidationError("No emails provided for processing", []);
    }

    return "";
  } catch (error) {
    logger.error("Failed to process emails", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    throw new ExternalServiceError("Failed to process emails");
  }
};

export const handleGmailError = async (error: Error): Promise<any> => {
  logger.error("Gmail processing error occurred", {
    error: error.message,
    stack: error.stack,
  });

  return {
    status: "error",
    message: "An error occurred while processing emails",
    details: error.message,
  };
};
