import { Request, Response } from "express";
import {
  countLeaves,
  countPeopleOnLeaveToday,
  leaveSummary,
} from "../../services/hr/hr.service";
import { OPENAI_API_KEY } from "../../config/environment";
import { getAllCandidates } from "../../models/candidate/candidate.model";
import OpenAI from "openai";
import { CandidateRecommendationProfile } from "../../constants/prompts/CandidateRecommendation";
import logger from "../../utils/logger";
import { ExternalServiceError, asyncHandler } from "../../utils/errors";

export const httprecommendCandidatesProfile = asyncHandler(
  async (req: Request, res: Response) => {
    const { jd, number } = req.body;

    if (!jd) {
      logger.warn("Candidate recommendation attempt without job description");
      throw new ExternalServiceError("Job description is required");
    }

    const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
    const candidates = await getAllCandidates();

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "user",
          content: `Please provide the following candidate recommendations in JSON format: ${CandidateRecommendationProfile(
            jd,
            candidates,
            (number as number) ?? 3
          )}`,
        },
      ],
      temperature: 0,
      max_tokens: 2500,
    });

    const recommendations = response.choices[0].message.content;
    try {
      const parsedJson = JSON.parse(recommendations ?? "");
      // Sanitize candidate data before sending
      const sanitizedRecommendations = parsedJson.map((rec: any) => ({
        ...rec,
        email: "REDACTED",
        phone: "REDACTED",
        address: "REDACTED",
        sensitiveData: "REDACTED",
      }));
      logger.info("Candidate recommendations generated successfully", {
        count: sanitizedRecommendations.length,
      });
      res.status(200).json({ recommendations: sanitizedRecommendations });
    } catch (parseError) {
      logger.error("Error parsing candidate recommendations JSON", {
        error: parseError,
      });
      throw new ExternalServiceError(
        "Failed to parse candidate recommendations"
      );
    }
  }
);

export const httpGetLeavesByEmail = asyncHandler(
  async (req: Request, res: Response) => {
    const leaveData = await countLeaves(
      process.env.SPREADSHEET_ID ?? "",
      process.env.SPREADSHEET_RANGE ?? ""
    );

    // Sanitize leave data before sending
    const sanitizedLeaveData = {
      ...leaveData,
      leaveCount: leaveData.leaveCount.map((leave: any) => ({
        ...leave,
        email: "REDACTED",
        personalInfo: "REDACTED",
      })),
    };

    logger.info("Leave data retrieved successfully", {
      count: leaveData.leaveCount.length,
    });
    res.status(200).json(sanitizedLeaveData);
  }
);

export const httpGetLeaveSummary = asyncHandler(
  async (req: Request, res: Response) => {
    const leaveData = await leaveSummary(
      process.env.SPREADSHEET_ID ?? "",
      process.env.SPREADSHEET_RANGE ?? ""
    );

    // Sanitize leave summary data
    const sanitizedLeaveData = {
      ...leaveData,
      leaveCount: leaveData.leaveCount.map((summary: any) => ({
        ...summary,
        employeeDetails: "REDACTED",
        personalInfo: "REDACTED",
      })),
    };

    logger.info("Leave summary retrieved successfully", {
      count: leaveData.leaveCount.length,
    });
    res.status(200).json(sanitizedLeaveData);
  }
);

export const httpGetLeaveStats = asyncHandler(
  async (req: Request, res: Response) => {
    const leaveData = await countPeopleOnLeaveToday(
      process.env.SPREADSHEET_ID ?? "",
      process.env.SPREADSHEET_RANGE ?? ""
    );

    logger.info("Leave stats retrieved successfully", {
      count: leaveData.count,
    });
    res.status(200).json(leaveData.count);
  }
);
