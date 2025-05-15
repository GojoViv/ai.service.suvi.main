import { fetchSheetData } from "../../models/googleSheet/googleSheet.model";
import { ILeaveCount } from "./IHRService";

export const countLeaves = async (
  spreadSheetId: string,
  range: string
): Promise<{
  leaveCount: ILeaveCount[];
}> => {
  const response = await fetchSheetData(spreadSheetId, range);
  const entries = response;

  const leaveCount: ILeaveCount[] = [];

  for (let i = 0; i < entries.length; i++) {
    const email: string = entries[i][1];
    const dateString = entries[i][5];
    const leaveType = entries[i][10]
      ? entries[i][10].toLowerCase().startsWith("half")
        ? "half"
        : "full"
      : "full";

    const [eDay, eMonth, eYear] = dateString.split("/").map(Number);
    const leaveDate = new Date(eYear, eMonth - 1, eDay + 1);

    if (!email || isNaN(leaveDate.getTime())) continue;

    const year: number = leaveDate.getFullYear();
    const month: string = leaveDate
      .toLocaleString("default", { month: "short" })
      .toLowerCase();
    const formattedDate: string = leaveDate.toISOString().split("T")[0];

    let userEntry: any = leaveCount.find((entry) => entry.email === email);
    if (!userEntry) {
      userEntry = { email, year, data: [] };
      leaveCount.push(userEntry);
    }

    let yearEntry = userEntry.data.find((entry: any) => entry.year === year);
    if (!yearEntry) {
      yearEntry = { year, data: [] };
      userEntry.data.push(yearEntry);
    }

    let monthEntry = yearEntry.data.find((entry: any) => entry.month === month);
    if (!monthEntry) {
      monthEntry = { month, leaves: [] };
      yearEntry.data.push(monthEntry);
    }

    let dateEntry = monthEntry.leaves.find(
      (leave: any) => leave.date === formattedDate && leave.type === leaveType
    );
    if (!dateEntry) {
      dateEntry = { date: formattedDate, type: leaveType, count: 0 };
      monthEntry.leaves.push(dateEntry);
    }

    dateEntry.count++;
  }

  return { leaveCount };
};

export const leaveSummary = async (
  spreadSheetId: string,
  range: string
): Promise<{
  leaveCount: any[];
}> => {
  const response = await fetchSheetData(spreadSheetId, range);
  const entries = response;

  const leaveCount: any = {};

  for (let i = 0; i < entries.length; i++) {
    const dateString = entries[i][5];
    const leaveType = entries[i][10]
      ? entries[i][10].toLowerCase().startsWith("half")
        ? "half"
        : "full"
      : "full";

    const [eDay, eMonth, eYear] = dateString.split("/").map(Number);
    const leaveDate = new Date(eYear, eMonth - 1, eDay + 1);

    if (isNaN(leaveDate.getTime())) continue;

    const year: string = leaveDate.getFullYear().toString();
    const month: string = leaveDate
      .toLocaleString("default", { month: "short" })
      .toLowerCase();
    const formattedDate: string = leaveDate.toISOString().split("T")[0];

    if (!leaveCount[year]) {
      leaveCount[year] = {};
    }
    if (!leaveCount[year][month]) {
      leaveCount[year][month] = {};
    }
    if (!leaveCount[year][month][formattedDate]) {
      leaveCount[year][month][formattedDate] = { full: 0, half: 0 };
    }

    if (leaveType === "half") {
      leaveCount[year][month][formattedDate].half++;
    } else {
      leaveCount[year][month][formattedDate].full++;
    }
  }

  const formattedLeaveCount = Object.keys(leaveCount).map((year) => ({
    year,
    data: Object.keys(leaveCount[year]).map((month) => ({
      month,
      leaves: Object.entries(leaveCount[year][month]).map(([date, count]) => ({
        count,
        date,
      })),
    })),
  }));

  return { leaveCount: formattedLeaveCount };
};

export const countPeopleOnLeaveToday = async (
  spreadSheetId: string,
  range: string
): Promise<{ peopleOnLeaveToday: Set<string>; count: number }> => {
  const response = await fetchSheetData(spreadSheetId, range);
  const entries = response;

  const today = new Date();
  const formattedToday = `${today.getFullYear()}-${String(
    today.getMonth() + 1
  ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const peopleOnLeaveToday = new Set<string>();

  for (let i = 0; i < entries.length; i++) {
    const email = entries[i][1];
    const dateString = entries[i][5];

    const [eDay, eMonth, eYear] = dateString.split("/").map(Number);
    const leaveDate = new Date(eYear, eMonth - 1, eDay);

    const formattedLeaveDate = `${leaveDate.getFullYear()}-${String(
      leaveDate.getMonth() + 1
    ).padStart(2, "0")}-${String(leaveDate.getDate()).padStart(2, "0")}`;

    if (formattedLeaveDate === formattedToday) {
      peopleOnLeaveToday.add(email);
    }
  }

  return { peopleOnLeaveToday, count: peopleOnLeaveToday.size };
};