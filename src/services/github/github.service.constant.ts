const MAX_FILES_PER_CHUNK = 5;
const MAX_CONTENT_LENGTH = 6000;
const NON_CODE_EXTENSIONS = [
  ".svg",
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".bmp",
  ".webp",
  ".ico",
  ".tiff",
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".ppt",
  ".pptx",
  ".zip",
  ".rar",
  ".7z",
  ".tar",
  ".gz",
  ".mp3",
  ".wav",
  ".mp4",
  ".avi",
  ".mkv",
  ".cache",
  ".firebaserc",
  ".json",
  ".avif",
  ".gitignore",
  ".lock",
];

export type PeriodType = "day" | "week" | "month";

export type PRStats = {
  open: number;
  closed: number;
};

export type UserContributionStats = {
  username: string;
  prStats: PRStats;
};

export { MAX_FILES_PER_CHUNK, MAX_CONTENT_LENGTH, NON_CODE_EXTENSIONS };
