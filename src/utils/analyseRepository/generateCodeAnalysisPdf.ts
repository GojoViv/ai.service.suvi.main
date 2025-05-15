import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

async function extractMetadataFromClonedRepo(repoPath: string) {
  const metadata: any = {
    totalFiles: 0,
    totalLOC: 0,
    fileTypes: {},
    codeFiles: [],
  };

  const traverseDirectory = (directory: string) => {
    const files = fs.readdirSync(directory);
    files.forEach((file) => {
      const filePath = path.join(directory, file);
      if (fs.statSync(filePath).isDirectory()) {
        traverseDirectory(filePath);
      } else {
        const extension = path.extname(file).toLowerCase();
        metadata.totalFiles += 1;
        metadata.fileTypes[extension] =
          (metadata.fileTypes[extension] || 0) + 1;

        const content = fs.readFileSync(filePath, "utf-8");
        const loc = content.split("\n").length;

        metadata.totalLOC += loc;

        if (
          [".js", ".ts", ".py", ".java", ".cpp", ".cs", ".dart"].includes(
            extension
          )
        ) {
          metadata.codeFiles.push({
            name: file,
            path: filePath,
            extension,
            loc,
            content,
          });
        }
      }
    });
  };

  traverseDirectory(repoPath);
  return metadata;
}

async function generateCodeAnalysisPdf(
  metadata: any,
  analysis: string
): Promise<string> {
  const doc = new PDFDocument();
  const pdfPath = `code_analysis_${Date.now()}.pdf`;
  const writeStream = fs.createWriteStream(pdfPath);

  doc.pipe(writeStream);

  doc
    .fontSize(18)
    .text("Codebase Analysis Report", { align: "center" })
    .moveDown(2);

  doc.fontSize(14).text("1. Metadata", { underline: true }).moveDown();

  doc
    .fontSize(12)
    .text(`Total Files: ${metadata.totalFiles}`)
    .moveDown(0.5)
    .text(`Total Lines of Code (LOC): ${metadata.totalLOC}`)
    .moveDown(0.5)
    .text(
      `File Types:\n${Object.entries(metadata.fileTypes)
        .map(([type, count]) => `- ${type}: ${count} files`)
        .join("\n")}`
    )
    .moveDown(2);

  doc.fontSize(14).text("2. Analysis", { underline: true }).moveDown();

  doc
    .fontSize(12)
    .text(analysis, {
      align: "left",
      lineGap: 4,
    })
    .moveDown();

  doc.end();

  return new Promise((resolve, reject) => {
    writeStream.on("finish", () => resolve(pdfPath));
    writeStream.on("error", (error) => reject(error));
  });
}

export { generateCodeAnalysisPdf, extractMetadataFromClonedRepo };
