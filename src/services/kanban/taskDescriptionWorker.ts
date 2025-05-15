import { parentPort, workerData } from "worker_threads";
import { logWithTimestamp } from "../../helper";

function extractNotionPageId(taskId: string): string | null {
  const cleanId = taskId.replace(/[-]/g, "");
  return cleanId.length >= 32 ? cleanId.slice(-32) : null;
}

async function processTaskBatch(tasks: any[]) {
  const results = [];
  const workerId = workerData.workerId;

  logWithTimestamp(
    `[${workerId}] Starting batch processing | Tasks=${tasks.length}`
  );

  for (const task of tasks) {
    try {
      const taskId = task._doc.taskId;
      const taskName = task._doc.taskName;
      const _id = task._doc._id;

      logWithTimestamp(
        `[${workerId}] Processing | Name="${taskName}" | ID=${_id} | TaskID=${taskId}`
      );

      const notionPageId = taskId;

      if (!notionPageId) {
        logWithTimestamp(
          `[${workerId}][SKIP] No NotionID | Name="${taskName}" | ID=${_id}`
        );
        continue;
      }

      if (task._doc.taskDescription !== "") {
        logWithTimestamp(
          `[${workerId}][CHANGE] Content updated | Name="${taskName}" | ID=${_id}`
        );
        results.push({
          taskId: taskId,
          newDescription: "",
          taskName: taskName,
          originalTaskId: taskId,
          notionPageId,
          contentLength: 0,
        });
      } else {
        logWithTimestamp(`[${workerId}][SKIP] No changes | Name="${taskName}"`);
      }
    } catch (error: any) {
      logWithTimestamp(
        `[${workerId}][ERROR] Task="${task._doc.taskName}" | Error=${error.message}`
      );
    }
  }

  logWithTimestamp(`[${workerId}] Batch complete | Updates=${results.length}`);
  parentPort?.postMessage(results);
}
const { taskBatch, workerId } = workerData;
processTaskBatch(taskBatch);
