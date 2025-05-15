import { Task } from "../../models/task/task.schema";
import { Sprint } from "../../models/sprint/sprint.schema";
import { LEAVE_DATABASE_ID } from "../../constants/config";
import { getAllEntries } from "../../models/notion/notion.model";
import Employee from "../../models/employee/employee.schema";
import { initializeSlackClient } from "../../clients/slack.client";
import { SLACK_TOKEN } from "../../config/environment";
import { sendMessage } from "../../models/slack/slack.model";
import { Leave } from "../../models/leave/leave.schema";

const slackClient = initializeSlackClient(SLACK_TOKEN ?? "");

async function getEmployeeTickets(
  employeeEmail: any,
  projectTag?: any,
  sprintName?: any
) {
  console.log(`[INFO] Starting ticket fetch for employee: ${employeeEmail}`);
  console.log(
    `[INFO] Filters - Project: ${projectTag || "None"}, Sprint: ${
      sprintName || "None"
    }`
  );

  try {
    const taskQuery: any = {
      "assignee.email": employeeEmail,
    };

    if (projectTag) {
      taskQuery.projectTag = projectTag;
    }

    if (sprintName && projectTag) {
      console.log(
        `[INFO] Looking up sprint ID for sprint "${sprintName}" in project "${projectTag}"`
      );
      const sprint = await Sprint.findOne({
        sprintName: sprintName,
        projectTag: projectTag,
      });

      if (!sprint) {
        console.log(`[WARN] Sprint not found: ${sprintName}`);
        return {
          success: false,
          message: `Sprint "${sprintName}" not found in project "${projectTag}"`,
          data: null,
        };
      }

      console.log(`[INFO] Found sprint ID: ${sprint.sprintId}`);
      taskQuery.sprint = sprint.sprintId;
    }

    console.log("[INFO] Executing task query:", JSON.stringify(taskQuery));
    const tasks = await Task.find(taskQuery);
    console.log(`[INFO] Found ${tasks.length} tasks`);

    if (!tasks.length) {
      const scope =
        projectTag && sprintName
          ? `sprint "${sprintName}" in project "${projectTag}"`
          : projectTag
          ? `project "${projectTag}"`
          : "any project";

      console.log(`[INFO] No tasks found in ${scope}`);
      return {
        success: false,
        message: `No tasks found for ${employeeEmail} in ${scope}`,
        data: null,
      };
    }

    // Collect unique sprint IDs from tasks
    console.log("[INFO] Collecting unique sprint IDs");
    const sprintIds = new Set(tasks.map((task) => task.sprint).filter(Boolean));

    // Fetch sprint names if we have any sprint IDs
    let sprintsMap = new Map();
    if (sprintIds.size > 0) {
      console.log(
        `[INFO] Fetching sprint names and dates for ${sprintIds.size} sprints`
      );
      const sprints = await Sprint.find({
        sprintId: { $in: Array.from(sprintIds) },
      });
      sprintsMap = new Map(
        sprints.map((s: any) => [
          s.sprintId,
          {
            name: s.sprintName,
            startDate: s.startDate?.date?.start || null,
          },
        ])
      );
      console.log(`[INFO] Found ${sprints.length} sprints`);
    }

    console.log("[INFO] Processing tasks by project and sprint");
    const tasksByProject = tasks.reduce((acc: any, task: any) => {
      const projectKey = task.projectTag;
      const sprintInfo = task.sprint ? sprintsMap.get(task.sprint) : null;
      const sprintName = sprintInfo ? sprintInfo.name : "No Sprint";
      const status = task.status?.name || "No Status";

      // Initialize project if needed
      if (!acc[projectKey]) {
        acc[projectKey] = {
          projectName: projectKey,
          sprints: {},
        };
      }

      // Initialize sprint if needed
      if (!acc[projectKey].sprints[sprintName]) {
        acc[projectKey].sprints[sprintName] = {
          sprintName: sprintName,
          sprintId: task.sprint,
          startDate: sprintInfo ? sprintInfo.startDate : null,
          totalTasks: 0,
          totalStoryPoints: 0,
          statusBreakdown: {},
          tasks: {},
        };
      }

      const sprintData = acc[projectKey].sprints[sprintName];

      // Initialize status if needed
      if (!sprintData.statusBreakdown[status]) {
        sprintData.statusBreakdown[status] = {
          count: 0,
          storyPoints: 0,
        };
      }
      if (!sprintData.tasks[status]) {
        sprintData.tasks[status] = [];
      }

      // Update counts and add task
      const storyPoints = Number(task.storyPoints?.name || 0);
      sprintData.totalTasks += 1;
      sprintData.totalStoryPoints += storyPoints;
      sprintData.statusBreakdown[status].count += 1;
      sprintData.statusBreakdown[status].storyPoints += storyPoints;

      sprintData.tasks[status].push({
        taskName: task.taskName,
        storyPoints: storyPoints,
        priority: task.priority?.name || "None",
        status: status,
      });

      return acc;
    }, {});

    console.log("[INFO] Generating summary statistics");
    const summary = {
      totalProjects: Object.keys(tasksByProject).length,
      totalTasks: tasks.length,
      totalStoryPoints: tasks.reduce(
        (sum, task) => sum + Number(task.storyPoints?.name || 0),
        0
      ),
      statusSummary: tasks.reduce((acc: any, task: any) => {
        const status = task.status?.name || "No Status";
        if (!acc[status]) {
          acc[status] = {
            count: 0,
            storyPoints: 0,
          };
        }
        acc[status].count += 1;
        acc[status].storyPoints += Number(task.storyPoints?.name || 0);
        return acc;
      }, {}),
      scope: {
        employeeEmail,
        projectTag: projectTag || "All Projects",
        sprintName: sprintName || "All Sprints",
      },
    };

    console.log("[INFO] Formatting response for Slack");
    const slackMessage = formatForSlack(tasksByProject, summary);

    console.log(
      `[SUCCESS] Completed ticket fetch. Found ${summary.totalTasks} tasks in ${summary.totalProjects} projects`
    );

    return {
      success: true,
      message: `Retrieved ${summary.totalTasks} tasks across ${summary.totalProjects} projects`,
      data: {
        summary,
        projectBreakdown: tasksByProject,
        slackMessage,
      },
    };
  } catch (error: any) {
    console.error("[ERROR] Failed to fetch employee tickets:", error);
    console.error("[ERROR] Stack trace:", error.stack);
    return {
      success: false,
      message: `Error fetching tickets: ${error.message}`,
      data: null,
    };
  }
}

function formatForSlack(tasksByProject: any, summary: any): string {
  const now = new Date();
  const divider = "━".repeat(30);

  // Header Section
  let message = `📋 *Task Report for ${summary.scope.employeeEmail}*\n`;
  message += `${divider}\n`;
  message += `🔍 *Scope:* ${summary.scope.projectTag}${
    summary.scope.sprintName !== "All Sprints"
      ? ` - ${summary.scope.sprintName}`
      : ""
  }\n\n`;

  // Overall Summary Section
  message += `📊 *Overall Summary*\n`;
  message += `${divider}\n`;
  message += `• Total Tasks: \`${summary.totalTasks}\`\n`;
  message += `• Story Points: \`${summary.totalStoryPoints}\`\n`;
  message += `• Projects: \`${summary.totalProjects}\`\n\n`;

  // Status Breakdown Section
  message += `📈 *Status Breakdown*\n`;
  message += `${divider}\n`;
  Object.entries(summary.statusSummary)
    .sort(([statusA], [statusB]) => statusA.localeCompare(statusB))
    .forEach(([status, data]: [string, any]) => {
      const percentage = ((data.count / summary.totalTasks) * 100).toFixed(1);
      message += `• *${status}*: \`${data.count}\` tasks (\`${data.storyPoints}\` pts) - ${percentage}%\n`;
    });

  // Project Details Section
  message += `\n🎯 *Project Details*\n`;
  message += `${divider}\n`;

  Object.entries(tasksByProject).forEach(
    ([projectName, projectData]: [string, any]) => {
      message += `\n🔸 *${projectName}*\n`;

      // Process and sort sprints
      const sprints = Object.entries(projectData.sprints)
        .map(([sprintName, sprintData]: [string, any]) => ({
          name: sprintName,
          data: sprintData,
          startDate: sprintData.startDate
            ? new Date(sprintData.startDate)
            : new Date(0),
        }))
        .filter((sprint) => !sprint.startDate || sprint.startDate <= now)
        .sort((a, b) => b.startDate.getTime() - a.startDate.getTime());

      sprints.forEach((sprint) => {
        // Sprint Header
        message += `   📅 *${sprint.name}*\n`;
        message += `   └─ \`${sprint.data.totalTasks}\` tasks, \`${sprint.data.totalStoryPoints}\` pts\n`;

        // Tasks by Status
        Object.entries(sprint.data.tasks).forEach(
          ([status, tasks]: [string, any]) => {
            if (tasks.length > 0) {
              message += `      *${status}*\n`;
              tasks.forEach((task: any) => {
                const priorityIcon = getPriorityIcon(task.priority);
                const priorityText =
                  task.priority !== "None" ? ` [${task.priority}]` : "";
                message += `         • ${task.taskName}${priorityText} - \`${task.storyPoints}pts\`\n`;
              });
            }
          }
        );
        message += "\n";
      });
    }
  );

  return message;
}

function getPriorityIcon(priority: string): string {
  const icons: { [key: string]: string } = {
    Highest: "🔴",
    High: "🟠",
    Medium: "🟡",
    Low: "🟢",
    Lowest: "⚪",
    None: "⚪",
  };
  return icons[priority] || "⚪";
}

const leaveTypeMap: any = {
  "Annual Leave": "Casual Leave",
  "Sick leave": "Sick Leave",
  "Approved Compensatory Time off": "Approved Compensatory Time off",
};

const durationMap: any = {
  "Full day": "Full Day",
  "First Half": "Half day - First half (9 am to 1 pm)",
  "Second Half": "Half day - Second half ( 2pm to 6 pm)",
};

function formatDateRange(startDate: Date, endDate: Date): string {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (start.toDateString() === end.toDateString()) {
    return start.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  }

  return `${start.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  })} - ${end.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  })}`;
}

function prepareFutureLeaveMessages(notionLeaves: any[]) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  // Add null check for notionLeaves
  const pendingFutureLeaves = (notionLeaves || []).reduce(
    (acc: any[], leave: any) => {
      // Skip if leave or properties is undefined
      if (!leave || !leave.properties) return acc;

      try {
        // Safe access with optional chaining and default values
        const startDateStr = leave.properties["Start Date"]?.date?.start;
        if (!startDateStr) return acc;

        const startDate = new Date(startDateStr);
        const status = leave.properties.Status?.select?.name ?? "Pending";

        // More thorough check for email and employeeName
        const email =
          leave.properties?.Applicant?.created_by?.person?.email ?? "";
        // Skip entries without email
        if (!email) return acc;

        if (startDate >= now && status === "Pending") {
          // Safe access for all remaining properties
          const endDateStr = leave.properties["End Date"]?.date?.start;
          if (!endDateStr) return acc; // Skip if no end date

          try {
            acc.push({
              email,
              startDate,
              endDate: new Date(endDateStr),
              duration:
                leave.properties["Duration of Leave"]?.select?.name ??
                "Unknown",
              type:
                leave.properties["Type of leave"]?.select?.name ?? "Unknown",
              reason:
                leave.properties["Reason "]?.rich_text?.[0]?.plain_text || "",
              status,
            });
          } catch (error) {
            console.error("Error processing leave entry:", error);
          }
        }
        return acc;
      } catch (error) {
        console.error("Error processing leave:", error);
        return acc; // Continue with the next item
      }
    },
    []
  );

  try {
    pendingFutureLeaves.sort(
      (a, b) => a.startDate.getTime() - b.startDate.getTime()
    );
  } catch (error) {
    console.error("Error sorting leaves:", error);
    // Continue with unsorted leaves
  }

  return {
    pendingLeaves: pendingFutureLeaves,
    count: pendingFutureLeaves.length,
    slackMessage: formatPendingLeavesForSlack(pendingFutureLeaves),
  };
}

function formatPendingLeavesForSlack(pendingLeaves: any[]): string {
  if (pendingLeaves.length === 0) {
    return "No pending leaves requiring approval.";
  }

  const divider = "━".repeat(30);
  let message = "🔔 *Pending Leave Requests Requiring Approval*\n";
  message += divider + "\n\n";

  pendingLeaves.forEach((leave, index) => {
    message += `*${index + 1}. ${leave.email}*\n`;
    message += `📅 Date: ${formatDateRange(leave.startDate, leave.endDate)}\n`;
    message += `⏰ Duration: ${leave.duration}\n`;
    message += `📝 Type: ${leave.type}\n`;
    if (leave.reason) {
      message += `💭 Reason: ${leave.reason}\n`;
    }
    message += "\n";
  });

  message += divider + "\n";
  message += `*Total Pending Requests: ${pendingLeaves.length}*\n`;
  message += "Please review and update the status in Notion.\n";
  message += "[NOTION LINK]";

  return message;
}

async function syncNotionLeaves(logger = console) {
  const startTime = Date.now();
  logger.info("Starting notion leaves sync");

  try {
    logger.info(`Fetching leaves from Notion database: ${LEAVE_DATABASE_ID}`);
    const notionLeaves = (await getAllEntries(
      LEAVE_DATABASE_ID
    )) as unknown as any[];
    logger.info(`Retrieved ${notionLeaves.length} leaves from Notion`);

    const futureLeaves = prepareFutureLeaveMessages(notionLeaves);
    logger.info(
      `Found ${futureLeaves.count} pending future leaves requiring approval`
    );

    logger.info("Processing leaves");
    const processedLeaves = [];

    for (const leave of notionLeaves) {
      try {
        const email =
          leave.properties?.Applicant?.created_by?.person?.email ?? "";

        if (!email) {
          logger.warn("Skipping leave without email");
          continue;
        }

        const status = leave.properties?.Status?.select?.name ?? "Pending";
        const normalizedStatus =
          status === "Approved"
            ? "Approved"
            : status === "Rejected"
            ? "Rejected"
            : "Pending";
        const initialStatusEntry = {
          status: normalizedStatus,
          timestamp: new Date(),
        };

        const leaveDoc = {
          email,
          startDate: new Date(
            leave.properties["Start Date"]?.date?.start ?? Date.now()
          ),
          endDate: new Date(
            leave.properties["End Date"]?.date?.start ?? Date.now()
          ),
          duration:
            durationMap[leave.properties["Duration of Leave"]?.select?.name] ||
            "Full Day",
          type:
            leaveTypeMap[leave.properties["Type of leave"]?.select?.name] ||
            "Casual Leave",
          reason: leave.properties["Reason "]?.rich_text?.[0]?.plain_text || "",
          status: normalizedStatus,
          statusHistory: [initialStatusEntry],
          notionId: leave.id,
        };

        processedLeaves.push(leaveDoc);
        logger.debug(`Processed leave for ${email}`);
      } catch (error) {
        logger.error(`Error processing leave:`, error);
      }
    }

    logger.info(`Processed ${processedLeaves.length} valid leaves`);

    logger.info("Starting MongoDB updates");
    let updatedCount = 0;
    let createdCount = 0;

    for (const leaveDoc of processedLeaves) {
      try {
        const query = leaveDoc.notionId
          ? { notionId: leaveDoc.notionId }
          : {
              email: leaveDoc.email,
              startDate: leaveDoc.startDate,
              endDate: leaveDoc.endDate,
              type: leaveDoc.type,
            };

        const existingLeave = await Leave.findOne(query);

        if (existingLeave) {
          if (existingLeave.status !== leaveDoc.status) {
            await existingLeave.updateStatus(leaveDoc.status);
            updatedCount++;
            logger.debug(`Updated existing leave for ${leaveDoc.email}`);
          }
        } else {
          await Leave.create(leaveDoc);
          createdCount++;
          logger.debug(`Created new leave for ${leaveDoc.email}`);
        }
      } catch (err) {
        logger.error(`Failed to save leave:`, err);
      }
    }

    const processingTime = Date.now() - startTime;

    logger.info(`Sync completed in ${processingTime}ms`);
    logger.info(
      `Created ${createdCount} new leaves, updated ${updatedCount} existing leaves`
    );
    await sendMessage(
      slackClient,
      "C03UE404W48",
      // "C03UE404W48",
      futureLeaves.slackMessage ?? ""
    );

    return {
      success: true,
      createdLeaves: createdCount,
      updatedLeaves: updatedCount,
      totalLeaves: notionLeaves.length,
      processingTimeMs: processingTime,
      pendingFutureLeaves: futureLeaves,
    };
  } catch (error: any) {
    const processingTime = Date.now() - startTime;
    logger.error("Error syncing leaves:", {
      error: error.message,
      stack: error.stack,
      processingTimeMs: processingTime,
    });

    return {
      success: false,
      error: error.message,
      processingTimeMs: processingTime,
    };
  }
}

function formatTodaysLeavesForSlack(leaves: any, employees: any) {
  const divider = "━".repeat(30);
  const today = new Date();

  let message = `📋 *Team Members on Leave Today (${today.toDateString()})*\n`;
  message += divider + "\n\n";

  leaves.forEach((leave: any, index: any) => {
    // Format dates
    const startDate = new Date(leave.startDate);
    const endDate = new Date(leave.endDate);
    const dateRange =
      startDate.toDateString() === endDate.toDateString()
        ? startDate.toLocaleDateString()
        : `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;

    // Get name from email (or just use email if can't extract name)
    const name =
      employees.find((employee: any) => employee.email === leave.email)
        .fullName ?? "";

    message += `*${index + 1}. ${name}*\n`;
    message += `⏰ *Duration:* ${leave.duration}\n`;
  });

  message += divider + "\n";
  message += `*Total Team Members on Leave: ${leaves.length}*`;

  return message;
}

async function checkTodaysLeaves(logger = console) {
  const startTime = Date.now();
  logger.info("Checking today's leaves");

  try {
    const today = new Date();

    today.setHours(0, 0, 0, 0);

    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    const employees = await Employee.find({
      status: "Working",
    });

    const todaysLeaves = await Leave.find({
      startDate: { $lte: endOfDay },
      endDate: { $gte: today },
      status: "Approved",
    });

    logger.info(`Found ${todaysLeaves.length} employees on leave today`);

    if (todaysLeaves.length === 0) {
      logger.info("No employees on leave today");

      await sendMessage(
        slackClient,
        "C03HEJRQTRP",
        "No team members are on leave today."
      );

      return {
        success: true,
        onLeaveCount: 0,
        processingTimeMs: Date.now() - startTime,
      };
    }

    // Format the message
    const message = formatTodaysLeavesForSlack(todaysLeaves, employees);

    // Send to Slack
    await sendMessage(slackClient, "C03HEJRQTRP", message);

    const processingTime = Date.now() - startTime;
    logger.info(`Check completed in ${processingTime}ms`);

    return {
      success: true,
      onLeaveCount: todaysLeaves.length,
      processingTimeMs: processingTime,
    };
  } catch (error: any) {
    const processingTime = Date.now() - startTime;
    logger.error("Error checking today's leaves:", {
      error: error.message,
      stack: error.stack,
      processingTimeMs: processingTime,
    });

    return {
      success: false,
      error: error.message,
      processingTimeMs: processingTime,
    };
  }
}

export { getEmployeeTickets, syncNotionLeaves, checkTodaysLeaves };
