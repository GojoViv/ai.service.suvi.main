import { Task } from "./task.schema";
import { Epic } from "../epic/epic.schema";
import { Sprint } from "../sprint/sprint.schema";

const createTask = async (taskData: any) => {
  try {
    const task = new Task(taskData);
    await task.save();
    await Epic.findByIdAndUpdate(taskData.project, {
      $push: { tasks: task._id },
    });
    await Sprint.findByIdAndUpdate(taskData.sprint, {
      $push: { tasks: task._id },
    });
    console.log("Task created successfully and added to project and sprint");
  } catch (err) {
    console.error("Error creating task:", err);
  }
};

const getTasksByStatus = async (status: string): Promise<any[]> => {
  return Task.find({ "status.name": status });
};

const getTasksBySprint = async (sprintId: string): Promise<any[]> => {
  return Task.find({ sprint: sprintId });
};

const updateTaskById = async (
  id: string,
  updateData: Partial<any>,
  options = { new: true }
): Promise<any | null> => {
  return Task.findByIdAndUpdate(id, updateData, options);
};

const deleteTaskById = async (id: string): Promise<any | null> => {
  return Task.findByIdAndDelete(id);
};

const getAllTasks = async () => {
  try {
    const tasks = await Task.find();
    console.log("All tasks:", tasks);
  } catch (err) {
    console.error("Error fetching tasks:", err);
  }
};

const getTaskById = async (taskId: string) => {
  try {
    const task = await Task.findOne({ taskId });
    if (task) {
      console.log("Task found:", task);
    } else {
      console.log("Task not found");
    }
  } catch (err) {
    console.error("Error fetching task:", err);
  }
};

const updateTask = async (taskId: string, updateData: any) => {
  try {
    const task = await Task.findOneAndUpdate({ taskId }, updateData, {
      new: true,
    });
    if (task) {
      console.log("Task updated:", task);
    } else {
      console.log("Task not found");
    }
  } catch (err) {
    console.error("Error updating task:", err);
  }
};

const deleteTask = async (taskId: string) => {
  try {
    const task = await Task.findOneAndDelete({ taskId });
    if (task) {
      console.log("Task deleted successfully");
    } else {
      console.log("Task not found");
    }
  } catch (err) {
    console.error("Error deleting task:", err);
  }
};

const addChangeLog = async (taskId: string, changeLogEntry: any) => {
  try {
    const task = await Task.findOne({ taskId });
    if (!task) {
      console.error("Task not found");
      return;
    }

    task.changeLog.set(new Date().toISOString(), changeLogEntry);
    await task.save();
    console.log("Change log added successfully");
  } catch (err) {
    console.error("Error adding change log:", err);
  }
};

async function getTaskAnalysisByAssignee() {
  const taskAnalysis = await Task.aggregate([
    {
      $group: {
        _id: {
          assigneeId: "$assignee.id",
          assigneeName: "$assignee.name",
          status: "$status.name",
        },
        totalTasks: { $sum: 1 },
      },
    },
    {
      $group: {
        _id: "$_id.assigneeId",
        assigneeName: { $first: "$_id.assigneeName" },
        tasksByStatus: {
          $push: { status: "$_id.status", count: "$totalTasks" },
        },
      },
    },
    {
      $project: {
        _id: 0,
        assigneeId: "$_id",
        assigneeName: 1,
        tasksByStatus: 1,
      },
    },
  ]);

  // Sanitize sensitive data before returning
  return taskAnalysis.map((analysis) => ({
    ...analysis,
    assigneeId: "REDACTED",
    assigneeName: "REDACTED",
  }));
}

export {
  createTask,
  getTaskById,
  getTasksByStatus,
  getTasksBySprint,
  updateTaskById,
  deleteTaskById,
  getAllTasks,
  updateTask,
  deleteTask,
  addChangeLog,
  getTaskAnalysisByAssignee,
};
