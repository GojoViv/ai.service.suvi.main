import { openai } from "../../clients";

const searchSuvi = async (items: any) => {
  try {
    return items;
  } catch (error) {
    throw error;
  }
};

export const analyseSearch = async (query: string, k: number, results: any) => {
  try {
    const tools: any = [
      {
        type: "function",
        function: {
          name: "search_suvi",
          description: "Search and return an array of unified search results.",
          parameters: {
            type: "object",
            properties: {
              items: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: {
                      type: "string",
                      description: "The id of the db document",
                    },
                    type: {
                      type: "string",
                      description: "The type of the search result.",
                      enum: [
                        "channel",
                        "client",
                        "employee",
                        "leave",
                        "project",
                        "message",
                        "task",
                      ],
                    },
                    collection: {
                      type: "string",
                      description:
                        "The db collection the search result belongs to.",
                    },
                    title: {
                      type: "string",
                      description: "The title of the search result.",
                    },
                    description: {
                      type: "string",
                      description:
                        "The summarised description of the search result.",
                    },
                    platform: {
                      type: "string",
                      description: "The platform of the search result.",
                      enum: ["notion", "slack", "telegram"],
                    },
                    url: {
                      type: "string",
                      description: "The URL of the search result.",
                    },
                  },
                  required: [
                    "id",
                    "type",
                    "collection",
                    "title",
                    "description",
                  ],
                },
              },
            },
            required: ["items"],
          },
        },
      },
    ];

    const messages: any = [
      {
        role: "system",
        content: `
        Act like a web browser searcher
        I will be giving you a query and the top k database aggregate results for the same
        I want you to analyse the results and return an items array.
        Return an empty array is nothing is found
        `,
      },
      {
        role: "user",
        content: `Query: ${query}\n K: ${k} \nSearch Results:\n ${JSON.stringify(
          results
        )}\n`,
      },
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: messages,
      tools: tools,
      tool_choice: {
        function: { name: "search_suvi" },
        type: "function",
      },
    });
    const responseMessage = response.choices[0].message;
    const toolCalls = responseMessage.tool_calls;

    if (toolCalls) {
      const availableFunctions: any = {
        search_suvi: searchSuvi,
      };

      for (const toolCall of toolCalls) {
        const functionName = toolCall.function.name;
        const functionToCall = availableFunctions[functionName];
        const functionArgs = JSON.parse(toolCall.function.arguments);

        const functionResponse = functionToCall(functionArgs.items);

        return functionResponse;
      }
    } else {
      console.log("No tool called");
    }
  } catch (error) {
    console.log(error);
  }
};
