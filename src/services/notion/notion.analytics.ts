interface Metrics {
  assigneeMetrics: any;
  sprintMetrics: any[];
  projectMetrics: any[];
  orgMetrics: any;
}

const calculateMetrics = (data: {
  tasks: any;
  sprints: any;
  projects: any;
}): Metrics => {
  const { tasks, sprints, projects } = data;

  const uniqueStatuses = Array.from(
    new Set(tasks.map((task: any) => task.status.name))
  );

  // Assignee Level Metrics
  const assigneeMetrics = tasks.reduce(
    (acc: Record<string, any>, task: any) => {
      const assignee = task.assignee.name;
      if (!acc[assignee]) {
        acc[assignee] = { totalTasks: 0, overdueTasks: 0 };
        uniqueStatuses.forEach((status) => {
          acc[assignee][`${status}Tasks`] = 0;
        });
      }
      acc[assignee].totalTasks += 1;
      acc[assignee][`${task.status.name}Tasks`] += 1;
      if (new Date(task.dueDate) < new Date() && task.status.name !== "Done") {
        acc[assignee].overdueTasks += 1;
      }
      return acc;
    },
    {}
  );

  // Sprint Level Metrics
  const sprintMetrics = sprints.map((sprint: any) => {
    const tasksInSprint = tasks.filter(
      (task: any) => task.sprint === sprint.sprintId
    );
    const totalTasks = tasksInSprint.length;
    const overdueTasks = tasksInSprint.filter(
      (task: any) =>
        new Date(task.dueDate) < new Date() && task.status.name !== "Done"
    ).length;
    const completedTasks = tasksInSprint.filter(
      (task: any) => task.status.name === "Done"
    ).length;
    const completionRate = (completedTasks / totalTasks) * 100;

    return {
      sprintName: sprint.sprintName,
      totalTasks,
      completedTasks,
      overdueTasks,
      completionRate,
    };
  });

  // Project Level Metrics
  const projectMetrics = projects.map((project: any) => {
    const tasksInProject = tasks.filter(
      (task: any) => task.project === project.projectId
    );
    const totalTasks = tasksInProject.length;
    const overdueTasks = tasksInProject.filter(
      (task: any) =>
        new Date(task.dueDate) < new Date() && task.status.name !== "Done"
    ).length;
    const completedTasks = tasksInProject.filter(
      (task: any) => task.status.name === "Done"
    ).length;
    const completionRate = (completedTasks / totalTasks) * 100;

    return {
      projectName: project.projectName,
      totalTasks,
      completedTasks,
      overdueTasks,
      completionRate,
    };
  });

  // Organization Level Metrics
  const orgMetrics = uniqueStatuses.reduce(
    (acc: Record<string, any>, status) => {
      acc[`org${status}Tasks`] = tasks.filter(
        (task: any) => task.status.name === status
      ).length;
      return acc;
    },
    {
      totalTasks: tasks.length,
      overdueTasks: tasks.filter(
        (task: any) =>
          new Date(task.dueDate) < new Date() && task.status.name !== "Done"
      ).length,
    }
  );

  orgMetrics["completionRate"] =
    (orgMetrics["orgCompletedTasks"] / orgMetrics.totalTasks) * 100;

  return { assigneeMetrics, sprintMetrics, projectMetrics, orgMetrics };
};

export { calculateMetrics };
