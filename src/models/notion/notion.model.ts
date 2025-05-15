import { notion } from "../../clients";
import { extractTextContent } from "../../helper";
import { Task } from "../task/task.schema";
import { Sprint } from "../sprint/sprint.schema";
import logger from "../../utils/logger";
import { ExternalServiceError } from "../../utils/errors";

// Define types for parameters
type BlockId = string;
type Cursor = string | undefined;
type PageSize = number | undefined;
type Properties = Record<string, any>;
type Filter = Record<string, any>;
type Sorts = Array<{ property: string; direction: string }>;

// Block related functions
const appendBlockChildren = async (
  blockId: BlockId,
  children: any[],
  after?: string
): Promise<any> => {
  return await notion.blocks.children.append({
    block_id: blockId,
    children,
    after,
  });
};

const retrieveBlock = async (blockId: BlockId): Promise<any> => {
  return await notion.blocks.retrieve({ block_id: blockId });
};

const retrieveBlockChildren = async (
  blockId: BlockId,
  startCursor?: Cursor,
  pageSize?: PageSize
): Promise<any> => {
  return await notion.blocks.children.list({
    block_id: blockId,
    start_cursor: startCursor,
    page_size: pageSize,
  });
};

async function retrieveAndExtractBlockChildrenText(
  blockId: BlockId,
  startCursor?: Cursor,
  pageSize?: PageSize
): Promise<string> {
  try {
    const response = await retrieveBlockChildren(
      blockId,
      startCursor,
      pageSize
    );
    const allText = extractTextContent(response);
    return allText;
  } catch (error) {
    logger.error({
      message: "Error retrieving or processing block children",
      blockId,
      error,
    });
    return "";
  }
}

const updateBlock = async (
  blockId: BlockId,
  archived: boolean
): Promise<any> => {
  return await notion.blocks.update({
    block_id: blockId,
    archived,
  });
};

const deleteBlock = async (blockId: BlockId): Promise<any> => {
  return await notion.blocks.update({
    block_id: blockId,
    archived: true,
  });
};

const retrieveComments = async (
  blockId: BlockId,
  startCursor?: Cursor,
  pageSize?: PageSize
): Promise<any> => {
  return await notion.comments.list({
    block_id: blockId,
    start_cursor: startCursor,
    page_size: pageSize,
  });
};

// Database related functions
const createDatabase = async (
  parent: any,
  title: any,
  properties: Properties
): Promise<any> => {
  return await notion.databases.create({
    parent,
    title,
    properties,
  });
};

const queryDatabase = async (
  databaseId: string,
  filter?: any,
  sorts?: any,
  start_cursor?: Cursor,
  page_size?: PageSize
): Promise<any> => {
  return await notion.databases.query({
    database_id: databaseId,
    filter,
    sorts,
    start_cursor,
    page_size,
  });
};

async function getAllEntries(
  databaseId: string,
  filter?: Filter,
  sorts?: Sorts,
  start_cursor?: Cursor,
  page_size?: PageSize
): Promise<any[]> {
  let allEntries: any[] = [];
  let hasMore = true;

  while (hasMore) {
    const response = await queryDatabase(
      databaseId,
      filter,
      sorts,
      start_cursor,
      page_size
    );
    allEntries = allEntries.concat(response.results);
    hasMore = response.has_more;
    start_cursor = response.next_cursor;
  }

  return allEntries;
}

async function getAllEntriesWithContent(
  databaseId: string,
  filter?: Filter,
  sorts?: Sorts,
  start_cursor?: Cursor,
  page_size?: PageSize
): Promise<any[]> {
  const allEntries = await getAllEntries(
    databaseId,
    filter,
    sorts,
    start_cursor,
    page_size
  );
  const entriesWithContent = [];

  for (const entry of allEntries) {
    const pageId = entry.id;
    const pageContent = await retrieveBlockChildren(pageId);
    entriesWithContent.push({
      ...entry,
      content: pageContent.results,
    });
  }

  return entriesWithContent;
}

const retrieveDatabase = async (databaseId: string): Promise<any> => {
  return await notion.databases.retrieve({ database_id: databaseId });
};

const updateDatabase = async (
  databaseId: string,
  title: any,
  description: any,
  properties: Properties
): Promise<any> => {
  return await notion.databases.update({
    database_id: databaseId,
    title,
    description,
    properties,
  });
};

// Page related functions
const createPage = async (
  parent: any,
  properties: Properties,
  children: any[]
): Promise<any> => {
  return await notion.pages.create({
    parent,
    properties,
    children,
  });
};

const retrievePage = async (pageId: string): Promise<any> => {
  return await notion.pages.retrieve({ page_id: pageId });
};

const updatePage = async (
  pageId: string,
  properties: Properties
): Promise<any> => {
  return await notion.pages.update({
    page_id: pageId,
    properties,
  });
};

const deletePage = async (pageId: string): Promise<any> => {
  return await notion.pages.update({
    page_id: pageId,
    archived: true,
  });
};

// User related functions
const listAllUsers = async (
  startCursor?: Cursor,
  pageSize?: PageSize
): Promise<any> => {
  return await notion.users.list({
    start_cursor: startCursor,
    page_size: pageSize,
  });
};

const retrieveUser = async (userId: string): Promise<any> => {
  return await notion.users.retrieve({ user_id: userId });
};

export {
  appendBlockChildren,
  retrieveBlock,
  retrieveBlockChildren,
  updateBlock,
  deleteBlock,
  retrieveComments,
  createDatabase,
  queryDatabase,
  retrieveDatabase,
  updateDatabase,
  createPage,
  retrievePage,
  updatePage,
  deletePage,
  listAllUsers,
  retrieveUser,
  getAllEntries,
  getAllEntriesWithContent,
  retrieveAndExtractBlockChildrenText,
};
