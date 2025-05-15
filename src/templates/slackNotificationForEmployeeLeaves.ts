const slackNotificationForEmployeeLeaves = (leaves: any) => {
  let message = ":palm_tree: *Today's Leaves:* :palm_tree:\n\n";

  for (const leave of leaves) {
    message += `*Name:* ${leave["Full Name"]}\n`;
    message += `*Department/Team:* ${leave["Department/Team"]}\n`;
    // message += `*Type of Leave:* ${leave["Type of leave"]}\n`;
    // message += `*Reason:* ${leave["Reason For Leave"] || "N/A"}\n`;
    // message += `*From:* ${leave["Starting Leave Date"]} ${leave["Starting Leave Time"]} \n`;
    // message += `*To:* ${leave["Ending Leave Date"]} ${leave["Ending Leave Time"]}\n\n`;
  }

  message += ":point_right: Make necessary arrangements if required.";

  return message;
};

export { slackNotificationForEmployeeLeaves };
