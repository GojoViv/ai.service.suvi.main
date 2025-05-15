import { calendar } from "../../clients/google.client";
import logger from "../../utils/logger";
import { ExternalServiceError } from "../../utils/errors";

const createEvent = async (calendarId: any, event: any) => {
  try {
    const response = await calendar.events.insert({
      calendarId: calendarId,
      requestBody: event,
    });
    logger.info({ message: "Event created", data: response.data });
    return response.data;
  } catch (error) {
    logger.error({ message: "Error creating event", error });
    throw new ExternalServiceError("Error creating event");
  }
};

const listEvents = async (calendarId: any) => {
  try {
    const response = await calendar.events.list({
      calendarId: calendarId,
      maxResults: 10,
      singleEvents: true,
      orderBy: "startTime",
    });
    const events = response.data.items || [];
    logger.info({ message: `Fetched ${events.length} events` });
    events.forEach((event: any) => {
      const start = event.start.dateTime || event.start.date;
      logger.info({ message: `${start} - ${event.summary}` });
    });
    return events;
  } catch (error) {
    logger.error({ message: "Error listing events", error });
    throw new ExternalServiceError("Error listing events");
  }
};

export { createEvent, listEvents };
