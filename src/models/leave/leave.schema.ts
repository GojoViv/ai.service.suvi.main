import mongoose, { Model } from "mongoose";

const { Schema, model } = mongoose;

const statusHistorySchema = new Schema({
  status: {
    type: String,
    enum: ["Pending", "Rejected", "Approved"],
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const leaveSchema = new Schema<any>(
  {
    email: {
      type: String,
    },
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
      enum: ["Casual Leave", "Sick Leave", "Approved Compensatory Time off"],
    },
    reason: String,
    status: {
      type: String,
      enum: ["Pending", "Rejected", "Approved"],
      default: "Pending",
    },
    statusHistory: {
      type: [statusHistorySchema],
      default: [],
    },
    notionId: {
      type: String,
    }, // Store the original Notion ID for reference
  },
  { timestamps: true }
);

// Basic update status method
leaveSchema.methods.updateStatus = function (newStatus: any) {
  this.status = newStatus;
  this.statusHistory.push({
    status: newStatus,
    timestamp: new Date(),
  });

  return this.save();
};

// Enhanced update status method with notification
leaveSchema.methods.updateStatusWithNotification = async function (
  newStatus: string,
  notificationService: any
) {
  const oldStatus = this.status;
  this.status = newStatus;

  // Add to status history
  this.statusHistory.push({
    status: newStatus,
    timestamp: new Date(),
  });

  // Save the document
  await this.save();

  // If status changed to Approved, send notification
  if (newStatus === "Approved" && oldStatus !== "Approved") {
    const startDateFormatted = this.startDate.toDateString();
    const endDateFormatted = this.endDate.toDateString();

    // Format message
    const message = {
      to: this.email,
      subject: "Leave Request Approved",
      text: `Your leave request from ${startDateFormatted} to ${endDateFormatted} has been approved.`,
      html: `
        <p>Hello,</p>
        <p>Your leave request has been <strong>approved</strong>.</p>
        <p><strong>Details:</strong></p>
        <ul>
          <li><strong>Type:</strong> ${this.type}</li>
          <li><strong>Duration:</strong> ${this.duration}</li>
          <li><strong>From:</strong> ${startDateFormatted}</li>
          <li><strong>To:</strong> ${endDateFormatted}</li>
        </ul>
        <p>If you have any questions, please contact HR.</p>
      `,
    };

    // Send notification using the provided service
    try {
      await notificationService.sendMessage(message);
    } catch (error) {
      console.error("Failed to send approval notification:", error);
      // Note: We don't throw the error here to avoid rolling back the status update
      // Just log it and continue
    }
  }

  return this;
};

// Static method to find and update leaves by criteria
leaveSchema.statics.findAndUpdateStatus = async function (
  criteria: object,
  newStatus: string,
  notificationService: any
) {
  const leaves = await this.find(criteria);
  const results = [];

  for (const leave of leaves) {
    try {
      const updated = await leave.updateStatusWithNotification(
        newStatus,
        notificationService
      );
      results.push(updated);
    } catch (error) {
      console.error(`Error updating leave ${leave._id}:`, error);
    }
  }

  return results;
};

leaveSchema.index({
  type: "text",
  reason: "text",
});

const Leave: Model<any> = model("Leave", leaveSchema);

export { Leave };
