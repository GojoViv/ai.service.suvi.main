import { notion } from "../clients";
import { BlockObjectResponse } from "@notionhq/client/build/src/api-endpoints";

async function getNotionPageContent(pageId: string): Promise<string | null> {
  try {
    const response = await notion.blocks.children.list({
      block_id: pageId,
      page_size: 100,
    });

    let content = "";

    for (const block of response.results) {
      // Type guard to ensure we're working with a full BlockObjectResponse
      if (!("type" in block)) {
        continue;
      }

      const typedBlock: any = block as BlockObjectResponse;

      switch (typedBlock.type) {
        case "paragraph":
          content +=
            typedBlock.paragraph.rich_text
              .map((text: any) => text.plain_text)
              .join("") + "\n\n";
          break;

        case "heading_1":
          content +=
            "# " +
            typedBlock.heading_1.rich_text
              .map((text: any) => text.plain_text)
              .join("") +
            "\n\n";
          break;

        case "heading_2":
          content +=
            "## " +
            typedBlock.heading_2.rich_text
              .map((text: any) => text.plain_text)
              .join("") +
            "\n\n";
          break;

        case "heading_3":
          content +=
            "### " +
            typedBlock.heading_3.rich_text
              .map((text: any) => text.plain_text)
              .join("") +
            "\n\n";
          break;

        case "bulleted_list_item":
          content +=
            "• " +
            typedBlock.bulleted_list_item.rich_text
              .map((text: any) => text.plain_text)
              .join("") +
            "\n";
          break;

        case "numbered_list_item":
          content +=
            "1. " +
            typedBlock.numbered_list_item.rich_text
              .map((text: any) => text.plain_text)
              .join("") +
            "\n";
          break;

        case "to_do":
          const checkbox = typedBlock.to_do.checked ? "[x]" : "[ ]";
          content +=
            checkbox +
            " " +
            typedBlock.to_do.rich_text
              .map((text: any) => text.plain_text)
              .join("") +
            "\n";
          break;

        case "quote":
          content +=
            "> " +
            typedBlock.quote.rich_text
              .map((text: any) => text.plain_text)
              .join("") +
            "\n\n";
          break;

        case "callout":
          content +=
            "📌 " +
            typedBlock.callout.rich_text
              .map((text: any) => text.plain_text)
              .join("") +
            "\n\n";
          break;

        case "code":
          content +=
            "```" +
            (typedBlock.code.language || "") +
            "\n" +
            typedBlock.code.rich_text
              .map((text: any) => text.plain_text)
              .join("") +
            "\n```\n\n";
          break;

        case "divider":
          content += "---\n\n";
          break;

        // case "break":
        //   content += "\n";
        //   break;

        case "table":
          content += "\n";
          const rows = await notion.blocks.children.list({
            block_id: typedBlock.id,
          });

          for (const row of rows.results) {
            if (!("type" in row)) continue;
            const typedRow = row as BlockObjectResponse;

            if (typedRow.type === "table_row") {
              content +=
                "| " +
                typedRow.table_row.cells
                  .map((cell) => cell.map((text) => text.plain_text).join(""))
                  .join(" | ") +
                " |\n";
            }
          }
          content += "\n";
          break;

        case "toggle":
          content +=
            "▼ " +
            typedBlock.toggle.rich_text
              .map((text: any) => text.plain_text)
              .join("") +
            "\n\n";
          break;

        case "equation":
          content += "$$\n" + typedBlock.equation.expression + "\n$$\n\n";
          break;

        case "bookmark":
          content += `🔖 [${typedBlock.bookmark.url}](${typedBlock.bookmark.url})\n\n`;
          break;

        case "link_preview":
          content += `🌐 [Link Preview](${typedBlock.link_preview.url})\n\n`;
          break;

        case "template":
          content +=
            "📝 Template: " +
            typedBlock.template.rich_text
              .map((text: any) => text.plain_text)
              .join("") +
            "\n\n";
          break;

        case "synced_block":
          if (typedBlock.synced_block.children) {
            for (const childBlock of typedBlock.synced_block.children) {
              if ("id" in childBlock) {
                const childContent = await getNotionPageContent(childBlock.id);
                if (childContent) {
                  content += childContent + "\n";
                }
              }
            }
          }
          break;
      }
    }

    // Handle pagination
    if (response.has_more && response.next_cursor) {
      const nextBlocks = await notion.blocks.children.list({
        block_id: pageId,
        start_cursor: response.next_cursor,
      });

      if (nextBlocks.results[0] && "id" in nextBlocks.results[0]) {
        const nextContent = await getNotionPageContent(
          nextBlocks.results[0].id
        );
        if (nextContent) {
          content += nextContent;
        }
      }
    }

    return content.trim();
  } catch (error) {
    console.error("Error fetching Notion content:", error);
    return null;
  }
}

export { getNotionPageContent };
