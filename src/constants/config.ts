export enum ActivityStatus {
  Active = "active",
  OnHold = "onHold",
  Completed = "Completed",
}

// Project configurations
// Replace these IDs with your actual Notion database IDs and Slack channel IDs
export const projects = {
  project1: {
    tag: "project1",
    status: ActivityStatus.Active,
    boards: {
      sprints: "[SPRINTS_DATABASE_ID]",
      projects: "[PROJECTS_DATABASE_ID]",
      tasks: "[TASKS_DATABASE_ID]",
      slackChannelId: "[SLACK_CHANNEL_ID]",
    },
  },
  project2: {
    tag: "project2",
    status: ActivityStatus.Active,
    boards: {
      sprints: "[SPRINTS_DATABASE_ID]",
      projects: "[PROJECTS_DATABASE_ID]",
      tasks: "[TASKS_DATABASE_ID]",
      slackChannelId: "[SLACK_CHANNEL_ID]",
    },
  },
  // Add more projects as needed
};

// Leave database configuration
// Replace with your actual Notion database ID for leaves
export const LEAVE_DATABASE_ID = "[LEAVE_DATABASE_ID]";
