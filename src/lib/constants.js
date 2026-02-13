/**
 * Application Constants
 * Centralized constants to improve maintainability and avoid magic values
 */

// Database
export const DB_NAME = "wad01";

// Collections
export const COLLECTION_USER = "user";

// File Upload
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
export const PROFILE_IMAGES_DIR = "profile-images";

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
};

// Error Messages
export const ERROR_MESSAGES = {
  UNAUTHORIZED: "Unauthorized",
  INVALID_FORM_DATA: "Invalid form data",
  NO_FILE_UPLOADED: "No file uploaded",
  INVALID_CONTENT_TYPE: "Invalid content-type",
  ONLY_IMAGE_ALLOWED: "Only image files allowed",
  FAILED_UPDATE_USER: "Failed to update user",
  MISSING_MANDATORY_DATA: "Missing mandatory data",
  DUPLICATE_USERNAME: "Duplicate Username!!",
  DUPLICATE_EMAIL: "Duplicate Email!!",
  USER_NOT_FOUND: "User not found",
  FAILED_UPDATE_PROFILE: "Failed to update profile: ",
};

// Response Messages
export const SUCCESS_MESSAGES = {
  OK: "OK",
  FILE_UPLOADED: "File uploaded successfully",
  IMAGE_UPDATED: "Image updated successfully.",
  PROFILE_UPDATED: "Profile updated successfully",
};
