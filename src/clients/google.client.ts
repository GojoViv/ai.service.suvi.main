import { calendar_v3, google } from "googleapis";
import {
  GOOGLE_SERVICE_ACCOUNT_EMAIL,
  GOOGLE_PRIVATE_KEY,
  IMPERSONATED_USER_EMAIL,
} from "../config/environment";
import logger from "../utils/logger";
import { ExternalServiceError } from "../utils/errors";

// Type definitions
interface EmailDetails {
  emailId: string;
  snippet: string;
  subject: string;
  from: string;
  date: string;
  body: string;
}

interface EmailOptions {
  from?: string;
  to: string | string[];
  subject: string;
  html: string;
  cc?: string;
}

// Validate required environment variables
if (
  !GOOGLE_SERVICE_ACCOUNT_EMAIL ||
  !GOOGLE_PRIVATE_KEY ||
  !IMPERSONATED_USER_EMAIL
) {
  throw new Error("Missing required Google API credentials");
}

// Initialize Google Auth
const auth = new google.auth.JWT(
  GOOGLE_SERVICE_ACCOUNT_EMAIL,
  "",
  GOOGLE_PRIVATE_KEY,
  [
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.modify",
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive",
    "https://www.googleapis.com/auth/documents.readonly",
    "https://www.googleapis.com/auth/calendar",
  ],
  IMPERSONATED_USER_EMAIL
);

// Initialize Google API clients
const gmail = google.gmail({ version: "v1", auth });
const drive = google.drive({ version: "v3", auth });
const sheets = google.sheets({ version: "v4", auth });
const docs = google.docs({ version: "v1", auth });
const calendar = google.calendar({ version: "v3", auth });

/**
 * Fetches unread emails from Gmail
 * @returns {Promise<EmailDetails[]>} Array of email details
 */
const fetchEmails = async (): Promise<EmailDetails[]> => {
  try {
    const response = await gmail.users.messages.list({
      userId: "me",
      q: "is:unread -from:[EMPLOYEE_EMAIL] -from:@google.com",
      maxResults: 10,
    });
    const messages = response.data.messages || [];

    logger.info({ message: `Fetched ${messages.length} emails` });

    const fetchMessageDetails = messages.map(async (message) => {
      const messageId = message.id;
      if (!messageId) return null;

      try {
        const messageResponse = await gmail.users.messages.get({
          userId: "me",
          id: messageId,
          format: "full",
        });

        const messageData = messageResponse.data;
        if (!messageData) return null;

        const emailDetails: EmailDetails = {
          emailId: messageData.id || "",
          snippet: messageData.snippet || "",
          subject: "",
          from: "",
          date: "",
          body: "",
        };

        const payload = messageData.payload;
        if (payload) {
          const headers = payload.headers || [];
          emailDetails.subject =
            headers.find((h) => h.name === "Subject")?.value || "";
          emailDetails.from =
            headers.find((h) => h.name === "From")?.value || "";
          emailDetails.date =
            headers.find((h) => h.name === "Date")?.value || "";

          if (payload.parts?.length ?? 0 > 0) {
            emailDetails.body = Buffer.from(
              (payload?.parts ?? [])[0]?.body?.data || "",
              "base64"
            ).toString();
          } else if (payload.body?.data) {
            emailDetails.body = Buffer.from(
              payload.body.data,
              "base64"
            ).toString();
          }
        }

        // Mark email as read
        await gmail.users.messages.modify({
          userId: "me",
          id: messageId,
          requestBody: { removeLabelIds: ["UNREAD"] },
        });

        return emailDetails;
      } catch (error) {
        logger.error({
          message: `Error fetching details for message ID ${messageId}`,
          error,
        });
        return null;
      }
    });

    const results = await Promise.all(fetchMessageDetails);
    return results.filter((email): email is EmailDetails => email !== null);
  } catch (error) {
    logger.error({ message: "Error fetching emails", error });
    throw new ExternalServiceError("Failed to fetch emails");
  }
};

/**
 * Sends an email using Gmail API
 * @param {EmailOptions} options Email options
 * @returns {Promise<any>} Response from Gmail API
 */
const sendEmail = async (options: EmailOptions) => {
  const { from, to, subject, html, cc } = options;

  try {
    const emailHeaders = [
      'Content-Type: text/html; charset="UTF-8"',
      "MIME-Version: 1.0",
      cc ? `Cc: ${cc}` : "",
      `From: ${from || "[FROM_EMAIL]"}`,
      `To: ${Array.isArray(to) ? to.join(", ") : to}`,
      `Subject: ${subject}`,
      "",
    ]
      .filter(Boolean)
      .join("\n");

    const base64EncodedEmail = Buffer.from(emailHeaders + html).toString(
      "base64url"
    );

    const response = await gmail.users.messages.send({
      userId: "me",
      requestBody: { raw: base64EncodedEmail },
    });

    logger.info({ message: "Email sent successfully", data: response.data });
    return response.data;
  } catch (error) {
    logger.error({ message: "Failed to send email", error });
    throw new ExternalServiceError("Failed to send email");
  }
};

/**
 * Sends an email with CSV attachment
 * @param {EmailOptions} options Email options
 * @param {string} csvContent CSV content to attach
 * @returns {Promise<any>} Response from Gmail API
 */
const sendEmailRunwayDetails = async (
  options: EmailOptions,
  csvContent?: string
) => {
  const { from, to, subject, html } = options;
  const boundary = `boundary-${Math.random().toString(36).substring(2)}`;

  try {
    const emailParts = [
      `Content-Type: multipart/mixed; boundary="${boundary}"`,
      "MIME-Version: 1.0",
      `From: ${from || "[FROM_EMAIL]"}`,
      `To: ${Array.isArray(to) ? to.join(", ") : to}`,
      `Subject: ${subject}`,
      "",
      `--${boundary}`,
      'Content-Type: text/html; charset="UTF-8"',
      "Content-Transfer-Encoding: base64",
      "",
      Buffer.from(html).toString("base64"),
      "",
    ];

    if (csvContent) {
      emailParts.push(
        `--${boundary}`,
        'Content-Type: text/csv; charset="UTF-8"',
        "Content-Transfer-Encoding: base64",
        'Content-Disposition: attachment; filename="runway_visibility.csv"',
        "",
        Buffer.from(csvContent).toString("base64"),
        ""
      );
    }

    emailParts.push(`--${boundary}--`);

    const base64EncodedEmail = Buffer.from(emailParts.join("\n")).toString(
      "base64url"
    );

    const response = await gmail.users.messages.send({
      userId: "me",
      requestBody: { raw: base64EncodedEmail },
    });

    logger.info({ message: "Email sent successfully", data: response.data });
    return response.data;
  } catch (error) {
    logger.error({ message: "Failed to send email", error });
    throw new ExternalServiceError("Failed to send email");
  }
};

/**
 * Creates a calendar event
 * @param {string} calendarId Calendar ID
 * @param {calendar_v3.Schema$Event} event Event details
 * @returns {Promise<calendar_v3.Schema$Event>} Created event
 */
export const createEvent = async (
  calendarId: string,
  event: calendar_v3.Schema$Event
): Promise<calendar_v3.Schema$Event> => {
  try {
    const response = await calendar.events.insert({
      calendarId,
      requestBody: event,
      sendNotifications: true,
    });
    logger.info({ message: "Event created", data: response.data });
    return response.data;
  } catch (error) {
    logger.error({ message: "Error creating event", error });
    throw new ExternalServiceError("Error creating event");
  }
};

/**
 * Lists calendar events
 * @param {string} calendarId Calendar ID
 * @returns {Promise<calendar_v3.Schema$Event[]>} Array of events
 */
const listEvents = async (
  calendarId: string
): Promise<calendar_v3.Schema$Event[]> => {
  try {
    const response = await calendar.events.list({
      calendarId,
      maxResults: 10,
      singleEvents: true,
      orderBy: "startTime",
    });
    const events = response.data.items || [];
    logger.info({ message: `Fetched ${events.length} events` });
    return events;
  } catch (error) {
    logger.error({ message: "Error listing events", error });
    throw new ExternalServiceError("Error listing events");
  }
};

export {
  gmail,
  fetchEmails,
  sheets,
  drive,
  docs,
  sendEmail,
  calendar,
  sendEmailRunwayDetails,
  listEvents,
};
