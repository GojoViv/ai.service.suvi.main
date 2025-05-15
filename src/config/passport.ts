import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } from "./environment";
import { getUserByEmail } from "../models/employee/employee.model";
import logger from "../utils/logger";
import { ExternalServiceError } from "../utils/errors";

passport.use(
  "google",
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID ?? "",
      clientSecret: GOOGLE_CLIENT_SECRET ?? "",
      callbackURL: "/v1/api/auth/google/callback",
    },
    async (accessToken: any, refreshToken: any, profile: any, done: any) => {
      try {
        const email = profile.emails?.[0].value ?? "";
        let user = await getUserByEmail(email);
        logger.info({ message: "User found", user });
        if (user) {
          return done(null, user);
        } else {
          return done(new ExternalServiceError("User not found"));
        }
      } catch (error) {
        logger.error({ message: "Error during Google authentication", error });
        return done(error);
      }
    }
  )
);
