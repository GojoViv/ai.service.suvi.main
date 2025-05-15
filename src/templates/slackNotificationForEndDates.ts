export const slackNotificationForEndDates = (
  userId: string,
  tickets: any
): string => {
  let message: string = `Hi <@${userId}> \nDaily reminder for end dates on tickets:\n`;

  tickets.forEach((ticket: any) => {
    message += `• ${
      ticket.link
        ? `<${ticket.link}|Ticket ${ticket.ticketNumber}>`
        : `Ticket ${ticket.ticketNumber}`
    }: ${ticket.endDate}\n`;
  });

  return message;
};
