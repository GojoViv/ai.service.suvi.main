export interface ILeaveCount {
  email: string;
  year: number;
  data: {
    month: string;
    leaves: {
      date: string;
      type: "half" | "full";
      count: number;
    }[];
  }[];
}

export type ILeaveSummary = Record<
  number,
  Record<string, Record<string, { half: number; full: number }>>
>;
