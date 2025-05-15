import { openai } from "../../clients";
import { createPage } from "../../models/notion/notion.model";
import { Boards } from "../../constants/boards";
import { createEvent, sendEmail } from "../../clients/google.client";
import { answerChannelQuery } from "../chatbot/chatbot.service";

type QueryType = "ticket" | "mail" | "meet" | "query";

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
    return page;
  } catch (error) {
    console.error("Error storing ticket:", error);
    throw error;
  }
};

const answerQuery = async (
  query: string,
  type: QueryType,
  ticket?: any,
  email?: any,
  meet?: any
) => {
  switch (type) {
    case "ticket":
      return await storeTicket(ticket);
    case "mail":
      return await sendEmail({
        from: undefined,
        to: email?.to ?? "admin@company.com",
        subject: email?.subject ?? "Suvi",
        html: email?.html ?? "",
        cc: "",
      });
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
      console.log("At the normal query response stop");
    //   return await answerChannelQuery(platform ?? "slack", "", botId, query);
  }
};

const respondToUserMessage = async (message: string) => {
  try {
    const tools: any = [
      {
        type: "function",
        function: {
          name: "answer_query",
          description: "Answer the user's query based on the type of query",
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
                enum: ["ticket", "mail", "meet", "query"],
              },
              email: {
                type: "object",
                properties: {
                  to: {
                    type: "string",
                    description: "Email address of the recipient",
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
                    description: "Description of the Google meet",
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
                      type: "string",
                      description: "Email of attendee",
                    },
                    description: "List of attendees",
                  },
                },
                required: ["summary", "start", "end", "attendees"],
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
                required: ["taskName", "taskDescription"],
              },
            },
            required: ["query", "type"],
          },
        },
      },
    ];

    const messages: any = [
      {
        role: "system",
        content: `
          Based on the user query reply to call a function.
          Rules to follow:
           - Do not rephrase the user's query
          `,
      },
      {
        role: "user",
        content: message,
      },
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: messages,
      tools: tools,
      tool_choice: {
        function: { name: "answer_query" },
        type: "function",
      },
    });
    const responseMessage = response.choices[0].message;
    const toolCalls = responseMessage.tool_calls;

    if (toolCalls) {
      const availableFunctions: any = {
        answer_query: answerQuery,
      };

      for (const toolCall of toolCalls) {
        const functionName = toolCall.function.name;
        const functionToCall = availableFunctions[functionName];
        const functionArgs = JSON.parse(toolCall.function.arguments);

        const functionResponse = await functionToCall(
          functionArgs.query,
          functionArgs.type,
          functionArgs.ticket,
          functionArgs.email,
          functionArgs.meet
        );

        return functionResponse;
      }
    } else {
      console.log("No tool called");
      return "Something went wrong";
    }
  } catch (error) {
    console.error("Error responding to user message:", error);
    return "Something went wrong";
  }
};

export { respondToUserMessage };
