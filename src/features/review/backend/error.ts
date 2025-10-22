// src/features/review/backend/error.ts

export const REVIEW_ERROR = {
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  PLACE_ID_REQUIRED: 'PLACE_ID_REQUIRED',
  DATABASE_ERROR: 'DATABASE_ERROR',
  REVIEW_NOT_FOUND: 'REVIEW_NOT_FOUND',
} as const;

export type ReviewErrorCode = typeof REVIEW_ERROR[keyof typeof REVIEW_ERROR];