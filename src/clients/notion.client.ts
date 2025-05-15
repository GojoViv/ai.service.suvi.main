// ES6 import syntax
import { Client } from "@notionhq/client";
import { NOTION_KEY } from "../config/environment";

// If you have a specific type for the environment variables, you can define it
// For simplicity, process.env.NOTION_KEY is accessed directly here

const notion = new Client({
  auth: NOTION_KEY,
});

// ES6 export syntax
export { notion };
