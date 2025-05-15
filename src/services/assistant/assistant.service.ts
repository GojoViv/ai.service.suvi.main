import { openai } from "../../clients";
import { createEvent, sendEmail } from "../../clients/google.client";
import { Boards } from "../../constants/boards";
import { createPage } from "../../models/notion/notion.model";
import { chatWithSuvi } from "../chatbot/chatbot.service";
import logger from "../../utils/logger";
import { ExternalServiceError, ValidationError } from "../../utils/errors";

const ASSISTANT_ID = "[ASSISTANT_ID]";

type QueryType = "ticket" | "mail" | "meet" | "query" | "follow_up";
type Platform = "telegram" | "slack";

const storeTicket = async (ticket: any) => {
  try {
    if (!ticket) return;

    const properties = {
      "Task name": {
        title: [
          {
            text: {
              content: ticket.taskName ?? "",
            },
          },
        ],
      },
    };

    const children = [
      {
        object: "block",
        type: "paragraph",
        paragraph: {
          rich_text: [
            {
              text: {
                content: ticket.taskDescription ?? "",
              },
            },
          ],
        },
      },
    ];

    const page = await createPage(
      { database_id: Boards.TASKS },
      properties,
      children
    );
  } catch (error) {
    throw error;
  }
};

export const answerQuery = async (
  query: string,
  type: QueryType,
  channelId: string,
  botId: string,
  ticket?: any,
  email?: any,
  meet?: any,
  platform?: Platform
) => {
  console.log(type);

  switch (type) {
    case "follow_up":
      return query;
    case "ticket":
      await storeTicket(ticket);
      return "Ticket created";
    case "mail":
      await sendEmail({
        from: undefined,
        to: email.to ?? "[TO_EMAIL]",
        subject: email.subject ?? "Suvi",
        html: email.html ?? "",
        cc: email.cc ?? "",
      });
      return "Email sent";
    case "meet":
      const event = {
        ...meet,
        attendees: meet.attendees.map((attendee: string) => ({
          email: attendee,
        })),
      };
      await createEvent("primary", event);
      return "Scheduled meet";
    case "query":
    default:
      return await chatWithSuvi("", []);
  }
};

export const createAssistant = async () => {
  return await openai.beta.assistants.update(ASSISTANT_ID, {
    model: "gpt-4o",
    instructions:
      "You are a Bot which answers the user's query based on the type of query with the data given to you by calling the tool given (answer_query). Ask as many follow-up questions as you like before deciding your final action. Follow-up questions should be tailored to the type of query as follows: \n\n1. **Ticket**: Ask for additional details about the issue, such as priority, category, or specific description. \n2. **Mail**: Inquire about the recipient, subject, or any specific details that need to be included in the email. \n3. **Meet**: Request information about the date, time, participants, or agenda of the meeting. \n4. **Follow_up**: Clarify the context of the previous interaction or ask for more details related to the ongoing discussion. \n5. **Query**: Gather any additional information needed to provide a comprehensive answer to the user's question. If any of these above cases matches then set 'type' argument as 'follow_up'. Any followup question can be forwarded through 'query' argument",
    name: "Talk to SUVI",
    tools: [
      {
        type: "function",
        function: {
          name: "answer_query",
          description: "Answer the user's query",
          parameters: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "The user's query",
              },
              type: {
                type: "string",
                description: "The type of user query",
                enum: ["ticket", "mail", "meet", "follow_up", "query"],
              },
              channelId: {
                type: "string",
                description:
                  "The channel id of the channel. This is required if query type is channel.",
              },
              email: {
                type: "object",
                properties: {
                  to: {
                    type: "string",
                    description: "Email address of the recepient",
                  },
                  subject: {
                    type: "string",
                    description: "Subject of the email",
                  },
                  html: {
                    type: "string",
                    description: "Body of the email",
                  },
                },
              },
              meet: {
                type: "object",
                properties: {
                  summary: {
                    type: "string",
                    description: "Description of the google meet",
                  },
                  start: {
                    type: "object",
                    properties: {
                      dateTime: {
                        type: "string",
                        description: "Start date time of the meeting",
                      },
                      timeZone: {
                        type: "string",
                        description:
                          "Time zone of the meeting (standard format), defaults to Asia/Kolkata",
                      },
                    },
                    required: ["dateTime", "timeZone"],
                  },
                  end: {
                    type: "object",
                    properties: {
                      dateTime: {
                        type: "string",
                        description: "End date time of the meeting",
                      },
                      timeZone: {
                        type: "string",
                        description:
                          "Time zone of the meeting (standard format), defaults to IST",
                      },
                    },
                    required: ["dateTime", "timeZone"],
                  },
                  attendees: {
                    type: "array",
                    items: {
                      types: "string",
                      description: "Email of attendee",
                    },
                    description: "List of attendees",
                  },
                },
                required: ["summary, start, end, attendees"],
              },
              ticket: {
                type: "object",
                properties: {
                  taskName: {
                    type: "string",
                    description: "The title of the task",
                  },
                  taskDescription: {
                    type: "string",
                    description: "The description of the task",
                  },
                },
                required: ["taskName, taskDescription"],
              },
            },
            required: ["query", "type"],
          },
        },
      },
    ],
  });
};

export const listAssistants = async () => {
  const suviAssistants = await openai.beta.assistants.list();
  console.log(suviAssistants);
};

export const createThread = async () => {
  return await openai.beta.threads.create();
};

export const getThreadMessages = async (threadId: string) => {
  return await openai.beta.threads.messages.list(threadId);
};

export const talkToSuvi = async (
  threadId: string,
  userMessage: string,
  results: any
) => {
  await openai.beta.threads.messages.create(threadId, {
    role: "user",
    content: `USER QUERY: ${userMessage}\nCONTEXT FOR THE QUERY: ${JSON.stringify(
      results
    )}`,
  });
  // const runs = await openai.beta.threads.runs.list(threadId);
  // const run = runs.data[runs.data.length - 1];
  // await openai.beta.threads.runs.cancel(threadId, run.id);

  const myRun = await openai.beta.threads.runs.create(threadId, {
    assistant_id: ASSISTANT_ID,
    tool_choice: { function: { name: "answer_query" }, type: "function" },
  });

  const checkRun = async () => {
    return new Promise((resolve, reject) => {
      const interval = setInterval(async () => {
        const retrieveRun = await openai.beta.threads.runs.retrieve(
          threadId,
          myRun.id
        );

        if (retrieveRun.status === "requires_action") {
          if (retrieveRun.required_action?.type === "submit_tool_outputs") {
            const tool_call =
              retrieveRun.required_action?.submit_tool_outputs.tool_calls[0];
            try {
              if (tool_call) {
                const functionArgs = JSON.parse(tool_call.function.arguments);
                const response = await answerQuery(
                  functionArgs.query,
                  functionArgs.type,
                  functionArgs.channelId,
                  "",
                  functionArgs.ticket,
                  functionArgs.email,
                  functionArgs.meet
                );
                await openai.beta.threads.runs.submitToolOutputs(
                  threadId,
                  myRun.id,
                  {
                    tool_outputs: [
                      {
                        tool_call_id: tool_call.id,
                        output: response ?? "",
                      },
                    ],
                  }
                );
              }
            } catch (e) {
              console.log(e);
              await openai.beta.threads.runs.submitToolOutputs(
                threadId,
                myRun.id,
                {
                  tool_outputs: [
                    {
                      tool_call_id: tool_call.id,
                      output: "There was an error",
                    },
                  ],
                }
              );
            }
          }
        }

        if (retrieveRun.status === "completed") {
          clearInterval(interval);
          resolve(retrieveRun);
        }
      }, 3000);
    });
  };

  await checkRun();
  const allMessages: any = await getThreadMessages(threadId);
  const messages = await allMessages.body.data.map(
    (message: any) => message.content[0].text.value
  );
  return messages;
};

export const processAssistantRequest = async (request: any): Promise<any> => {
  try {
    logger.info("Processing assistant request", { requestType: request.type });

    if (!request.type || !request.data) {
      logger.warn("Invalid assistant request", { request });
      throw new ValidationError(
        "Invalid request: type and data are required",
        []
      );
    }

    return [];
  } catch (error) {
    logger.error("Failed to process assistant request", {
      requestType: request.type,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    throw new ExternalServiceError("Failed to process assistant request");
  }
};

export const handleAssistantError = async (error: Error): Promise<any> => {
  logger.error("Assistant error occurred", {
    error: error.message,
    stack: error.stack,
  });

  return {
    type: "error",
    data: {
      message: "An error occurred while processing your request",
      details: error.message,
    },
  };
};
