import Employee from "../models/employee/employee.schema";
import { getAllEntries } from "../models/notion/notion.model";

const generateReferralCode = () => {
  const prefix = "[REFERRAL_CODE_PREFIX]";
  const length = 8;
  const chars = "[CHARACTERS]";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return prefix + result;
};

const syncEmployeesFromNotion = async () => {
  console.log("[EMPLOYEE-SYNC] Starting employee sync from Notion...");

  const syncResults = {
    created: 0,
    updated: 0,
    errors: [] as string[],
  };

  try {
    console.log("[EMPLOYEE-SYNC] Fetching employees from Notion...");
    let notionEmployees = await getAllEntries(
      "72d324fca4624299bb38d5d4dee29c4d"
    );
    console.log(
      `[EMPLOYEE-SYNC] Found ${notionEmployees.length} employees in Notion`
    );

    for (const notionEmployee of notionEmployees) {
      try {
        const employeeId =
          notionEmployee.properties["Employee ID"].rich_text[0]?.plain_text;
        const fullName =
          notionEmployee.properties["Full Name"].title[0]?.plain_text;

        if (!employeeId || !fullName) {
          console.error(
            `[EMPLOYEE-SYNC] Missing required fields for employee: ${
              fullName || employeeId || "Unknown"
            }`
          );
          syncResults.errors.push(
            `Missing required fields for employee: ${
              fullName || employeeId || "Unknown"
            }`
          );
          continue;
        }

        console.log(
          `[EMPLOYEE-SYNC] Processing employee: ${fullName} (${employeeId})`
        );

        const employeeData = {
          employeeId,
          fullName,
          email:
            notionEmployee.properties["Work Email"].email ??
            notionEmployee.properties["Personal Email"].email ??
            `${fullName.replace(/\s/g, "")}@[COMPANY_DOMAIN].in`,
          phoneNumber: notionEmployee.properties["Phone"].phone_number,

          currentDesignation: {
            title:
              notionEmployee.properties["Title"]?.select?.name || "No title",
            departments: notionEmployee.properties[
              "Departments"
            ].multi_select.map((dept: any) => dept.name),
            reporting: notionEmployee.properties["Reports To"]?.people.map(
              (person: any) => ({
                email: person?.person?.email,
                name: person?.name,
              })
            ) ?? [{ email: "[Email]", name: "Vivek Dosaya" }],
          },

          employmentType:
            notionEmployee.properties["Mode of Work"]?.select?.name ||
            "Full time",

          employmentDetails: {
            startDate: notionEmployee.properties["Hired"]?.date?.start
              ? new Date(notionEmployee.properties["Hired"].date.start)
              : new Date(),
            contractorCompany:
              notionEmployee.properties["Mode of Work"]?.select?.name ===
              "On Contract- Full Time"
                ? "External"
                : undefined,
          },

          status:
            notionEmployee.properties["Status of employee"]?.status?.name ||
            "Working",
          slackId:
            notionEmployee.properties["Slack ID"]?.rich_text[0]?.plain_text ??
            "U03H4B6CN5S",
        };

        const existingEmployee = await Employee.findOne({ employeeId });

        if (existingEmployee) {
          console.log(`[EMPLOYEE-SYNC] Found existing employee: ${fullName}`);
          const updates = createUpdateObject(existingEmployee, employeeData);

          if (Object.keys(updates.$set || {}).length > 0 || updates.$push) {
            console.log(
              `[EMPLOYEE-SYNC] Updating employee ${fullName} with changes:`,
              JSON.stringify(updates, null, 2)
            );
            await Employee.findOneAndUpdate({ employeeId }, updates, {
              new: true,
            });
            syncResults.updated++;
            console.log(
              `[EMPLOYEE-SYNC] Successfully updated employee: ${fullName}`
            );
          } else {
            console.log(
              `[EMPLOYEE-SYNC] No updates needed for employee: ${fullName}`
            );
          }
        } else {
          console.log(`[EMPLOYEE-SYNC] Creating new employee: ${fullName}`);
          const newEmployeeData = {
            ...employeeData,
            referral: {
              code:
                employeeData.status === "Working" ? generateReferralCode() : "",
              referredUsers: [],
              coinsEarned: 0,
            },
          };
          await Employee.create(newEmployeeData);
          syncResults.created++;
          console.log(
            `[EMPLOYEE-SYNC] Successfully created employee: ${fullName}`
          );
        }
      } catch (error: any) {
        const employeeName =
          notionEmployee.properties["Full Name"].title[0]?.plain_text ||
          "Unknown";
        console.error(
          `[EMPLOYEE-SYNC] Error processing employee ${employeeName}:`,
          error
        );
        syncResults.errors.push(
          `Error processing employee ${employeeName}: ${error.message}`
        );
      }
    }

    console.log("[EMPLOYEE-SYNC] Sync completed with results:", {
      created: syncResults.created,
      updated: syncResults.updated,
      errors: syncResults.errors.length,
    });
  } catch (error: any) {
    console.error("[EMPLOYEE-SYNC] Fatal error during sync:", error);
    throw new Error(`Employee sync failed: ${error.message}`);
  }

  return syncResults;
};

const createUpdateObject = (existing: any, newData: any) => {
  const updates: any = { $set: {} };
  const changes: string[] = [];

  // Check and generate referral code for Working employees if they don't have one
  if (newData.status === "Working" && !existing.referral?.code) {
    updates.$set["referral.code"] = generateReferralCode();
    updates.$set["referral.referredUsers"] =
      existing.referral?.referredUsers || [];
    updates.$set["referral.coinsEarned"] = existing.referral?.coinsEarned || 0;
    changes.push("referral code generated for existing employee");
  }

  if (existing.slackId !== newData.slackId) {
    updates.$set.slackId = newData.slackId;
    changes.push(
      `slackId: ${existing.slackId || "none"} -> ${newData.slackId}`
    );
  }

  if (existing.fullName !== newData.fullName) {
    updates.$set.fullName = newData.fullName;
    changes.push(`fullName: ${existing.fullName} -> ${newData.fullName}`);
  }

  if (existing.email !== newData.email) {
    updates.$set.email = newData.email;
    changes.push(`email: ${existing.email} -> ${newData.email}`);
  }

  if (existing.phoneNumber !== newData.phoneNumber) {
    updates.$set.phoneNumber = newData.phoneNumber;
    changes.push(
      `phoneNumber: ${existing.phoneNumber} -> ${newData.phoneNumber}`
    );
  }

  const departmentsChanged = !arraysEqual(
    existing.currentDesignation.departments,
    newData.currentDesignation.departments
  );

  if (
    existing.currentDesignation.title !== newData.currentDesignation.title ||
    departmentsChanged
  ) {
    console.log(`[EMPLOYEE-SYNC] Designation change detected:`, {
      oldTitle: existing.currentDesignation.title,
      newTitle: newData.currentDesignation.title,
      oldDepartments: existing.currentDesignation.departments,
      newDepartments: newData.currentDesignation.departments,
    });

    updates.$push = {
      designationHistory: {
        ...existing.currentDesignation,
        departments: [...existing.currentDesignation.departments],
      },
    };
    updates.$set.currentDesignation = newData.currentDesignation;
    changes.push("designation updated");
  }

  if (existing.status !== newData.status) {
    updates.$set.status = newData.status;
    changes.push(`status: ${existing.status} -> ${newData.status}`);
  }

  if (existing.employmentType !== newData.employmentType) {
    updates.$set.employmentType = newData.employmentType;
    changes.push(
      `employmentType: ${existing.employmentType} -> ${newData.employmentType}`
    );

    if (newData.employmentType === "On Contract- Full Time") {
      updates.$set["employmentDetails.contractorCompany"] = "External";
      changes.push("contractorCompany set to External");
    }
  }

  if (changes.length > 0) {
    console.log(`[EMPLOYEE-SYNC] Changes detected:`, changes);
  }

  return updates;
};

const arraysEqual = (a: any[], b: any[]) => {
  if (a.length !== b.length) return false;
  return a.every((val, index) => val === b[index]);
};

export { syncEmployeesFromNotion };
