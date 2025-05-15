// Function to check for holidays tomorrow
import { NotionDatabases } from "../../constants";
import { notion } from "../../clients/notion.client";
import { QueryDatabaseResponse } from "@notionhq/client/build/src/api-endpoints";
import { fetchSheetData } from "../../models/googleSheet/googleSheet.model";
import { isWithinInterval } from "date-fns";
import { slackNotificationForEmployeeLeaves } from "../../templates";
import { sendMessage } from "../../models/slack/slack.model";
import { SlackChannelId } from "../../constants";
import { initializeSlackClient } from "../../clients/slack.client";
import { SLACK_TOKEN } from "../../config/environment";
// import { EmployeeModel } from "../../models/employee/employee.schema";
import { sendEmail } from "../../clients/google.client";
import { HolidayEmailTemplate } from "../../templates";
import Employee from "../../models/employee/employee.schema";

const parseDateString = (dateStr: string): Date => {
  const [day, month, year] = dateStr.split("/").map(Number);
  return new Date(year, month - 1, day); // Month is 0-indexed in JS
};

const isDateInRange = (
  startDateStr: string,
  endDateStr: string,
  currentDate: Date
): boolean => {
  const startDate = parseDateString(startDateStr);
  const endDate = parseDateString(endDateStr);
  endDate.setHours(23, 59, 59, 999); // Set end time to end of day
  currentDate.setHours(0, 0, 0, 0); // Compare dates without time

  return isWithinInterval(currentDate, { start: startDate, end: endDate });
};

// Utility function to reset time to midnight
const resetToMidnight = (date: Date): Date => {
  date.setHours(0, 0, 0, 0);
  return date;
};

// Utility function to check if a date is tomorrow
const isTomorrow = (date: Date): boolean => {
  const tomorrow = resetToMidnight(new Date());
  tomorrow.setDate(tomorrow.getDate() + 1);
  return date.getTime() === tomorrow.getTime();
};

const extractHoliday = (holiday: any): any => {
  const holidayName = holiday?.properties?.Holiday?.title[0]?.text?.content;
  const holidayDate = new Date(holiday?.properties?.Date?.date?.start ?? "");
  return {
    isHoliday: isTomorrow(resetToMidnight(holidayDate)),
    holidayName,
  };
};

const checkForHoliday = async (databaseId: string) => {
  try {
    const response: QueryDatabaseResponse = await notion.databases.query({
      database_id: databaseId,
    });
    for (const result of response.results) {
      const holiday = extractHoliday(result);
      if (holiday.isHoliday) return holiday;
    }
    return { isHoliday: false, holidayName: null };
  } catch (error) {
    console.error("Error fetching holidays from Notion API:", error);
    return { isHoliday: false, holidayName: null };
  }
};

const checkForLeavesToday = async (
  spreadSheetId: string,
  range: string
): Promise<void> => {
  try {
    const slackClient = initializeSlackClient(SLACK_TOKEN ?? "");
    const { isHoliday } = await checkForHoliday("[NOTION_DATABASE_ID]");
    if (isHoliday) {
      console.log("Today is a holiday, so not checking for leaves.");
      return;
    }

    const entries = await fetchSheetData(spreadSheetId, range);

    if (!entries || entries.length <= 1) {
      throw new Error("The sheet is empty or only contains headers.");
    }

    const columnNames = entries[0];
    const requiredColumns = [
      "Timestamp",
      "Email address",
      "Full Name",
      "Type of leave",
      "Reason For Leave",
      "Starting Leave Date",
      "Starting Leave Time",
      "Ending Leave Date",
      "Ending Leave Time",
      "Department/Team",
    ];

    requiredColumns.forEach((column) => {
      if (!columnNames.includes(column)) {
        throw new Error(`Missing required column: ${column}`);
      }
    });

    const leavesToday = entries
      .slice(1)
      .map((row: any, index: number) => {
        let entryObj = row.reduce(
          (obj: any, cell: any, idx: number) => ({
            ...obj,
            [columnNames[idx]]: cell || null,
          }),
          {}
        );

        if (
          !entryObj["Starting Leave Date"] ||
          !entryObj["Ending Leave Date"]
        ) {
          console.warn(`Row ${index + 2} is missing start or end dates.`);
          return null;
        }

        return isDateInRange(
          entryObj["Starting Leave Date"],
          entryObj["Ending Leave Date"],
          new Date()
        )
          ? entryObj
          : null;
      })
      .filter(Boolean);

    if (leavesToday.length > 0) {
      const message = slackNotificationForEmployeeLeaves(leavesToday);
      await sendMessage(slackClient, "", message);
      console.log("Leaves today:", leavesToday);
    } else {
      console.log("No leaves today!");
    }
  } catch (error) {
    console.error("Error in notifying leaves on Slack:", error);
  }
};

const informTeamForUpcomingHolidays = async () => {
  const employees = await Employee.find({
    status: "Working",
  });

  const listOfEmails = [employees.map((employee) => employee.email).join(",")];

  console.log("List of emails:", listOfEmails);

  try {
    const holiday = await checkForHoliday("[NOTION_DATABASE_ID]");
    console.log("Holiday tomorrow:", holiday);
    if (holiday.isHoliday && holiday.holidayName) {
      await sendEmail({
        from: process.env.IMPERSONATED_USER_EMAIL ?? "",
        to: listOfEmails,
        subject: `Upcoming Holiday Alert: ${holiday.holidayName}`,
        html: HolidayEmailTemplate(holiday.holidayName),
        cc: "",
      });
    } else {
      console.log("No Holiday tomorrow!");
    }
  } catch (error) {
    console.error("Error in sending holiday email reminder:", error);
  }
};

export { checkForLeavesToday, informTeamForUpcomingHolidays };
