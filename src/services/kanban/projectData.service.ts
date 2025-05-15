import { Project } from "../../models/project/project.schema";
import { getAllEntries } from "../../models/notion/notion.model";

interface ProcessingSummary {
  projectTag: string;
  pagesProcessed: number;
  error?: string;
}

export async function updateAllProjectPRDs(): Promise<ProcessingSummary[]> {
  const summary: ProcessingSummary[] = [];

  try {
    const projects = await Project.find({ status: "active" });
    console.log(`[INFO] Starting PRD update for ${projects.length} projects`);

    for (const project of projects) {
      try {
        if (!project.prd?.notionPageId) {
          console.log(`[SKIP] No PRD ID configured for ${project.tag}`);
          summary.push({
            projectTag: project.tag,
            pagesProcessed: 0,
            error: "No PRD ID configured",
          });
          continue;
        }

        // Get all PRD pages from the database
        const notionPages = await getAllEntries(project.prd.notionPageId);
        if (!notionPages.length) {
          console.log(`[SKIP] No PRD pages found for ${project.tag}`);
          summary.push({
            projectTag: project.tag,
            pagesProcessed: 0,
            error: "No PRD pages found",
          });
          continue;
        }

        // Process each page
        const documents = [];
        for (const page of notionPages) {
          const pageTitle =
            page.properties?.["PRD Title"]?.title?.[0]?.plain_text ||
            "Untitled";
          console.log(
            `[INFO] Processing page: ${pageTitle} for project ${project.tag}`
          );

          try {
            // Format properties
            const properties = formatNotionProperties(page.properties);

            // Create formatted content for this page
            const formattedContent = `# ${pageTitle}
  
  ## Document Properties
  ${Object.entries(properties)
    .map(([key, value]) => `- ${key}: ${value}`)
    .join("\n")}
  
  ## Content

  
  ---
  Last edited: ${new Date(page.last_edited_time).toLocaleString()}
  URL: ${page.url}`;

            // Add this document to our array
            documents.push({
              notionPageId: page.id,
              content: formattedContent.trim(),
            });
          } catch (error: any) {
            console.error(
              `[ERROR] Failed to process page ${pageTitle}:`,
              error.message
            );
          }
        }

        // Update project with all documents
        await Project.findOneAndUpdate(
          { tag: project.tag },
          {
            $set: {
              "prd.documents": documents,
              "prd.notionPageId": project.prd.notionPageId,
            },
          }
        );

        console.log(
          `[SUCCESS] Updated PRD for ${project.tag} | Pages=${documents.length}`
        );
        summary.push({
          projectTag: project.tag,
          pagesProcessed: documents.length,
        });
      } catch (error: any) {
        console.error(
          `[ERROR] Failed processing ${project.tag}:`,
          error.message
        );
        summary.push({
          projectTag: project.tag,
          pagesProcessed: 0,
          error: error.message,
        });
      }
    }
  } catch (error: any) {
    console.error(`[ERROR] Failed updating PRDs:`, error.message);
  }

  return summary;
}

// Helper function for formatting Notion properties
const formatNotionProperties = (properties: any) => {
  const formattedProps: any = {};
  let key: any, value: any;

  for ([key, value] of Object.entries(properties)) {
    switch (value.type) {
      case "multi_select":
        formattedProps[key] = value.multi_select
          .map((item: any) => item.name)
          .join(", ");
        break;
      case "rich_text":
        formattedProps[key] = value.rich_text
          .map((item: any) => item.plain_text)
          .join("");
        break;
      case "date":
        formattedProps[key] = value.date
          ? new Date(value.date.start).toISOString()
          : "Not set";
        break;
      case "title":
        formattedProps[key] = value.title
          .map((item: any) => item.plain_text)
          .join("");
        break;
      default:
        formattedProps[key] = "Value not processed";
    }
  }

  return formattedProps;
};

// Optional: Function to update specific projects
export async function updateSelectedProjectPRDs(
  projectTags: string[]
): Promise<ProcessingSummary[]> {
  const projects = await Project.find({
    tag: { $in: projectTags },
    status: "active",
  });

  console.log(`[INFO] Processing selected projects: ${projectTags.join(", ")}`);

  const summary = [];
  for (const project of projects) {
    if (!project.prd?.notionPageId) {
      summary.push({
        projectTag: project.tag,
        pagesProcessed: 0,
        error: "No PRD ID configured",
      });
      continue;
    }

    try {
      const notionPages = await getAllEntries(project.prd.notionPageId);
      const processedPages = await Promise.all(
        notionPages.map(async (page) => {
          const pageTitle =
            page.properties?.["PRD Title"]?.title?.[0]?.plain_text ||
            "Untitled";

          try {
            const properties = formatNotionProperties(page.properties);
            const formattedContent = `# ${pageTitle}
  
  ## Document Properties
  ${Object.entries(properties)
    .map(([key, value]) => `- ${key}: ${value}`)
    .join("\n")}
  
  ## Content

  
  ---
  Last edited: ${new Date(page.last_edited_time).toLocaleString()}
  URL: ${page.url}`;

            return {
              notionPageId: page.id,
              content: formattedContent.trim(),
            };
          } catch (error) {
            return null;
          }
        })
      );

      const validPages = processedPages.filter(
        (page): page is NonNullable<typeof page> => page !== null
      );

      await Project.findOneAndUpdate(
        { tag: project.tag },
        {
          $set: {
            "prd.documents": validPages,
            "prd.notionPageId": project.prd.notionPageId,
          },
        }
      );

      summary.push({
        projectTag: project.tag,
        pagesProcessed: validPages.length,
      });
    } catch (error: any) {
      summary.push({
        projectTag: project.tag,
        pagesProcessed: 0,
        error: error.message,
      });
    }
  }

  return summary;
}
