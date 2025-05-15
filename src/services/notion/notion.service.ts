import { logWithTimestamp } from "../../helper";
import {
  getAllEntries,
  queryDatabase,
  updatePage,
} from "../../models/notion/notion.model";

import mongoose from "mongoose";
import { Task } from "../../models/task/task.schema";
import { Sprint } from "../../models/sprint/sprint.schema";
import { Epic } from "../../models/epic/epic.schema";
import { getTaskAnalysisByAssignee } from "../../models/task/task.model";
import { projects, ActivityStatus } from "../../constants/config";

const processBoard = async () => {
  try {
    // Process projects in parallel
    const projectPromises = Object.entries(projects)
      .filter(
        ([_, projectData]) => projectData.status === ActivityStatus.Active
      )
      .map(async ([projectName, projectData]) => {
        logWithTimestamp(`Processing project: ${projectName}`);

        // Fetch entries for the current project in parallel
        const [taskEntries, sprintEntries, epicEntries] = await Promise.all([
          getAllEntries(projectData.boards.tasks),
          getAllEntries(projectData.boards.sprints),
          getAllEntries(projectData.boards.projects),
        ]);

        // Update all boards in parallel
        await Promise.all([
          updateSprints(sprintEntries, projectName),
          updateEpics(epicEntries, projectName),
          updateTasks(taskEntries, projectName),
        ]);

        logWithTimestamp(`Processed project: ${projectName}`);
        return projectName;
      });

    await Promise.all(projectPromises);
    logWithTimestamp("All projects processed successfully");
  } catch (e: any) {
    logWithTimestamp(`Error during board processing: ${e.message}`, true);
    console.error(e);
  }
};

const getTaskAnalysis = async () => {
  return await getTaskAnalysisByAssignee();
};

const updateTasks = async (taskEntries: any[], projectName: string) => {
  const BATCH_SIZE = 10;
  const batches = [];

  for (let i = 0; i < taskEntries.length; i += BATCH_SIZE) {
    batches.push(taskEntries.slice(i, i + BATCH_SIZE));
  }

  for (const batch of batches) {
    await Promise.all(
      batch
        .filter((entry) => entry.properties["Status"]?.status.name !== "Done")
        .map((entry) => updateSingleTask(entry, projectName))
    );
  }

  logWithTimestamp(
    `Completed updating ${taskEntries.length} tasks for project: ${projectName}`
  );
};

const updateSingleTask = async (entry: any, projectName: string) => {
  try {
    const formattedDate = new Date().toISOString().replace(/[:.]/g, "-");

    // Extract and format task data
    const taskData = {
      taskId: entry.id,
      taskName: entry.properties["Task name"]?.title[0]?.plain_text || "",
      taskDescription:
        entry.properties["Summary"]?.rich_text[0]?.plain_text || "",
      assignee: entry.properties["Assignee"]?.people[0]
        ? {
            id: entry.properties["Assignee"].people[0].id,
            name: entry.properties["Assignee"].people[0].name,
            email: entry.properties["Assignee"].people[0].person?.email || "",
            avatarUrl: entry.properties["Assignee"].people[0].avatar_url || "",
          }
        : null,
      status: entry.properties["Status"]?.status || "",
      dueDate: entry.properties["Due"]?.date?.start || null,
      priority: entry.properties["Priority"]?.select || "",
      sprint: entry.properties["Sprint"]?.relation[0]?.id || null,
      epic: entry.properties["Epic"]?.relation[0]?.id || null,
      aiSummary: entry.properties["Summary"]?.rich_text[0]?.plain_text || "",
      milestone: entry.properties["Milestone"] ?? null,
      type: entry.properties["Type"]?.select || "",
      storyPoints: entry.properties["Story Points"]?.select || null,
      changeLog: new Map(),
      projectTag: projectName,
    };

    // Retrieve existing task if it exists
    const existingTask = await Task.findOne({ taskId: entry.id });
    if (existingTask) {
      taskData.changeLog = existingTask.changeLog || new Map();
    }

    // Prepare change log entry
    const changeLogEntry = {
      date: new Date(),
      fields: {
        taskName: entry.properties["Task name"]?.title[0]?.plain_text || "",
        assignee: entry.properties["Assignee"]?.people[0]
          ? {
              id: entry.properties["Assignee"].people[0].id,
              name: entry.properties["Assignee"].people[0].name,
              email: entry.properties["Assignee"].people[0].person?.email || "",
              avatarUrl:
                entry.properties["Assignee"].people[0].avatar_url || "",
            }
          : null,
        status: entry.properties["Status"]?.status || "",
        dueDate: entry.properties["Due"]?.date?.start || null,
        priority: entry.properties["Priority"]?.select || "",
        sprint: entry.properties["Sprint"]?.relation[0]?.id || null,
        storyPoints: entry.properties["Story Points"]?.select || null,
        project: entry.properties["Project"]?.relation[0]?.id || null,
        type: entry.properties["Type"]?.select || "",
      },
    };

    // Update change log
    taskData.changeLog.set(formattedDate, changeLogEntry);

    // Update or create the task
    if (existingTask) {
      await Task.findOneAndUpdate({ taskId: entry.id }, taskData, {
        new: true,
      });
    } else {
      const newTask = new Task(taskData);
      await newTask.save();
    }

    return entry.id;
  } catch (error) {
    console.error(`Failed to update task entry with id ${entry.id}:`, error);
    throw error; // Re-throw to be caught by the Promise.all
  }
};

const updateSprints = async (sprintEntries: any[], projectName: string) => {
  const isValidObjectId = (id: string) => mongoose.Types.ObjectId.isValid(id);

  // Process sprints in batches
  const BATCH_SIZE = 10;
  const batches = [];

  for (let i = 0; i < sprintEntries.length; i += BATCH_SIZE) {
    batches.push(sprintEntries.slice(i, i + BATCH_SIZE));
  }

  for (const batch of batches) {
    await Promise.all(
      batch.map(async (entry) => {
        try {
          const sprintData = {
            sprintId: entry.id,
            sprintName:
              entry.properties["Sprint name"]?.title[0]?.plain_text || "",
            startDate: {
              id: entry.properties["Start Date"]?.id || "",
              type: entry.properties["Start Date"]?.type || "date",
              date: {
                start: entry.properties["Start Date"]?.date?.start || null,
                end: entry.properties["Start Date"]?.date?.end || null,
                time_zone:
                  entry.properties["Start Date"]?.date?.time_zone || null,
              },
            },
            endDate: {
              id: entry.properties["End Date"]?.id || "",
              type: entry.properties["End Date"]?.type || "date",
              date: {
                start: entry.properties["End Date"]?.date?.start || null,
                end: entry.properties["End Date"]?.date?.end || null,
                time_zone:
                  entry.properties["End Date"]?.date?.time_zone || null,
              },
            },
            dates: {
              start: entry.properties["Dates"]?.date?.start || null,
              end: entry.properties["Dates"]?.date?.end || null,
            },
            tasks:
              entry.properties["Tasks"]?.relation?.map((task: any) =>
                isValidObjectId(task.id)
                  ? new mongoose.Types.ObjectId(task.id)
                  : task.id
              ) || [],
            totalTasks: entry.properties["Total tasks"]?.rollup?.number || 0,
            completedTasks:
              entry.properties["Completed tasks"]?.rollup?.number || 0,
            sprintStatus: entry.properties["Sprint status"]?.status || "",
            url: entry.url || "",
            projectTag: projectName,
          };

          // Use findOneAndUpdate with upsert for atomic operation
          await Sprint.findOneAndUpdate(
            { sprintId: sprintData.sprintId },
            sprintData,
            { upsert: true, new: true }
          );

          return entry.id;
        } catch (error) {
          console.error(
            `Failed to process sprint entry with id ${entry.id}:`,
            error
          );
          throw error;
        }
      })
    );
  }

  logWithTimestamp(
    `Completed updating ${sprintEntries.length} sprints for project: ${projectName}`
  );
};

const updateEpics = async (epicEntries: any[], projectName: string) => {
  const isValidObjectId = (id: string) => mongoose.Types.ObjectId.isValid(id);

  // Process epics in batches
  const BATCH_SIZE = 10;
  const batches = [];

  for (let i = 0; i < epicEntries.length; i += BATCH_SIZE) {
    batches.push(epicEntries.slice(i, i + BATCH_SIZE));
  }

  for (const batch of batches) {
    await Promise.all(
      batch.map(async (entry) => {
        try {
          const epicData = {
            epicId: entry.id,
            description: "",
            projectTag: projectName ?? "",
            epicName: entry.properties["Epic name"]?.title[0]?.plain_text || "",
            owner: entry.properties["Owner"]?.people[0]
              ? {
                  id: entry.properties["Owner"].people[0].id,
                  name: entry.properties["Owner"].people[0].name,
                  email:
                    entry.properties["Owner"].people[0].person?.email || "",
                  avatarUrl:
                    entry.properties["Owner"].people[0].avatar_url || "",
                }
              : null,
            status: entry.properties["Status"]?.status || "",
            completion: entry.properties["Completion"]?.rollup?.number || 0,
            priority: entry.properties["Priority"]?.select || "",
            dates: {
              start: entry.properties["Dates"]?.date?.start || "",
              end: entry.properties["Dates"]?.date?.end || "",
            },
            summary:
              entry.properties["Summary"]?.rich_text[0]?.plain_text || "",
            tasks:
              entry.properties["Tasks"]?.relation?.map((task: any) =>
                isValidObjectId(task.id)
                  ? new mongoose.Types.ObjectId(task.id)
                  : task.id
              ) || [],
            isBlocking:
              entry.properties["Is Blocking"]?.relation?.map((epic: any) =>
                isValidObjectId(epic.id)
                  ? new mongoose.Types.ObjectId(epic.id)
                  : epic.id
              ) || [],
            blockedBy:
              entry.properties["Blocked By"]?.relation?.map((epic: any) =>
                isValidObjectId(epic.id)
                  ? new mongoose.Types.ObjectId(epic.id)
                  : epic.id
              ) || [],
            url: entry.url || "",
            telegramChannelId: "",
            whatsappChannelId: "",
            slackChannelId: "",
          };

          // Use findOneAndUpdate with upsert for atomic operation
          await Epic.findOneAndUpdate({ epicId: epicData.epicId }, epicData, {
            upsert: true,
            new: true,
          });

          return entry.id;
        } catch (error) {
          console.error(
            `Failed to update project entry with id ${entry.id}:`,
            error
          );
          throw error;
        }
      })
    );
  }

  logWithTimestamp(
    `Completed updating ${epicEntries.length} epics for project: ${projectName}`
  );
};

function extractFirstStringInSquareBrackets(input: string): string | null {
  if (!input) return null;

  const regex = /\[([^\]]+)\]/;
  const match = input.match(regex);

  if (match) {
    return match[1];
  } else {
    return null;
  }
}

export const getNotionTaskDetails = async (taskId: number) => {
  try {
    const ticket = await queryDatabase("7cf14185e7b24deaaf659a5e4585f794", {
      property: "Task ID",
      unique_id: {
        equals: taskId,
      },
    });

    return ticket.results.length ? ticket.results[0] : null;
  } catch (error) {
    console.error("Error fetching task details:", error);
    return null;
  }
};

export const updateNotionTaskStatus = async (
  branch: string,
  title: string,
  status: "In progress" | "Code Review" | "QA Review"
) => {
  try {
    let taskId: number | null = null;

    // Try to extract task ID from branch name
    const fromBranch = Number(branch.toUpperCase().split("-").at(-1)) || null;

    // Try to extract task ID from title if not found in branch
    const fromTitle = title
      ? Number(
          extractFirstStringInSquareBrackets(title)
            ?.toUpperCase()
            .split("-")
            .at(-1)
        ) || null
      : null;

    taskId = fromBranch || fromTitle;

    if (!taskId) {
      logWithTimestamp(
        `No valid task ID found in branch: ${branch} or title: ${title}`
      );
      return;
    }

    const task = await getNotionTaskDetails(taskId);
    if (!task) {
      logWithTimestamp(`Task with ID ${taskId} not found in Notion`);
      return;
    }

    await updatePage(task.id, {
      Status: {
        status: { name: status },
      },
    });

    logWithTimestamp(`Updated task ${taskId} status to "${status}"`);
  } catch (error: any) {
    console.error(`Error updating task status: ${error.message}`);
  }
};

export { processBoard, getTaskAnalysis };
