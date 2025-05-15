import { bulkCreateProjects } from "../models/project/project.model";
import { getProject, updateProject } from "../models/project/project.model";
import { ActivityStatus } from "../constants/config";

const projectsToCreate = [
  {
    tag: "project_alpha",
    name: "Project Alpha",
    status: ActivityStatus.Active,
    boards: {
      sprints: "board_id_1",
      projects: "board_id_2",
      tasks: "board_id_3",
      slackChannelId: "CHANNEL_ID_1",
    },
    links: {
      design: {
        internal: "https://www.figma.com/file/project-alpha-internal",
        client: "https://www.figma.com/file/project-alpha-client",
      },
      deployment: {
        staging: "https://staging.project-alpha.com",
        production: "https://project-alpha.com",
      },
    },
    communication: {
      channels: {
        internal: [
          {
            type: "slack",
            identifier: "CHANNEL_ID_1",
            purpose: "internal",
            provider: {
              name: "slack",
            },
          },
        ],
      },
    },
    prd: {
      notionPageId: "notion_page_id_1",
      documents: [
        {
          notionPageId: "",
          content: "",
        },
      ],
    },
    meetingsDatabaseId: "meetings_db_id_1",
  },
  {
    tag: "project_beta",
    name: "Project Beta",
    status: "active",
    boards: {
      sprints: "board_id_4",
      projects: "board_id_5",
      tasks: "board_id_6",
      slackChannelId: "CHANNEL_ID_2",
    },
    links: {
      design: {
        internal: "https://www.figma.com/file/project-beta-internal",
        client: "https://www.figma.com/file/project-beta-client",
      },
      deployment: {
        staging: "https://staging.project-beta.com",
        production: "https://project-beta.com",
      },
    },
    communication: {
      channels: {
        internal: [
          {
            type: "slack",
            identifier: "CHANNEL_ID_2",
            purpose: "internal",
            provider: {
              name: "slack",
            },
          },
        ],
      },
    },
    prd: {
      notionPageId: "notion_page_id_2",
      documents: [
        {
          notionPageId: "",
          content: "",
        },
      ],
    },
    meetingsDatabaseId: "meetings_db_id_2",
  },
  {
    tag: "project_gamma",
    name: "Project Gamma",
    status: "active",
    boards: {
      sprints: "board_id_7",
      projects: "board_id_8",
      tasks: "board_id_9",
      slackChannelId: "CHANNEL_ID_3",
    },
    communication: {
      channels: {
        internal: [
          {
            type: "slack",
            identifier: "CHANNEL_ID_3",
            purpose: "internal",
            provider: {
              name: "slack",
            },
          },
        ],
      },
    },
    meetingsDatabaseId: "meetings_db_id_3",
  },
  {
    tag: "project_delta",
    name: "Project Delta",
    status: "active",
    boards: {
      sprints: "board_id_10",
      projects: "board_id_11",
      tasks: "board_id_12",
      slackChannelId: "CHANNEL_ID_4",
    },
    links: {
      design: {
        internal: "https://www.figma.com/file/project-delta-internal",
        client: "https://www.figma.com/file/project-delta-client",
      },
      deployment: {
        staging: "https://staging.project-delta.com",
        production: "https://project-delta.com",
      },
    },
    communication: {
      channels: {
        internal: [
          {
            type: "slack",
            identifier: "CHANNEL_ID_4",
            purpose: "internal",
            provider: {
              name: "slack",
            },
          },
        ],
      },
    },
    prd: {
      notionPageId: "notion_page_id_3",
      documents: [
        {
          notionPageId: "",
          content: "",
        },
      ],
    },
    meetingsDatabaseId: "meetings_db_id_4",
  },
  {
    tag: "project_epsilon",
    name: "Project Epsilon",
    status: "active",
    boards: {
      sprints: "board_id_13",
      projects: "board_id_14",
      tasks: "board_id_15",
      slackChannelId: "CHANNEL_ID_5",
    },
    links: {
      design: {
        internal: "https://www.figma.com/file/project-epsilon-internal",
        client: "https://www.figma.com/file/project-epsilon-client",
      },
      deployment: {
        staging: "https://staging.project-epsilon.com",
        production: "https://project-epsilon.com",
      },
    },
    communication: {
      channels: {
        internal: [
          {
            type: "slack",
            identifier: "CHANNEL_ID_5",
            purpose: "internal",
            provider: {
              name: "slack",
            },
          },
        ],
      },
    },
    prd: {
      notionPageId: "notion_page_id_4",
      documents: [
        {
          notionPageId: "",
          content: "",
        },
      ],
    },
    meetingsDatabaseId: "meetings_db_id_5",
  },
  {
    tag: "project_zeta",
    name: "Project Zeta",
    status: "active",
    boards: {
      sprints: "board_id_16",
      projects: "board_id_17",
      tasks: "board_id_18",
      slackChannelId: "CHANNEL_ID_6",
    },
    links: {
      design: {
        internal: "https://www.figma.com/file/project-zeta-internal",
        client: "https://www.figma.com/file/project-zeta-client",
      },
      deployment: {
        staging: "https://staging.project-zeta.com",
        production: "https://project-zeta.com",
      },
    },
    communication: {
      channels: {
        internal: [
          {
            type: "slack",
            identifier: "CHANNEL_ID_6",
            purpose: "internal",
            provider: {
              name: "slack",
            },
          },
        ],
      },
    },
    prd: {
      notionPageId: "notion_page_id_5",
      documents: [
        {
          notionPageId: "",
          content: "",
        },
      ],
    },
    meetingsDatabaseId: "meetings_db_id_6",
  },
  {
    tag: "project_eta",
    name: "Project Eta",
    status: "active",
    boards: {
      sprints: "board_id_19",
      projects: "board_id_20",
      tasks: "board_id_21",
      slackChannelId: "CHANNEL_ID_7",
    },
    links: {
      design: {
        internal: "https://www.figma.com/file/project-eta-internal",
        client: "https://www.figma.com/file/project-eta-client",
      },
      deployment: {
        staging: "https://staging.project-eta.com",
        production: "https://project-eta.com",
      },
    },
    communication: {
      channels: {
        internal: [
          {
            type: "slack",
            identifier: "CHANNEL_ID_7",
            purpose: "internal",
            provider: {
              name: "slack",
            },
          },
        ],
      },
    },
    prd: {
      notionPageId: "notion_page_id_6",
      documents: [
        {
          notionPageId: "",
          content: "",
        },
      ],
    },
    meetingsDatabaseId: "meetings_db_id_7",
  },
  {
    tag: "project_theta",
    name: "Project Theta",
    status: "active",
    boards: {
      sprints: "board_id_22",
      projects: "board_id_23",
      tasks: "board_id_24",
      slackChannelId: "CHANNEL_ID_8",
    },
    links: {
      design: {
        internal: "https://www.figma.com/file/project-theta-internal",
        client: "https://www.figma.com/file/project-theta-client",
      },
      deployment: {
        staging: "https://staging.project-theta.com",
        production: "https://project-theta.com",
      },
    },
    communication: {
      channels: {
        internal: [
          {
            type: "slack",
            identifier: "CHANNEL_ID_8",
            purpose: "internal",
            provider: {
              name: "slack",
            },
          },
        ],
      },
    },
    prd: {
      notionPageId: "notion_page_id_7",
      documents: [
        {
          notionPageId: "",
          content: "",
        },
      ],
    },
    meetingsDatabaseId: "meetings_db_id_8",
  },
  {
    tag: "project_iota",
    name: "Project Iota",
    status: "active",
    boards: {
      sprints: "board_id_25",
      projects: "board_id_26",
      tasks: "board_id_27",
      slackChannelId: "CHANNEL_ID_9",
    },
    links: {
      design: {
        internal: "",
        client: "",
      },
      deployment: {
        staging: "",
        production: "",
      },
    },
    communication: {
      channels: {
        internal: [
          {
            type: "slack",
            identifier: "CHANNEL_ID_9",
            purpose: "internal",
            provider: {
              name: "slack",
            },
          },
        ],
      },
    },
    prd: {
      notionPageId: "notion_page_id_8",
      documents: [
        {
          notionPageId: "",
          content: "",
        },
      ],
    },
    meetingsDatabaseId: "meetings_db_id_9",
  },
  {
    tag: "project_kappa",
    name: "Project Kappa",
    status: "active",
    boards: {
      sprints: "board_id_28",
      projects: "board_id_29",
      tasks: "board_id_30",
      slackChannelId: "CHANNEL_ID_10",
    },
    links: {
      design: {
        internal: "",
        client: "",
      },
      deployment: {
        staging: "",
        production: "",
      },
    },
    communication: {
      channels: {
        internal: [
          {
            type: "slack",
            identifier: "CHANNEL_ID_10",
            purpose: "internal",
            provider: {
              name: "slack",
            },
          },
        ],
      },
    },
    prd: {
      notionPageId: "notion_page_id_9",
      documents: [
        {
          notionPageId: "",
          content: "",
        },
      ],
    },
    meetingsDatabaseId: "meetings_db_id_10",
  },
  {
    tag: "project_lambda",
    name: "Project Lambda",
    status: "active",
    boards: {
      sprints: "board_id_31",
      projects: "board_id_32",
      tasks: "board_id_33",
      slackChannelId: "CHANNEL_ID_11",
    },
    links: {
      design: {
        internal: "",
        client: "",
      },
      deployment: {
        staging: "",
        production: "",
      },
    },
    communication: {
      channels: {
        internal: [
          {
            type: "slack",
            identifier: "CHANNEL_ID_11",
            purpose: "internal",
            provider: {
              name: "slack",
            },
          },
        ],
      },
    },
    prd: {
      notionPageId: "notion_page_id_10",
      documents: [
        {
          notionPageId: "",
          content: "",
        },
      ],
    },
    meetingsDatabaseId: "meetings_db_id_11",
  },
  {
    tag: "project_mu",
    name: "Project Mu",
    status: "active",
    boards: {
      sprints: "board_id_34",
      projects: "board_id_35",
      tasks: "board_id_36",
      slackChannelId: "CHANNEL_ID_12",
    },
    links: {
      design: {
        internal: "",
        client: "",
      },
      deployment: {
        staging: "",
        production: "",
      },
    },
    communication: {
      channels: {
        internal: [
          {
            type: "slack",
            identifier: "CHANNEL_ID_12",
            purpose: "internal",
            provider: {
              name: "slack",
            },
          },
        ],
      },
    },
    prd: {
      notionPageId: "notion_page_id_11",
      documents: [
        {
          notionPageId: "",
          content: "",
        },
      ],
    },
    meetingsDatabaseId: "meetings_db_id_12",
  },
  {
    tag: "project_nu",
    name: "Project Nu",
    status: "active",
    boards: {
      sprints: "board_id_37",
      projects: "board_id_38",
      tasks: "board_id_39",
      slackChannelId: "CHANNEL_ID_13",
    },
    links: {
      design: {
        internal: "",
        client: "",
      },
      deployment: {
        staging: "",
        production: "",
      },
    },
    communication: {
      channels: {
        internal: [
          {
            type: "slack",
            identifier: "CHANNEL_ID_13",
            purpose: "internal",
            provider: {
              name: "slack",
            },
          },
        ],
      },
    },
    prd: {
      notionPageId: "notion_page_id_12",
      documents: [
        {
          notionPageId: "",
          content: "",
        },
      ],
    },
    meetingsDatabaseId: "meetings_db_id_13",
  },
  {
    tag: "project_xi",
    name: "Project Xi",
    status: "active",
    boards: {
      sprints: "board_id_40",
      projects: "board_id_41",
      tasks: "board_id_42",
      slackChannelId: "CHANNEL_ID_14",
    },
    links: {
      design: {
        internal: "",
        client: "",
      },
      deployment: {
        staging: "",
        production: "",
      },
    },
    communication: {
      channels: {
        internal: [
          {
            type: "slack",
            identifier: "CHANNEL_ID_14",
            purpose: "internal",
            provider: {
              name: "slack",
            },
          },
        ],
      },
    },
    prd: {
      notionPageId: "notion_page_id_13",
      documents: [
        {
          notionPageId: "",
          content: "",
        },
      ],
    },
    meetingsDatabaseId: "meetings_db_id_14",
  },
  {
    tag: "project_omicron",
    name: "Project Omicron",
    status: ActivityStatus.Active,
    boards: {
      sprints: "board_id_43",
      projects: "board_id_44",
      tasks: "board_id_45",
      slackChannelId: "CHANNEL_ID_15",
    },
    links: {
      design: {
        internal: "",
        client: "",
      },
      deployment: {
        staging: "",
        production: "",
      },
    },
    communication: {
      channels: {
        internal: [
          {
            type: "slack",
            identifier: "CHANNEL_ID_15",
            purpose: "internal",
            provider: {
              name: "slack",
            },
          },
        ],
      },
    },
    prd: {
      notionPageId: "",
      documents: [
        {
          notionPageId: "",
          content: "",
        },
      ],
    },
    meetingsDatabaseId: "meetings_db_id_15",
  },
  {
    tag: "project_pi",
    name: "Project Pi",
    status: ActivityStatus.Active,
    boards: {
      sprints: "board_id_46",
      projects: "board_id_47",
      tasks: "board_id_48",
      slackChannelId: "CHANNEL_ID_16",
    },
    links: {
      design: {
        internal: "",
        client: "",
      },
      deployment: {
        staging: "",
        production: "",
      },
    },
    communication: {
      channels: {
        internal: [
          {
            type: "slack",
            identifier: "CHANNEL_ID_16",
            purpose: "internal",
            provider: {
              name: "slack",
            },
          },
        ],
      },
    },
    prd: {
      notionPageId: "",
      documents: [
        {
          notionPageId: "",
          content: "",
        },
      ],
    },
    meetingsDatabaseId: "meetings_db_id_16",
  },
  {
    tag: "project_rho",
    name: "Project Rho",
    status: ActivityStatus.Active,
    boards: {
      sprints: "board_id_49",
      projects: "board_id_50",
      tasks: "board_id_51",
      slackChannelId: "CHANNEL_ID_17",
    },
    links: {
      design: {
        internal: "",
        client: "",
      },
      deployment: {
        staging: "",
        production: "",
      },
    },
    communication: {
      channels: {
        internal: [
          {
            type: "slack",
            identifier: "CHANNEL_ID_17",
            purpose: "internal",
            provider: {
              name: "slack",
            },
          },
        ],
      },
    },
    prd: {
      notionPageId: "",
      documents: [
        {
          notionPageId: "",
          content: "",
        },
      ],
    },
    meetingsDatabaseId: "meetings_db_id_17",
  },
];

//TODO: Update is not working look into it later
const createOrUpdateProjects = async () => {
  try {
    const results = [];

    for (const project of projectsToCreate) {
      try {
        const existingProject = await getProject(project.tag);
        if (existingProject) {
          // Track which fields are being updated
          const fieldChanges: any = {};

          // Deep merge function to handle nested objects
          const deepMerge = (target: any, source: any) => {
            const output = { ...target };

            for (const key in source) {
              if (
                source[key] !== null &&
                typeof source[key] === "object" &&
                !Array.isArray(source[key])
              ) {
                if (!(key in target)) {
                  // New object field
                  output[key] = source[key];
                  fieldChanges[key] = { status: "added", value: source[key] };
                } else {
                  // Merge existing object field
                  output[key] = deepMerge(target[key], source[key]);
                  if (
                    JSON.stringify(target[key]) !== JSON.stringify(output[key])
                  ) {
                    fieldChanges[key] = {
                      status: "modified",
                      previousValue: target[key],
                      newValue: output[key],
                    };
                  }
                }
              } else {
                // Handle direct value or array assignments
                if (
                  JSON.stringify(target[key]) !== JSON.stringify(source[key])
                ) {
                  output[key] = source[key];
                  fieldChanges[key] = {
                    status: key in target ? "modified" : "added",
                    previousValue: target[key],
                    newValue: source[key],
                  };
                }
              }
            }

            return output;
          };

          // Merge existing project with new data
          const updateData = deepMerge(existingProject, project);

          const updatedProject = await updateProject(project.tag, updateData);
          results.push({
            tag: project.tag,
            status: "updated",
            data: updatedProject,
            changes: fieldChanges,
            updatedFields: Object.keys(fieldChanges),
          });

          // Log changes in a structured way
          console.log(`Updated existing project: ${project.tag}`);
          if (Object.keys(fieldChanges).length > 0) {
            console.log(
              "Fields updated:",
              Object.entries(fieldChanges)
                .map(
                  ([field, change]: [string, any]) =>
                    `${field} (${change.status})`
                )
                .join(", ")
            );
          }
        } else {
          const newProject = await bulkCreateProjects([project]);
          results.push({
            tag: project.tag,
            status: "created",
            data: newProject,
          });
          console.log(`Created new project: ${project.tag}`);
        }
      } catch (error: any) {
        results.push({
          tag: project.tag,
          status: "failed",
          error: error.message || "Unknown error",
        });
        console.error(`Failed to process project ${project.tag}:`, error);
      }
    }

    // Group changes by field for summary
    const fieldUpdateSummary: any = results
      .filter((r) => r.status === "updated")
      .reduce((acc: any, result) => {
        (result.updatedFields || []).forEach((field) => {
          acc[field] = (acc[field] || 0) + 1;
        });
        return acc;
      }, {});

    const summary = {
      total: results.length,
      created: results.filter((r) => r.status === "created").length,
      updated: results.filter((r) => r.status === "updated").length,
      failed: results.filter((r) => r.status === "failed").length,
      fieldUpdates: fieldUpdateSummary,
      results,
    };

    console.log("Project creation/update summary:", summary);
    return summary;
  } catch (error) {
    console.error("Failed to process projects:", error);
    throw error;
  }
};

export { createOrUpdateProjects };
