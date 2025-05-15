// Example usage: await fetch('/api/projects', { method: 'POST', body: JSON.stringify(project1) })

const project1 = {
  tag: "project1",
  name: "Project One",
  status: "active",
  boards: {
    sprints: "[SPRINTS_DATABASE_ID]",
    projects: "[PROJECTS_DATABASE_ID]",
    tasks: "[TASKS_DATABASE_ID]",
    slackChannelId: "[SLACK_CHANNEL_ID]",
  },
  links: {
    design: {
      internal: "[FIGMA_INTERNAL_URL]",
      client: "[FIGMA_CLIENT_URL]",
    },
    deployment: {
      staging: "[STAGING_URL]",
      production: "[PRODUCTION_URL]",
    },
  },
  communication: {
    channels: {
      internal: [
        {
          type: "slack",
          identifier: "[SLACK_CHANNEL_ID]",
          purpose: "internal",
          provider: {
            name: "slack",
          },
        },
      ],
    },
  },
};

const project2 = {
  tag: "project2",
  name: "Project Two",
  status: "active",
  boards: {
    sprints: "[SPRINTS_DATABASE_ID]",
    projects: "[PROJECTS_DATABASE_ID]",
    tasks: "[TASKS_DATABASE_ID]",
    slackChannelId: "[SLACK_CHANNEL_ID]",
  },
  links: {
    design: {
      internal: "[FIGMA_INTERNAL_URL]",
      client: "[FIGMA_CLIENT_URL]",
    },
    deployment: {
      staging: "[STAGING_URL]",
      production: "[PRODUCTION_URL]",
    },
  },
  communication: {
    channels: {
      internal: [
        {
          type: "slack",
          identifier: "[SLACK_CHANNEL_ID]",
          purpose: "internal",
          provider: {
            name: "slack",
          },
        },
      ],
    },
  },
};

const project3 = {
  tag: "project3",
  name: "Project Three",
  status: "active",
  boards: {
    sprints: "[SPRINTS_DATABASE_ID]",
    projects: "[PROJECTS_DATABASE_ID]",
    tasks: "[TASKS_DATABASE_ID]",
    slackChannelId: "[SLACK_CHANNEL_ID]",
  },
  communication: {
    channels: {
      internal: [
        {
          type: "slack",
          identifier: "[SLACK_CHANNEL_ID]",
          purpose: "internal",
          provider: {
            name: "slack",
          },
        },
      ],
    },
  },
};

const project4 = {
  tag: "project4",
  name: "Project Four",
  status: "active",
  boards: {
    sprints: "[SPRINTS_DATABASE_ID]",
    projects: "[PROJECTS_DATABASE_ID]",
    tasks: "[TASKS_DATABASE_ID]",
    slackChannelId: "[SLACK_CHANNEL_ID]",
  },
  links: {
    design: {
      internal: "[FIGMA_INTERNAL_URL]",
      client: "[FIGMA_CLIENT_URL]",
    },
    deployment: {
      staging: "[STAGING_URL]",
      production: "[PRODUCTION_URL]",
    },
  },
  communication: {
    channels: {
      internal: [
        {
          type: "slack",
          identifier: "[SLACK_CHANNEL_ID]",
          purpose: "internal",
          provider: {
            name: "slack",
          },
        },
      ],
    },
  },
};

const project5 = {
  tag: "project5",
  name: "Project Five",
  status: "active",
  boards: {
    sprints: "[SPRINTS_DATABASE_ID]",
    projects: "[PROJECTS_DATABASE_ID]",
    tasks: "[TASKS_DATABASE_ID]",
    slackChannelId: "[SLACK_CHANNEL_ID]",
  },
  links: {
    design: {
      internal: "[FIGMA_INTERNAL_URL]",
      client: "[FIGMA_CLIENT_URL]",
    },
    deployment: {
      staging: "[STAGING_URL]",
      production: "[PRODUCTION_URL]",
    },
  },
  communication: {
    channels: {
      internal: [
        {
          type: "slack",
          identifier: "[SLACK_CHANNEL_ID]",
          purpose: "internal",
          provider: {
            name: "slack",
          },
        },
      ],
    },
  },
};

const project6 = {
  tag: "project6",
  name: "Project Six",
  status: "active",
  boards: {
    sprints: "[SPRINTS_DATABASE_ID]",
    projects: "[PROJECTS_DATABASE_ID]",
    tasks: "[TASKS_DATABASE_ID]",
    slackChannelId: "[SLACK_CHANNEL_ID]",
  },
  links: {
    design: {
      internal: "[FIGMA_INTERNAL_URL]",
      client: "[FIGMA_CLIENT_URL]",
    },
    deployment: {
      staging: "[STAGING_URL]",
      production: "[PRODUCTION_URL]",
    },
  },
  communication: {
    channels: {
      internal: [
        {
          type: "slack",
          identifier: "[SLACK_CHANNEL_ID]",
          purpose: "internal",
          provider: {
            name: "slack",
          },
        },
      ],
    },
  },
};

const project7 = {
  tag: "project7",
  name: "Project Seven",
  status: "active",
  boards: {
    sprints: "[SPRINTS_DATABASE_ID]",
    projects: "[PROJECTS_DATABASE_ID]",
    tasks: "[TASKS_DATABASE_ID]",
    slackChannelId: "[SLACK_CHANNEL_ID]",
  },
  links: {
    design: {
      internal: "[FIGMA_INTERNAL_URL]",
      client: "[FIGMA_CLIENT_URL]",
    },
    deployment: {
      staging: "[STAGING_URL]",
      production: "[PRODUCTION_URL]",
    },
  },
  communication: {
    channels: {
      internal: [
        {
          type: "slack",
          identifier: "[SLACK_CHANNEL_ID]",
          purpose: "internal",
          provider: {
            name: "slack",
          },
        },
      ],
    },
  },
};

const project8 = {
  tag: "project8",
  name: "Project Eight",
  status: "active",
  boards: {
    sprints: "[SPRINTS_DATABASE_ID]",
    projects: "[PROJECTS_DATABASE_ID]",
    tasks: "[TASKS_DATABASE_ID]",
    slackChannelId: "[SLACK_CHANNEL_ID]",
  },
  links: {
    design: {
      internal: "[FIGMA_INTERNAL_URL]",
      client: "[FIGMA_CLIENT_URL]",
    },
    deployment: {
      staging: "[STAGING_URL]",
      production: "[PRODUCTION_URL]",
    },
  },
  communication: {
    channels: {
      internal: [
        {
          type: "slack",
          identifier: "[SLACK_CHANNEL_ID]",
          purpose: "internal",
          provider: {
            name: "slack",
          },
        },
      ],
    },
  },
};

// Create all projects
const projects = [
  project1,
  project2,
  project3,
  project4,
  project5,
  project6,
  project7,
  project8,
];

export { projects };
