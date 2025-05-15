import admin from "firebase-admin";
import {
  FIREBASE_SERVICE_ACCOUNT_JSON,
  FIREBASE_STORAGE_BUCKET,
} from "../config/environment";
import logger from "../utils/logger";
import { ExternalServiceError } from "../utils/errors";

// Type for Firebase service account
interface FirebaseServiceAccount {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
}

// Validate required environment variables
if (!FIREBASE_SERVICE_ACCOUNT_JSON || !FIREBASE_STORAGE_BUCKET) {
  throw new Error("Missing required Firebase configuration");
}

let firebaseServiceAccount: FirebaseServiceAccount;

try {
  firebaseServiceAccount = JSON.parse(FIREBASE_SERVICE_ACCOUNT_JSON);

  // Validate service account structure
  if (
    !firebaseServiceAccount.type ||
    !firebaseServiceAccount.project_id ||
    !firebaseServiceAccount.private_key
  ) {
    throw new Error("Invalid Firebase service account structure");
  }
} catch (error) {
  logger.error({
    message: "Error parsing or validating FIREBASE_SERVICE_ACCOUNT_JSON",
    error,
  });
  throw new ExternalServiceError(
    "Invalid Firebase service account configuration"
  );
}

/**
 * Initializes and returns the Firebase Admin app instance
 * @returns {admin.app.App} Firebase Admin app instance
 */
const adminFirebase = (): admin.app.App => {
  if (admin.apps.length === 0) {
    try {
      const app = admin.initializeApp({
        credential: admin.credential.cert(
          firebaseServiceAccount as admin.ServiceAccount
        ),
        storageBucket: FIREBASE_STORAGE_BUCKET,
      });
      logger.info("Firebase Admin initialized successfully");
      return app;
    } catch (error) {
      logger.error({
        message: "Error initializing Firebase Admin",
        error,
      });
      throw new ExternalServiceError("Failed to initialize Firebase Admin");
    }
  }
  const app = admin.apps[0];
  if (!app) {
    throw new ExternalServiceError("Failed to get Firebase Admin app instance");
  }
  return app;
};

// Initialize Firebase Admin
const app = adminFirebase();
const db = admin.firestore(app);

// Export initialized instances
export { db, adminFirebase };
