import { Sprint } from "./sprint.schema";

const getSprintsByStatus = async (status: string): Promise<any[]> => {
  return Sprint.find({ "sprintStatus.name": status }).populate("tasks");
};

const updateSprintById = async (
  id: string,
  updateData: Partial<any>,
  options = { new: true }
): Promise<any | null> => {
  return Sprint.findByIdAndUpdate(id, updateData, options).populate("tasks");
};

const deleteSprintById = async (id: string): Promise<any | null> => {
  return Sprint.findByIdAndDelete(id);
};

const addTaskToSprint = async (
  sprintId: string,
  taskId: string
): Promise<any | null> => {
  const sprint = await Sprint.findById(sprintId);
  if (!sprint) {
    throw new Error("Sprint not found");
  }

  sprint.tasks.push(taskId);

  sprint.totalTasks = (sprint.totalTasks || 0) + 1;

  await sprint.save();
  return sprint;
};
const createSprint = async (sprintData: any) => {
  try {
    const sprint = new Sprint(sprintData);
    await sprint.save();
    console.log("Sprint created successfully");
  } catch (err) {
    console.error("Error creating sprint:", err);
  }
};

const getAllSprints = async () => {
  try {
    const sprints = await Sprint.find().populate("tasks");
    console.log("All sprints:", sprints);
  } catch (err) {
    console.error("Error fetching sprints:", err);
  }
};

const getSprintById = async (sprintId: string) => {
  try {
    const sprint = await Sprint.findOne({ sprintId }).populate("tasks");
    if (sprint) {
      console.log("Sprint found:", sprint);
    } else {
      console.log("Sprint not found");
    }
  } catch (err) {
    console.error("Error fetching sprint:", err);
  }
};

const updateSprint = async (sprintId: string, updateData: any) => {
  try {
    const sprint = await Sprint.findOneAndUpdate({ sprintId }, updateData, {
      new: true,
    }).populate("tasks");
    if (sprint) {
      console.log("Sprint updated:", sprint);
    } else {
      console.log("Sprint not found");
    }
  } catch (err) {
    console.error("Error updating sprint:", err);
  }
};

const deleteSprint = async (sprintId: string) => {
  try {
    const sprint = await Sprint.findOneAndDelete({ sprintId });
    if (sprint) {
      console.log("Sprint deleted successfully");
    } else {
      console.log("Sprint not found");
    }
  } catch (err) {
    console.error("Error deleting sprint:", err);
  }
};

export {
  createSprint,
  getSprintById,
  getSprintsByStatus,
  updateSprintById,
  deleteSprintById,
  addTaskToSprint,
  getAllSprints,
  updateSprint,
  deleteSprint,
};
