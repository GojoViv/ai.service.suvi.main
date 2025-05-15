import axios, {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";
import crypto from "crypto";

import * as cheerio from "cheerio";
import { sendEmailRunwayDetails } from "../../clients/google.client";
import https from "https";
import RunwayVisibility from "../../models/runwayVisibility/runwayVisibility.schema";
import { AxiosRequestConfig, RawAxiosRequestHeaders } from "axios";
import dns from "dns";

dns.setServers([
  "8.8.8.8", // Google DNS
  "8.8.4.4", // Google DNS backup
  "1.1.1.1", // Cloudflare DNS
]);

const FALLBACK_IP = "59.179.31.233";
const DNS_TIMEOUT = 5000;
const REQUEST_TIMEOUT = 45000;
const MAX_RETRIES = 2;
const RETRY_DELAY = 2000;

interface VisibilityReading {
  value: string;
  backgroundColor: string;
  timestamp: string;
}

interface RunwayReadings {
  [key: string]: VisibilityReading[];
}

let consecutiveFailures = 0;
const MAX_CONSECUTIVE_FAILURES = 3;

const runwayGroups = {
  Group1: ["RWY-27-TDZ", "RWY-27-MID", "RWY-09-TDZ"], // Green background
  Group2: [
    "RWY-29-L-BEG",
    "RWY-29-L-TDZ",
    "RWY-29-L-MID",
    "RWY-11-R-TDZ",
    "RWY-11-R-BEG",
  ], // Brown/Orange background
  Group3: ["RWY-28-TDZ", "RWY-28-MID", "RWY-10-TDZ"], // Yellow background
  Group4: [
    "RWY-29-R-BEG",
    "RWY-29-R-TDZ",
    "RWY-11-L-MID",
    "RWY-11-L-TDZ",
    "RWY-11-L-BEG",
  ], // Blue background
};

interface CustomAxiosRequestConfig extends AxiosRequestConfig {
  retry?: boolean;
  retryCount?: number;
}

function parseDate(dateStr: string | Date): Date | null {
  try {
    if (dateStr instanceof Date) {
      return isNaN(dateStr.getTime()) ? null : dateStr;
    }

    // First try parsing as ISO string
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date;
    }

    // Handle format "DD/MM/YYYY HH:mm:ss"
    const match = dateStr.match(
      /(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2}):(\d{2})/
    );
    if (match) {
      const [_, day, month, year, hours, minutes, seconds] = match;
      const parsedDate = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        parseInt(hours),
        parseInt(minutes),
        parseInt(seconds)
      );
      return isNaN(parsedDate.getTime()) ? null : parsedDate;
    }

    // Handle format "DD-MM-YYYY HH:mm:ss"
    const [datePart, timePart] = dateStr.split(" ");
    if (datePart && timePart) {
      const [day, month, year] = datePart.split("-");
      const [hours, minutes, seconds] = timePart.split(":");

      const parsedDate = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        parseInt(hours),
        parseInt(minutes),
        parseInt(seconds)
      );

      return isNaN(parsedDate.getTime()) ? null : parsedDate;
    }

    return null;
  } catch (error) {
    console.error("Error parsing date:", error, "Input:", dateStr);
    return null;
  }
}

function convertToIST(date: Date | string): Date {
  const parsedDate = parseDate(date);
  if (!parsedDate) {
    console.warn("Invalid date provided to convertToIST:", date);
    return new Date(); // Return current date as fallback
  }

  // Convert to IST (UTC+5:30)
  return new Date(parsedDate.getTime() + 5.5 * 60 * 60 * 1000);
}

function formatISTTime(date: Date): string {
  try {
    const istDate = convertToIST(date);
    return istDate.toLocaleString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      timeZone: "Asia/Kolkata",
    });
  } catch (error) {
    console.error("Error formatting IST time:", error);
    return new Date().toLocaleString(); // Fallback to basic format
  }
}
// Helper function to ensure consistent UTC dates
function toUTCDate(date: Date | string): Date {
  const parsedDate = parseDate(date);
  if (!parsedDate) {
    console.warn("Invalid date provided to toUTCDate:", date);
    // Return current UTC date as fallback
    return new Date();
  }

  // Ensure we're working with UTC
  return new Date(
    Date.UTC(
      parsedDate.getUTCFullYear(),
      parsedDate.getUTCMonth(),
      parsedDate.getUTCDate(),
      parsedDate.getUTCHours(),
      parsedDate.getUTCMinutes(),
      parsedDate.getUTCSeconds()
    )
  );
}
async function verifyDomainAccess(domain: string): Promise<boolean> {
  try {
    // Try a direct HTTP request to the fallback IP first
    const fallbackIP = "59.179.31.233";
    const testResponse = await axiosInstance.get(
      `https://${fallbackIP}/amss1/InstRVRData3_New.php`,
      {
        timeout: 5000,
        headers: {
          host: domain,
        },
        validateStatus: (status) => status < 500, // Accept any status < 500
      }
    );

    if (testResponse.status < 500) {
      console.log("Direct IP connection successful");
      return false; // Return false to use fallback IP
    }
  } catch (error) {
    console.log("Fallback IP test failed, will try DNS");
  }

  return new Promise((resolve) => {
    const timeoutId = setTimeout(() => {
      console.log("DNS lookup timed out");
      resolve(false);
    }, 5000);

    dns.lookup(domain, { family: 4 }, (err, address) => {
      clearTimeout(timeoutId);
      if (err) {
        console.log("DNS Lookup failed:", {
          domain,
          error: err.message,
          code: err.code,
        });
        resolve(false);
      } else {
        console.log("DNS Lookup successful:", {
          domain,
          resolvedIP: address,
        });
        resolve(true);
      }
    });
  });
}

const runwayReadings: RunwayReadings = {};
const axiosInstance: AxiosInstance = axios.create({
  httpsAgent: new https.Agent({
    rejectUnauthorized: false,
    secureOptions: crypto.constants.SSL_OP_LEGACY_SERVER_CONNECT,
    minVersion: "TLSv1", // Changed from TLSv1.2
    maxVersion: "TLSv1.2",
    ciphers: "ALL:!aNULL:!EXPORT:!SSLv2:!DES:!RC4", // Modified cipher list
    family: 4,
    lookup: (hostname, options, callback) => {
      dns.lookup(hostname, { family: 4 }, callback);
    },
  }),
  headers: {
    Accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
    "Accept-Language": "en-GB,en-US;q=0.9,en;q=0.8",
    "Cache-Control": "max-age=0",
    Connection: "keep-alive",
    Referer: "https://amssdelhi.gov.in/amss1/InstRVRData3_New.php",
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  },
  timeout: 45000,
  maxRedirects: 5,
  validateStatus: function (status) {
    return status >= 200 && status < 500;
  },
});

// Keep only this response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as any;

    console.error("Request failed:", {
      url: config?.url,
      method: config?.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      errorMessage: error.message,
      attempt: (config?.retryCount || 0) + 1,
    });

    if (!config || !config.retry) {
      return Promise.reject(error);
    }

    if (
      error.response?.status === 404 ||
      error.response?.status === 401 ||
      error.response?.status === 403 ||
      error.code === "ECONNABORTED" ||
      error.message.includes("timeout")
    ) {
      return Promise.reject(error);
    }

    config.retryCount = config.retryCount ?? 0;

    if (config.retryCount >= 2) {
      return Promise.reject(error);
    }

    config.retryCount += 1;

    console.log(
      `Retrying request (${config.retryCount}/2) for URL: ${config.url}`
    );

    const delay = 2000;
    await new Promise((resolve) => setTimeout(resolve, delay));

    return axiosInstance(config);
  }
);

function getBackgroundColorForValue(visibility: string): string {
  const value = parseInt(visibility);
  if (isNaN(value) || !visibility) return "#FFFFFF";
  if (value >= 550) return "#FFFFFF";
  if (value >= 300) return "#7CFF7C";
  return "#FFA500";
}

async function storeRunwayData(readings: RunwayReadings, serverTime: string) {
  try {
    const timestamp = toUTCDate(serverTime);
    console.log("Storing runway data with timestamp:", timestamp.toISOString());

    const runwayRecords = Object.entries(readings).map(
      ([runway, readingList]) => {
        const currentReading = readingList[0];
        const visibilityValue = parseInt(currentReading.value);

        let category = "CAT-I";
        if (!isNaN(visibilityValue)) {
          if (visibilityValue < 300) {
            category = "CAT-III";
          } else if (visibilityValue >= 300 && visibilityValue < 550) {
            category = "CAT-II";
          }
        }

        return {
          runway: runway,
          visibility: currentReading.value,
          category: category,
          timestamp: timestamp,
          backgroundColor: getBackgroundColorForValue(currentReading.value),
        };
      }
    );

    await RunwayVisibility.insertMany(runwayRecords);
    console.log(
      `Stored ${
        runwayRecords.length
      } runway readings in database at ${formatISTTime(timestamp)}`
    );
    return runwayRecords;
  } catch (error) {
    console.error("Error storing runway data:", error);
    throw error;
  }
}

async function scrapeVisibilityData() {
  try {
    console.log("Attempting to fetch runway visibility data...");
    const domain = "amssdelhi.gov.in";
    const fallbackIP = "59.179.31.233";

    // Always use the fallback IP in production
    const isProduction = process.env.NODE_ENV === "production";
    const useDirectIP = isProduction || !(await verifyDomainAccess(domain));

    const url = useDirectIP
      ? `https://${fallbackIP}/amss1/InstRVRData3_New.php`
      : `https://${domain}/amss1/InstRVRData3_New.php`;

    const requestConfig: CustomAxiosRequestConfig = {
      timeout: 45000,
      retry: true,
      headers: {
        host: domain,
        accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
        "cache-control": "max-age=0",
        connection: "keep-alive",
      } as RawAxiosRequestHeaders,
    };

    console.log(`Making request to: ${url}`);
    const response = await axiosInstance.get(url, requestConfig);

    if (!response.data) {
      throw new Error("No response data received");
    }

    const $ = cheerio.load(response.data);

    let serverTime = "";
    const scriptContent = $('script:contains("serverDateTime")').text();
    const serverTimeMatch = scriptContent.match(/serverDateTime = "([^"]+)"/);
    if (serverTimeMatch) {
      // Validate server time before using it
      const parsedServerTime = parseDate(serverTimeMatch[1]);
      if (parsedServerTime) {
        serverTime = parsedServerTime.toISOString();
      } else {
        console.warn("Invalid server time format:", serverTimeMatch[1]);
        serverTime = new Date().toISOString();
      }
    } else {
      console.warn("Server time not found in response, using current time");
      serverTime = new Date().toISOString();
    }

    $(".table-container table").each((tableIndex, table) => {
      $(table)
        .find("tbody tr")
        .each((_, row) => {
          const cells = $(row).find("td");
          if (cells.length >= 2) {
            const runway = cells.eq(0).text().trim();
            const visibility = cells.eq(1).text().trim();

            if (runway && visibility) {
              const reading = {
                value: visibility,
                backgroundColor: getBackgroundColorForValue(visibility),
                timestamp: serverTime,
              };

              if (!runwayReadings[runway]) {
                runwayReadings[runway] = [];
              }
              runwayReadings[runway] = [reading];
            }
          }
        });
    });

    if (Object.keys(runwayReadings).length === 0) {
      throw new Error("No runway data was found in the response");
    }

    return { serverTime, runwayReadings };
  } catch (error: any) {
    console.error("Error in scrapeVisibilityData:", {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
    });
    throw error;
  }
}

async function createEmailContent(serverTime: string): Promise<string> {
  const currentTimeUTC = toUTCDate(serverTime);
  const istTimeString = formatISTTime(currentTimeUTC);

  const historicalData = await Promise.all(
    Object.keys(runwayReadings).map(async (runway) => {
      const history = await RunwayVisibility.find({
        runway: runway,
        timestamp: {
          $lt: currentTimeUTC,
          $gte: new Date(currentTimeUTC.getTime() - 60 * 60 * 1000),
        },
      })
        .sort({ timestamp: -1 })
        .limit(3);

      return {
        runway,
        history,
      };
    })
  );

  const timeHeaders = historicalData
    .flatMap(({ history }) => history)
    .reduce((acc, reading) => {
      if (!reading) return acc;
      const minutesAgo = Math.round(
        (currentTimeUTC.getTime() - new Date(reading.timestamp).getTime()) /
          (60 * 1000)
      );
      acc.add(minutesAgo);
      return acc;
    }, new Set<number>());

  const sortedTimeHeaders = Array.from(timeHeaders)
    .sort((a, b) => a - b)
    .slice(0, 3);

  let html = `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
              body { 
                  font-family: Arial, sans-serif;
                  font-size: 11px;
                  margin: 0;
                  padding: 2px;
              }
              h2 { 
                  font-size: 13px;
                  margin: 3px 0;
              }
              h3 {
                  font-size: 11px;
                  margin: 3px 0;
              }
              p {
                  font-size: 9px;
                  margin: 2px 0;
              }
              .main-table { 
                  border-collapse: collapse; 
                  width: 100%; 
                  margin: 3px 0;
                  font-size: 9px;
                  table-layout: fixed;
              }
              .main-table th, .main-table td { 
                  padding: 1px 1.5px; 
                  text-align: center; 
                  border: 1px solid #ddd;
                  font-size: 9px;
                  overflow: hidden;
                  text-overflow: ellipsis;
                  white-space: nowrap;
                  line-height: 1.1;
                  width: 80px;
              }
              .main-table th:first-child, .main-table td:first-child {
                  width: 100px;
                  text-align: left;
              }
              .main-table th { 
                  background-color: #3f72af; 
                  color: white;
                  font-weight: normal;
              }
              .legend-table {
                  table-layout: auto;
                  margin-top: 3px;
                  font-size: 10px;
                  border-collapse: collapse;
                  width: auto;
              }
              .legend-table td {
                  padding: 1px 2px;
                  font-size: 10px;
                  white-space: normal;
                  border: 1px solid #ddd;
              }
          </style>
      </head>
      <body>
          <h2>Runway Visibility Report [RVR]</h2>
          <p>Report Time: ${istTimeString} IST</p>
          <table class="main-table">
              <tr>
                  <th>RWY</th>
                  <th>Now</th>
                  ${sortedTimeHeaders
                    .map((minutes) => `<th>${minutes}m ago</th>`)
                    .join("")}
              </tr>`;

  // Inside createEmailContent:
  for (const [groupName, runways] of Object.entries(runwayGroups)) {
    for (const runway of runways) {
      if (!runwayReadings[runway]) continue;

      const currentReading = runwayReadings[runway][0];
      const runwayHistory =
        historicalData.find((data) => data.runway === runway)?.history || [];

      // Get minimum visibility for current column in this group
      const groupCurrentVisibilities = runways
        .map((r) => parseInt(runwayReadings[r]?.[0]?.value || "999"))
        .filter((value) => !isNaN(value));
      const currentGroupColor = getBackgroundColorForValue(
        Math.min(...groupCurrentVisibilities).toString()
      );

      html += `<tr>`;
      html += `<td>${runway}</td>`;
      html += `<td style="background-color: ${currentGroupColor};">${currentReading.value}</td>`;

      sortedTimeHeaders.forEach((targetMinutes) => {
        const historicalReading = runwayHistory.find((reading) => {
          const minutesAgo = Math.round(
            (currentTimeUTC.getTime() - new Date(reading.timestamp).getTime()) /
              (60 * 1000)
          );
          return minutesAgo === targetMinutes;
        });

        // Get minimum visibility for this historical column in this group
        const groupHistoricalVisibilities = runways
          .map((r) => {
            const hist =
              historicalData.find((d) => d.runway === r)?.history || [];
            const reading = hist.find((h) => {
              const mins = Math.round(
                (currentTimeUTC.getTime() - new Date(h.timestamp).getTime()) /
                  (60 * 1000)
              );
              return mins === targetMinutes;
            });
            return parseInt(reading?.visibility || "999");
          })
          .filter((value) => !isNaN(value));

        const histGroupColor = getBackgroundColorForValue(
          Math.min(...groupHistoricalVisibilities).toString()
        );
        const value = historicalReading ? historicalReading.visibility : "NA";
        html += `<td style="background-color: ${histGroupColor};">${value}</td>`;
      });

      html += "</tr>";
    }
  }

  html += `</table>
           <table class="legend-table">
               <tr>
                   <td colspan="2" style="background-color: #3f72af; color: white;"><strong>COLOUR LEGENDS</strong></td>
               </tr>
               <tr>
                   <td style="background-color: #FFFFFF;">CAT-I</td>
                   <td style="background-color: #FFFFFF;">550M AND ABOVE</td>
               </tr>
               <tr>
                   <td style="background-color: #7CFF7C;">CAT-II</td>
                   <td style="background-color: #7CFF7C;">FROM 300M TO 549M</td>
               </tr>
               <tr>
                   <td style="background-color: #FFA500;">CAT-III</td>
                   <td style="background-color: #FFA500;">BELOW 300M</td>
               </tr>
           </table>
           </body>
       </html>`;

  return html;
}

function createCsvContent(
  historicalData: any[],
  sortedTimeHeaders: number[],
  serverTime: string
): string {
  // Keep original time in UTC
  const currentTimeUTC = toUTCDate(serverTime);

  const headers = [
    "Runway",
    "Current Visibility",
    ...sortedTimeHeaders.map((minutes) => `${minutes}min ago`),
    "Category",
  ];

  const rows = Object.entries(runwayReadings).map(([runway, readings]) => {
    const currentReading = readings[0];
    const runwayHistory =
      historicalData.find((data) => data.runway === runway)?.history || [];

    const currentValue = currentReading.value;
    const historicalValues = sortedTimeHeaders.map((targetMinutes) => {
      const historicalReading = runwayHistory.find((reading: any) => {
        const minutesAgo = Math.round(
          (currentTimeUTC.getTime() - new Date(reading.timestamp).getTime()) /
            (60 * 1000)
        );
        return minutesAgo === targetMinutes;
      });
      return historicalReading ? historicalReading.visibility : "NA";
    });

    const visibilityValue = parseInt(currentValue);
    let category = "CAT-I";
    if (!isNaN(visibilityValue)) {
      if (visibilityValue < 300) {
        category = "CAT-III";
      } else if (visibilityValue < 550) {
        category = "CAT-II";
      }
    }

    return [runway, currentValue, ...historicalValues, category].join(",");
  });

  return [headers.join(","), ...rows].join("\n");
}

async function collectAndSendData() {
  try {
    console.log("Starting data collection cycle...");

    if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
      console.error(
        `Stopping after ${MAX_CONSECUTIVE_FAILURES} consecutive failures`
      );
      process.exit(1); // Or implement a recovery mechanism
    }
    const { serverTime } = await scrapeVisibilityData();
    consecutiveFailures = 0; // Reset on success

    // Store data in UTC
    await storeRunwayData(runwayReadings, serverTime);

    // Use UTC for database queries
    const currentTimeUTC = toUTCDate(serverTime);
    const historicalData = await Promise.all(
      Object.keys(runwayReadings).map(async (runway) => {
        const history = await RunwayVisibility.find({
          runway: runway,
          timestamp: {
            $lt: currentTimeUTC,
            $gte: new Date(currentTimeUTC.getTime() - 60 * 60 * 1000),
          },
        })
          .sort({ timestamp: -1 })
          .limit(3);

        return {
          runway,
          history,
        };
      })
    );

    const timeHeaders = historicalData
      .flatMap(({ history }) => history)
      .reduce((acc, reading) => {
        if (!reading) return acc;
        const minutesAgo = Math.round(
          (currentTimeUTC.getTime() - new Date(reading.timestamp).getTime()) /
            (60 * 1000)
        );
        acc.add(minutesAgo);
        return acc;
      }, new Set<number>());

    const sortedTimeHeaders = Array.from(timeHeaders)
      .sort((a, b) => a - b)
      .slice(0, 3);

    const htmlContent = await createEmailContent(serverTime);
    const csvContent = createCsvContent(
      historicalData,
      sortedTimeHeaders,
      serverTime
    );

    const recipients = process.env.EMAIL_RECIPIENTS?.split(",").map((email) =>
      email.trim()
    ) || [
      "anoop.kumar@gmrgroup.in",
      "arunachalam.sv@gmrgroup.in",
      "vkdosaya@gmail.com",
    ];

    // Convert to IST for display only
    const istTimeString = formatISTTime(currentTimeUTC);

    await sendEmailRunwayDetails({
      from: process.env.IMPERSONATED_USER_EMAIL ?? "",
      to: recipients,
      subject: `[RVR] Runway Visibility Report - ${istTimeString}`,
      html: htmlContent,
      cc: csvContent,
    });

    console.log("Successfully sent visibility report");
  } catch (error: any) {
    console.error("Error in data collection cycle:", error);
    if (error.response) {
      console.error("Gmail API Error Details:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
      });
    }
  }
}

export { scrapeVisibilityData, collectAndSendData, storeRunwayData };
