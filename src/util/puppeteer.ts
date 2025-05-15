import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";
import { TEMP_DIR } from "../config/environment";

export const takeScreenshots = async (url: string) => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();

  await page.setViewport({ width: 1024, height: 768 });

  await page.goto(url);

  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR);
  }

  let pageHeight = await page.evaluate(() => document.body.scrollHeight);
  let viewportHeight = await page.evaluate(() => window.innerHeight);
  let scrollPosition = 0;
  let screenshotCount = 0;

  while (scrollPosition < pageHeight) {
    const screenshotPath = path.join(
      TEMP_DIR,
      `screenshot-${screenshotCount}.png`
    );
    await page.screenshot({ path: screenshotPath, fullPage: false });
    scrollPosition += viewportHeight;
    await page.evaluate(
      (scrollPos) => window.scrollTo(0, scrollPos),
      scrollPosition
    );
    screenshotCount++;
  }

  await browser.close();
};
