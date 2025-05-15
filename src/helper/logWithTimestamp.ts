import { format } from "date-fns";

const logWithTimestamp = (message: string, isError = false) => {
  const logFunction = isError ? console.error : console.log;
  logFunction(`[${format(new Date(), "yyyy-MM-dd HH:mm:ss")}] ${message}`);
};

export { logWithTimestamp };
