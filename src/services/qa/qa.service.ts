import fs from "fs";
import path from "path";
import { openai } from "../../clients";
import { TEMP_DIR } from "../../config/environment";
import { takeScreenshots } from "../../util/puppeteer";
import { QA_FRONTEND } from "../../constants/prompts/QA";
import {
  queryDatabase,
  retrieveBlockChildren,
  retrievePage,
  updatePage,
} from "../../models/notion/notion.model";

const cleanUp = (dirPath: string) => {
  if (fs.existsSync(dirPath)) {
    fs.readdirSync(dirPath).forEach((file) =>
      fs.unlinkSync(path.join(dirPath, file))
    );
    fs.rmdirSync(dirPath);
  }
};

const getImageBufferFromUrl = async (url: string) => {
  const response = await fetch(url);
  const designImageBuffer = Buffer.from(await response.arrayBuffer());
  return designImageBuffer;
};

export const QAWebsite = async (url: string) => {
  // return;
  const children = await retrieveBlockChildren("[Notion Database ID]");
  const images = children.results.filter(
    (child: any) => child.type === "image"
  );

  const imageBuffers = await Promise.all(
    images.map(async (imageBlock: any) => {
      const imageUrl = imageBlock.image.file.url;
      return getImageBufferFromUrl(imageUrl);
    })
  );

  imageBuffers.forEach((image, index) => {
    const filePath = `image_${index + 1}.png`;
    fs.writeFile(filePath, image, (err) => {
      if (err) {
        console.error("Error writing PNG file:", err);
      } else {
        console.log(`Successfully saved ${filePath}`);
      }
    });
  });

  await takeScreenshots(url);

  const screenshotPath = path.join(TEMP_DIR, "screenshot-0.png");

  const screenshotBuffer = fs.readFileSync(screenshotPath);

  const designBase64 = imageBuffers.map((buffer) => buffer.toString("base64"));
  const screenshotBase64 = screenshotBuffer.toString("base64");

  const screenshotImage = `data:image/jpeg;base64,${screenshotBase64}`;

  const designImages = designBase64.map((buffer) => ({
    type: "image_url" as any,
    image_url: { url: `data:image/jpeg;base64,${buffer}` },
  }));

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: QA_FRONTEND },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `The first ${
              designImages.length === 1
                ? "image"
                : designImages.length + "images"
            } is the figma design, the second image is the screenshot of the implementation.`,
          },
          ...designImages,
          { type: "image_url", image_url: { url: screenshotImage } },
        ],
      },
    ],
  });

  cleanUp(TEMP_DIR);

  const designReview = response.choices[0].message.content;

  const chunkSize = 2000;
  const designReviewChunks = [];

  for (
    let i = 0;
    i < (designReview?.length ? designReview?.length : 0);
    i += chunkSize
  ) {
    designReviewChunks.push(designReview?.slice(i, i + chunkSize));
  }

  const rich_text = designReviewChunks.map((chunk) => {
    return {
      type: "text",
      text: { content: chunk },
    };
  });
  await updatePage("10d63e92d17b80278f46d691d234cec4", {
    "Design Review": {
      rich_text,
    },
  });

  return designReview;
};
