import mongoose from "mongoose";
import { Schema } from "mongoose";

const PlatformCredentialsSchema = new mongoose.Schema(
  {
    github: {
      username: String,
      email: String,
      repositories: [String],
    },
    slack: {
      userId: String,
      email: String,
    },
    notion: {
      userId: String,
      email: String,
    },
  },
  { _id: false }
);

const DesignationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  departments: [
    {
      type: String,
      enum: [
        "Engineering",
        "Design",
        "Product",
        "Operations",
        "Sales",
        "Management",
        "Finance",
        "HR",
        "Business Development",
        "Social Media",
        "Marketing",
      ],
    },
  ],
  reporting: [
    {
      email: String,
      name: String,
      userId: String,
    },
  ],
});

const PRReviewSchema = new mongoose.Schema(
  {
    prId: String,
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
    },
    suviScore: {
      overall: Number,
      categories: {
        codeStyle: Number,
        architecture: Number,
        errorHandling: Number,
        performance: Number,
      },
    },
    changesRequested: [
      {
        category: String,
        severity: String,
        description: String,
      },
    ],
    linesOfCode: Number,
    filesChanged: Number,
    taskId: String,
  },
  {
    timestamps: true,
  }
);

const TaskMetricsSchema = new mongoose.Schema({
  taskId: String,
  title: String,
  storyPoints: Number,
  timeInStatus: {
    todo: Number,
    inProgress: Number,
    qaReview: Number,
    done: Number,
  },
  completedAt: Date,
});

const DailyMetricsSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    default: Date.now,
  },

  codeMetrics: {
    prCount: Number,
    suviReviewScore: Number,
    changesRequested: Number,
  },

  taskMetrics: {
    completed: Number,
    inProgress: Number,
    totalStoryPoints: Number,
    avgTimeInStatus: {
      todo: Number,
      inProgress: Number,
      qaReview: Number,
      done: Number,
    },
  },
});

const EmployeeSchema = new mongoose.Schema(
  {
    employeeId: {
      type: String,
      required: true,
      unique: true,
    },
    fullName: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    phoneNumber: String,

    employmentType: {
      type: String,
      enum: ["Internship", "Part Time", "Full time", "On Contract- Full Time"],
      required: true,
    },

    status: {
      type: String,
      enum: ["Working", "Onboarding", "On Leave", "Not Working/Left"],
      default: "Working",
    },
    employmentDetails: {
      startDate: { type: Date, required: true },
      endDate: Date,
      contractorCompany: String,
      internshipDuration: Number,
    },

    currentDesignation: DesignationSchema,
    designationHistory: [DesignationSchema],
    leaves: [
      {
        startDate: Date,
        endDate: Date,
        duration: {
          type: String,
          enum: [
            "Full Day",
            "Half day - First half (9 am to 1 pm)",
            "Half day - Second half ( 2pm to 6 pm)",
          ],
        },
        type: {
          type: String,
          enum: [
            "Casual Leave",
            "Sick Leave",
            "Approved Compensatory Time off",
          ],
        },
        reason: String,
        status: {
          type: String,
          enum: ["Pending", "Rejected", "Approved"],
          default: "approved",
        },
      },
    ],

    dailyMetrics: [DailyMetricsSchema],
    prReviews: [PRReviewSchema],
    taskMetrics: [TaskMetricsSchema],
    referral: {
      code: {
        type: String,
        unique: true,
        sparse: true,
      },
      referredUsers: [
        {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
      ],
      coinsEarned: {
        type: Number,
        default: 0,
      },
      referredBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        sparse: true,
      },
    },
    slackId: String,
  },
  {
    timestamps: true,
  }
);

const Employee = mongoose.model("Employee", EmployeeSchema);

export default Employee;
