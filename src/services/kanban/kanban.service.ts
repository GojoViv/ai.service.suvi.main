import { Task } from "../../models/task/task.schema";
import { Sprint } from "../../models/sprint/sprint.schema";
import { initializeSlackClient } from "../../clients/slack.client";
import { SLACK_TOKEN } from "../../config/environment";
import {
  sendMessage,
  sendMessageInThreads,
} from "../../models/slack/slack.model";
import { SprintAnalysis } from "../../models/sprintAnalysis/sprintAnalysis.schema";
import { projects } from "../../constants/config";
import { logWithTimestamp } from "../../helper";
import { SlackChannelId } from "../../constants";
import { Worker } from "worker_threads";
import { cpus } from "os";
import path from "path";

const slackClient = initializeSlackClient(SLACK_TOKEN ?? "");

async function updateTaskDescriptionsParallel() {
  try {
    const startTime = new Date();
    logWithTimestamp("[MAIN] Started task description update process");
    logWithTimestamp("[MAIN] Fetching tasks from database...");

    const tasks = await Task.find({
      $or: [
        { taskDescription: "" }, // Empty description
        {
          $and: [
            { taskDescription: { $exists: true } },
            { "status.name": { $ne: "Done" } },
          ],
        },
      ],
    });
    logWithTimestamp(`[MAIN] Found ${tasks.length} total tasks`);

    const numCPUs = cpus().length;
    const batchSize = Math.ceil(tasks.length / numCPUs);
    logWithTimestamp(
      `[MAIN] Config: Workers=${numCPUs}, BatchSize=${batchSize}`
    );

    const batches = Array.from({ length: numCPUs }, (_, i) =>
      tasks.slice(i * batchSize, (i + 1) * batchSize)
    ).filter((batch) => batch.length > 0);

    logWithTimestamp(`[MAIN] Created ${batches.length} batches for processing`);

    const workerPath = path.resolve(__dirname, "./taskDescriptionWorker.ts");

    const workerPromises = batches.map(
      (batch, index) =>
        new Promise((resolve, reject) => {
          const workerId = `W${index + 1}`;
          logWithTimestamp(
            `[MAIN][${workerId}] Starting worker with ${batch.length} tasks`
          );

          const worker = new Worker(workerPath, {
            workerData: {
              taskBatch: batch,
              notionApiKey: process.env.NOTION_API_KEY,
              workerId,
            },
          });

          worker.on("message", (result) => {
            logWithTimestamp(
              `[MAIN][${workerId}] Worker completed | Updates=${result.length}`
            );
            resolve(result);
          });

          worker.on("error", (error) => {
            logWithTimestamp(
              `[ERROR][${workerId}] Worker failed: ${error.message}`
            );
            reject(error);
          });

          worker.on("exit", (code) => {
            if (code !== 0) {
              const error = new Error(`Worker stopped with code ${code}`);
              logWithTimestamp(`[ERROR][${workerId}] ${error.message}`);
              reject(error);
            }
          });
        })
    );

    const results = await Promise.all(workerPromises);
    const updateOperations = results.flat();

    logWithTimestamp(`[MAIN] Updates needed: ${updateOperations.length}`);

    if (updateOperations.length > 0) {
      logWithTimestamp("[MAIN] Starting database bulk update");

      const bulkOps = updateOperations.map((update: any) => ({
        updateOne: {
          filter: { taskId: update.taskId },
          update: {
            $set: {
              taskDescription: update.newDescription,
              lastDescriptionUpdate: new Date(),
              descriptionMetadata: {
                notionPageId: update.notionPageId,
                contentLength: update.contentLength,
                updateTimestamp: new Date(),
              },
            },
          },
        },
      }));

      const result = await Task.bulkWrite(bulkOps);

      // Compact task update logging
      updateOperations.forEach((update: any) => {
        logWithTimestamp(
          `[UPDATE] TaskId=${update.taskId} | Name="${update.taskName}" | Length=${update.contentLength}`
        );
      });

      const endTime = new Date();
      const duration = (endTime.getTime() - startTime.getTime()) / 1000;

      logWithTimestamp(`[SUMMARY]
Modified: ${result.modifiedCount}
Processed: ${tasks.length}
Updated: ${updateOperations.length}
Duration: ${duration}s
Avg Time: ${(duration / tasks.length).toFixed(2)}s/task`);
    } else {
      logWithTimestamp("[MAIN] No updates required");
    }

    logWithTimestamp("[MAIN] Process completed");
    return updateOperations.length;
  } catch (error: any) {
    logWithTimestamp(`[ERROR] Update process failed: ${error.message}`);
    return 0;
  }
}

function generateSprintTitle(
  projectName: string,
  sprintName: string,
  dailyMetrics: any
) {
  // First ensure we have valid numbers for our calculation
  const totalTasks = Number(dailyMetrics.totalTasks) || 0;
  const completedTasks = Number(dailyMetrics.completedTasks) || 0;

  // Calculate completion rate, defaulting to 0 if invalid
  const completionRate =
    totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(1) : "0.0";

  const currentDate = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return `Sprint: ${sprintName} - ${completionRate}% Complete (${dailyMetrics.sprintHealth}) - ${currentDate}`;
}

function generateProgressReport(dailyMetrics: any) {
  // Get the first and latest day's metrics

  const currentDay = dailyMetrics;

  // Track assignees and their work
  const assigneeProgress: { [key: string]: any } = {};

  // Process completed tasks
  currentDay.tasksByStatus.forEach((statusGroup: any) => {
    statusGroup.tasks.forEach((task: any) => {
      const assignee = task.assignee.name;
      if (!assigneeProgress[assignee]) {
        assigneeProgress[assignee] = {
          name: assignee,
          completedTasks: [],
          inProgressTasks: [],
          qaReviewTasks: [],
          totalStoryPoints: 0,
          completedStoryPoints: 0,
        };
      }

      // Add task to appropriate category
      if (statusGroup.status === "Done") {
        assigneeProgress[assignee].completedTasks.push(task);
        assigneeProgress[assignee].completedStoryPoints +=
          task.storyPoints || 0;
      } else if (statusGroup.status === "In progress") {
        assigneeProgress[assignee].inProgressTasks.push(task);
      } else if (statusGroup.status === "QA Review") {
        assigneeProgress[assignee].qaReviewTasks.push(task);
      }

      assigneeProgress[assignee].totalStoryPoints += task.storyPoints || 0;
    });
  });

  let message = "📊 Sprint Progress Report\n\n";

  Object.values(assigneeProgress).forEach((progress: any) => {
    message += `👤 ${progress.name}:\n`;
    message += `   ✅ Completed: ${progress.completedTasks.length} tasks (${progress.completedStoryPoints} story points)\n`;
    if (progress.inProgressTasks.length > 0) {
      message += `   🏃 In Progress: ${progress.inProgressTasks.length} tasks\n`;
    }
    if (progress.qaReviewTasks.length > 0) {
      message += `   🔍 In QA Review: ${progress.qaReviewTasks.length} tasks\n`;
    }
    message += `   📈 Total Story Points Assigned: ${progress.totalStoryPoints}\n`;

    // List tasks by status
    if (progress.completedTasks.length > 0) {
      message += `\n   Completed Tasks:\n`;
      progress.completedTasks.forEach((task: any) => {
        message += `   • ${task.taskName} (${task.storyPoints || 0} points)\n`;
      });
    }

    if (progress.inProgressTasks.length > 0) {
      message += `\n   In Progress Tasks:\n`;
      progress.inProgressTasks.forEach((task: any) => {
        message += `   • ${task.taskName} (${task.storyPoints || 0} points)\n`;
      });
    }

    if (progress.qaReviewTasks.length > 0) {
      message += `\n   Tasks in QA Review:\n`;
      progress.qaReviewTasks.forEach((task: any) => {
        message += `   • ${task.taskName} (${task.storyPoints || 0} points)\n`;
      });
    }

    message += `\n`;
  });

  // Add overall sprint metrics
  message += `\n📈 Overall Sprint Progress:\n`;
  message += `• Total Tasks: ${currentDay.totalTasks}\n`;
  message += `• Completed Tasks: ${currentDay.completedTasks}\n`;
  message += `• Story Points Completed: ${currentDay.storyPointsCompleted.total}\n`;
  message += `• Story Points Remaining: ${currentDay.storyPointsRemaining.total}\n`;
  message += `• Completion Rate: ${currentDay.estimatedCompletionRate.toFixed(
    1
  )}%\n`;
  message += `• Sprint Health: ${currentDay.sprintHealth}\n`;

  return message;
}

const sprintAnalysis = async () => {
  try {
    for (const [projectName, projectData] of Object.entries(projects)) {
      logWithTimestamp(`Analysis ${projectName} Sprints`);

      const today = new Date();
      const currentSprint: any = await Sprint.findOne({
        "sprintStatus.id": "current",
        projectTag: projectName,
      });

      if (!currentSprint) {
        console.log(
          `No active sprint found for today's date for project: ${projectName}.`
        );
        continue;
      }

      const tasks = await Task.find({
        sprint: currentSprint.sprintId,
        projectTag: projectName,
      });

      const totalTasks = tasks.length;
      const completedTasksDetails = tasks.filter(
        (task: any) => task.status.name === "Done"
      );
      const completedTasks = completedTasksDetails.length;

      const bugTasks = tasks.filter((task) => task.type?.name === "Bug");
      const totalBugs = bugTasks.length;
      const completedBugs = bugTasks.filter(
        (task: any) => task.status.name === "Done"
      ).length;

      const tasksByStatus = tasks.reduce((acc: any, task: any) => {
        const status = task.status.name;
        const storyPoints = Number(task.storyPoints?.name ?? "0");

        const taskDetails = {
          taskId: task.taskId,
          taskName: task.taskName,
          storyPoints,
          assignee: task.assignee
            ? {
                id: task.assignee.id,
                name: task.assignee.name,
                email: task.assignee.email,
                avatarUrl: task.assignee.avatarUrl,
              }
            : null,
        };

        const existingStatus = acc.find((item: any) => item.status === status);
        if (existingStatus) {
          existingStatus.count += 1;
          existingStatus.storyPoints += storyPoints;
          existingStatus.tasks.push(taskDetails);
        } else {
          acc.push({ status, count: 1, storyPoints, tasks: [taskDetails] });
        }
        return acc;
      }, []);

      // Calculate bug tasks by status
      const bugsByStatus = bugTasks.reduce((acc: any, task: any) => {
        const status: any = task.status.name;

        const bugDetails = {
          taskId: task.taskId,
          taskName: task.taskName,
          storyPoints: Number(task.storyPoints?.name ?? "0"),
          assignee: task.assignee
            ? {
                id: task.assignee.id,
                name: task.assignee.name,
                email: task.assignee.email,
                avatarUrl: task.assignee.avatarUrl,
              }
            : null,
        };

        const existingStatus = acc.find((item: any) => item.status === status);
        if (existingStatus) {
          existingStatus.count += 1;
          existingStatus.tasks.push(bugDetails);
        } else {
          acc.push({ status, count: 1, tasks: [bugDetails] });
        }
        return acc;
      }, []);

      // Calculate story points completed and remaining
      const storyPointsCompleted = {
        total: completedTasksDetails.reduce(
          (acc, task) => acc + Number(task.storyPoints?.name ?? "0"),
          0
        ),
        tasks: completedTasksDetails.map((task) => ({
          taskId: task.taskId,
          taskName: task.taskName,
          storyPoints: Number(task.storyPoints?.name ?? "0"),
          assignee: task.assignee
            ? {
                id: task.assignee.id,
                name: task.assignee.name,
                email: task.assignee.email,
                avatarUrl: task.assignee.avatarUrl,
              }
            : null,
        })),
      };

      const remainingTasksDetails = tasks.filter(
        (task: any) => task.status.name !== "Done"
      );
      const storyPointsRemaining = {
        total: remainingTasksDetails.reduce(
          (acc: any, task: any) => acc + Number(task.storyPoints?.name ?? "0"),
          0
        ),
        tasks: remainingTasksDetails.map((task) => ({
          taskId: task.taskId,
          taskName: task.taskName,
          storyPoints: Number(task.storyPoints?.name ?? "0"),
          assignee: task.assignee
            ? {
                id: task.assignee.id,
                name: task.assignee.name,
                email: task.assignee.email,
                avatarUrl: task.assignee.avatarUrl,
              }
            : null,
        })),
      };

      const estimatedCompletionRate = (completedTasks / totalTasks) * 100 || 0;

      // Identify bottlenecks
      const bottlenecks = tasksByStatus
        .filter(
          (item: any) =>
            item.status === "QA Review" || item.status === "Code Review"
        )
        .map((item: any) => ({
          status: item.status,
          count: item.count,
          storyPoints: item.storyPoints,
          tasks: item.tasks,
        }));

      // Count QA rejections
      const qaRejectionsDetails = tasks
        .filter((task: any) => task.status.name === "QA Rejected")
        .map((task) => ({
          taskId: task.taskId,
          taskName: task.taskName,
          storyPoints: Number(task.storyPoints?.name ?? "0"),
          assignee: task.assignee
            ? {
                id: task.assignee.id,
                name: task.assignee.name,
                email: task.assignee.email,
                avatarUrl: task.assignee.avatarUrl,
              }
            : null,
        }));
      const qaRejections = qaRejectionsDetails.length;

      // Sprint health assessment
      let sprintHealth = "On Track";
      const sprintStartDate = new Date(currentSprint.startDate.date.start);
      if (
        estimatedCompletionRate < 50 &&
        today > new Date(sprintStartDate.setDate(sprintStartDate.getDate() + 5))
      ) {
        sprintHealth = "At Risk";
      }
      if (
        estimatedCompletionRate < 25 &&
        today > new Date(sprintStartDate.setDate(sprintStartDate.getDate() + 7))
      ) {
        sprintHealth = "Delayed";
      }

      const dailyMetrics = {
        date: today,
        totalTasks,
        completedTasks,
        tasksByStatus,
        storyPointsCompleted,
        storyPointsRemaining,
        estimatedCompletionRate,
        bottlenecks,
        qaRejections,
        qaRejectionsDetails,
        sprintHealth,
        notes:
          "Daily metrics updated with detailed task lists and bug tracking",
        totalBugs,
        completedBugs,
        bugsByStatus,
      };

      // const { title, body } = await generateSprintAnalysisMessage(
      //   projectName,
      //   currentSprint.sprintName,
      //   dailyMetrics
      // );

      const sprintTitle = generateSprintTitle(
        projectName,
        currentSprint.sprintName,
        dailyMetrics
      );

      const sprintProgress = generateProgressReport(dailyMetrics);

      await sendMessageInThreads(
        slackClient,
        projectData.boards.slackChannelId ?? "[SLACK_CHANNEL_ID]",
        // "C086U5P18BF",
        sprintTitle,
        sprintProgress
      );

      const sprintAnalysis = await SprintAnalysis.findOneAndUpdate(
        { sprintId: currentSprint.sprintId },
        {
          $set: {
            projectId: projectData.tag,
            sprintId: currentSprint.sprintId,
            sprintName: currentSprint.sprintName,
            startDate: currentSprint.startDate.date.start,
            endDate: currentSprint.endDate.date.start,
            projectTag: projectName,
          },
          $push: { dailyMetrics },
        },
        { upsert: true, new: true }
      );

      console.log(
        "Sprint analysis updated successfully with bug tracking:",
        projectName
      );
    }
  } catch (error) {
    console.error("Error updating sprint analysis:", error);
  }
};

const qaAnalysis = async () => {
  try {
    for (const [projectName, projectData] of Object.entries(projects)) {
      logWithTimestamp(`QA Analysis for ${projectName}`);

      const tasks = await Task.find({
        projectTag: projectName,
      });

      const qaTasks = tasks.filter(
        (task: any) =>
          task.status.name === "QA Review" || task.status.name === "QA Rejected"
      );

      if (qaTasks.length === 0) {
        console.log(`No QA tasks found for project: ${projectName}`);
        continue;
      }

      const groupedTasks = qaTasks.reduce((acc: any, task: any) => {
        const status = task.status.name;
        if (!acc[status]) {
          acc[status] = [];
        }
        acc[status].push(task);
        return acc;
      }, {});

      // Create the title with key metrics
      const currentDate = new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      const qaReviewCount = groupedTasks["QA Review"]?.length || 0;
      const title = `🔍 QA Status - ${projectName} (${qaReviewCount} tickets awaiting review) - ${currentDate}`;

      // Create the detailed body for the thread
      let body = "";

      if (groupedTasks["QA Review"]) {
        body += `*Tasks Pending QA Review:*\n`;
        groupedTasks["QA Review"].forEach((task: any) => {
          const storyPoints = task.storyPoints?.name || "0";
          const assignee = task.assignee?.name || "Unassigned";
          body += `• *${task.taskName}* (${storyPoints} pts) - ${assignee}\n`;
        });
      }

      if (groupedTasks["QA Rejected"]) {
        body += `\n*Tasks Needing Fixes:*\n`;
        groupedTasks["QA Rejected"].forEach((task: any) => {
          const assignee = task.assignee?.name || "Unassigned";
          body += `• *${task.taskName}* - ${assignee}\n`;
          if (task.qaComments) {
            body += `  Feedback: ${task.qaComments}\n`;
          }
        });
      }

      body += `\n*Action Items:*\n`;
      body += `• QA team: Please review pending tasks\n`;
      body += `• Developers: Address QA feedback promptly\n`;

      await sendMessageInThreads(
        slackClient,
        projectData.boards.slackChannelId ?? "[SLACK_CHANNEL_ID]",
        // "C086U5P18BF",
        title,
        body
      );

      logWithTimestamp(`QA Analysis completed for ${projectName}`);
    }
  } catch (error: any) {
    console.error("Error performing QA analysis:", error);
  }
};

async function getAllProjectsFridayMetrics() {
  try {
    const currentSprints = await Sprint.find({
      "sprintStatus.id": "current",
    }).lean();
    if (!currentSprints || currentSprints.length === 0) {
      throw new Error("No current sprints found.");
    }

    const sprintIds = currentSprints.map((sprint) => sprint.sprintId);
    const sprintAnalyses = await SprintAnalysis.find({
      sprintId: { $in: sprintIds },
    }).lean();

    if (!sprintAnalyses || sprintAnalyses.length === 0) {
      throw new Error("No sprint analysis data found for current sprints.");
    }

    const storyPointsByAssignee: Record<string, Record<string, number>> = {};

    sprintAnalyses.forEach((sprintAnalysis) => {
      const fridayData = sprintAnalysis.dailyMetrics.pop();

      if (fridayData) {
        fridayData.tasksByStatus.forEach(({ status, tasks }: any) => {
          tasks.forEach((task: any) => {
            const assigneeName = task?.assignee?.name || "Unassigned";

            if (!storyPointsByAssignee[assigneeName]) {
              storyPointsByAssignee[assigneeName] = {};
            }

            storyPointsByAssignee[assigneeName][status] =
              (storyPointsByAssignee[assigneeName][status] || 0) +
              task.storyPoints;
          });
        });
      }
    });

    let message = `🌟 *Sprint Progress Snapshot - Friday Across All Projects* 🌟\n\n`;
    message += `🔍 *Story Points by Assignee and Status:*\n`;

    for (const [assignee, statuses] of Object.entries(storyPointsByAssignee)) {
      message += `\n🙋‍♂️ *${assignee}*\n`;

      const statusEntries = Object.entries(statuses);
      const maxStatusLength = Math.max(
        ...statusEntries.map(([status]) => status.length)
      );

      let totalPoints = 0; // Initialize total points for the current assignee

      statusEntries.forEach(([status, points]) => {
        totalPoints += points; // Accumulate total points
        const paddedStatus = status.padEnd(maxStatusLength + 2, " ");
        message += `   - 📌 *${paddedStatus}*: ${points} pts\n`;
      });

      // Add total story points for the assignee
      message += `   - 🏁 *Total*: ${totalPoints} pts\n`;
    }

    message += `\n🚀 *Keep up the great work! Let's aim higher next week!*\n`;

    await sendMessage(slackClient, "", message);
  } catch (error: any) {
    console.error("Error generating sprint message:", error.message);
    return null;
  }
}

async function getRankListForQaDoneAndBugsCreatedStoryPoints() {
  try {
    const currentSprints = await Sprint.find({
      "sprintStatus.id": "current",
    }).lean();

    if (!currentSprints || currentSprints.length === 0) {
      throw new Error("No current sprints found.");
    }

    const sprintIds = currentSprints.map((sprint) => sprint.sprintId);
    const sprintAnalyses = await SprintAnalysis.find({
      sprintId: { $in: sprintIds },
    }).lean();

    if (!sprintAnalyses || sprintAnalyses.length === 0) {
      throw new Error("No sprint analysis data found for current sprints.");
    }

    const storyPointsByAssignee: Record<string, number> = {};

    sprintAnalyses.forEach((sprintAnalysis) => {
      const fridayData = sprintAnalysis.dailyMetrics.pop();

      if (fridayData) {
        fridayData.tasksByStatus.forEach(({ status, tasks }: any) => {
          tasks.forEach((task: any) => {
            const assigneeName = task?.assignee?.name || "Unassigned";

            if (status === "QA Review" || status === "Done") {
              storyPointsByAssignee[assigneeName] =
                (storyPointsByAssignee[assigneeName] || 0) +
                (task.storyPoints || 0);
            }
          });
        });
      }
    });

    const rankList = Object.entries(storyPointsByAssignee)
      .map(([assignee, points]) => ({ assignee, points }))
      .sort((a, b) => b.points - a.points)
      .slice(0, 3); // Top 3 performers

    let message = `🌟 *Top 3 Performers - QA Review & Done Story Points* 🌟\n\n`;
    message += `🔥 Here's the leaderboard based on their contributions this sprint:\n`;

    rankList.forEach((entry, index) => {
      const medalEmoji = index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉";
      message += `\n${medalEmoji} *${entry.assignee}*: ${entry.points} pts`;
    });

    message += `\n\n🚀 *Fantastic work, everyone! Let's keep pushing forward!* 🎉`;

    await sendMessage(slackClient, "", message);

    return { rankList }; // Return both rank lists
  } catch (error: any) {
    console.error("Error generating rank list:", error.message);
    return null;
  }
}

async function getBugsRankList() {
  try {
    const bugTasks = [];
    for (const [projectName, projectData] of Object.entries(projects)) {
      logWithTimestamp(`Analyzing ${projectName} Bugs`);
      const currentSprint: any = await Sprint.findOne({
        "sprintStatus.id": "current",
        projectTag: projectName,
      });
      if (!currentSprint) {
        console.log(
          `No active sprint found for today's date for project: ${projectName}.`
        );
        continue; // Skip to the next project
      }
      const tasks = await Task.find({
        sprint: currentSprint.sprintId,
        projectTag: projectName,
        "type.name": "Bug",
      });
      bugTasks.push(...tasks);
    }

    // Process bug tasks to create a rank list
    const bugsByAssignee: Record<string, number> = {};

    bugTasks.forEach((task: any) => {
      const assigneeName = task?.assignee?.name || "Unassigned";
      bugsByAssignee[assigneeName] = (bugsByAssignee[assigneeName] || 0) + 1;
    });

    const bugRankList = Object.entries(bugsByAssignee)
      .map(([assignee, bugs]) => ({ assignee, bugs }))
      .sort((a, b) => b.bugs - a.bugs); // Sort by bug count in descending order

    let message = `🐞 *Bug Creators for Current Sprints* 🐞\n\n`;
    message += `👾 Here's the leaderboard for bug creation this sprint:\n`;

    bugRankList.forEach((entry, index) => {
      const medalEmoji =
        index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "⭐";
      message += `\n${medalEmoji} *${entry.assignee}*: ${entry.bugs} bugs`;
    });

    message += `\n\n *Keep tackling these bugs to make our projects even better!* `;

    await sendMessage(slackClient, "", message);

    return bugRankList;
  } catch (error) {
    console.error("Error updating bugs rank list analysis:", error);
    return null;
  }
}

const financialAnalyses = async () => {
  console.log("Starting financial analyses for all projects");
  try {
    let messageContent = "📊 *Financial Analysis Summary*\n\n";
    let totalProjects = 0;
    let processedProjects = 0;
    let totalTasksProcessed = 0;

    totalProjects = Object.keys(projects).length;
    console.log(`Found ${totalProjects} projects to analyze`);

    for (const [projectName, projectData] of Object.entries(projects)) {
      logWithTimestamp(
        `[${++processedProjects}/${totalProjects}] Starting financial analysis for ${projectName}`
      );

      console.log(`Fetching tasks for project: ${projectName}`);
      const tasks = await Task.find({
        projectTag: projectName,
      });

      if (tasks.length === 0) {
        console.log(`No tasks found for project: ${projectName}`);
        messageContent += `*${projectName}*: No tasks found\n\n`;
        continue;
      }

      console.log(
        `Processing ${tasks.length} tasks for project: ${projectName}`
      );
      totalTasksProcessed += tasks.length;

      const assigneeHours = tasks.reduce(
        (acc: any, task: any) => {
          const assignee = task.assignee?.name || "Unassigned";
          const hours = Number(task.storyPoints?.name || 0);

          acc.assignees[assignee] = (acc.assignees[assignee] || 0) + hours;
          acc.totalHours += hours;
          return acc;
        },
        { assignees: {}, totalHours: 0 }
      );

      console.log(
        `Project ${projectName} - Total hours: ${assigneeHours.totalHours}`
      );
      console.log(
        `Project ${projectName} - ${
          Object.keys(assigneeHours.assignees).length
        } assignees`
      );

      messageContent += `*💰 ${projectName} (${assigneeHours.totalHours}h)*\n`;

      const assigneeBreakdown = Object.entries(assigneeHours.assignees)
        .sort(([, a]: [string, any], [, b]: [string, any]) => b - a)
        .map(([assignee, hours]) => `• ${assignee}: ${hours}h`)
        .join("\n");

      messageContent += assigneeBreakdown + "\n\n";

      logWithTimestamp(`Analysis complete for project: ${projectName}`);
    }

    const currentDate = new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    messageContent += `_Generated on ${currentDate}_`;

    console.log(
      `Analysis completed for all ${processedProjects} projects. Processed ${totalTasksProcessed} tasks in total.`
    );
    console.log(`Sending results to Slack channel: C03V54XM7DW`);

    const result = await slackClient.chat.postMessage({
      channel: "C03V54XM7DW",
      text: messageContent,
      mrkdwn: true,
    });

    console.log(`Message sent successfully. Timestamp: ${result.ts}`);
  } catch (error: any) {
    console.error("Financial analysis error:", error);
    console.log("Sending error notification to error channel: C086U5P18BF");

    await slackClient.chat.postMessage({
      channel: "C086U5P18BF",
      text: `❌ *Financial Analysis Error*\n${error.message}`,
      mrkdwn: true,
    });

    console.log("Error notification sent");
  }

  console.log("Financial analyses process completed");
};

export {
  sprintAnalysis,
  getAllProjectsFridayMetrics,
  getRankListForQaDoneAndBugsCreatedStoryPoints,
  getBugsRankList,
  qaAnalysis,
  financialAnalyses,
  updateTaskDescriptionsParallel,
};
