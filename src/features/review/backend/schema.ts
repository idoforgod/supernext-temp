// src/features/review/backend/schema.ts
import { z } from 'zod';

// 리뷰 생성 요청 스키마
export const createReviewSchema = z.object({
  place_id: z.string().min(1, '장소 ID는 필수입니다'),
  author_nickname: z.string().min(1, '작성자 정보는 필수입니다'),
  rating: z.number().int().min(1).max(5, '평점은 1~5 사이여야 합니다'),
  content: z.string().min(10, '리뷰는 최소 10자 이상이어야 합니다').max(1000, '리뷰는 최대 1000자까지 작성 가능합니다'),
  password: z.string().regex(/^\d{4}$/, '비밀번호는 4자리 숫자여야 합니다'),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;

// 리뷰 조회 응답 스키마
export const reviewSchema = z.object({
  id: z.number(),
  place_id: z.string(),
  author_nickname: z.string(),
  rating: z.number(),
  content: z.string(),
  created_at: z.string(), // ISO 8601 timestamp
  updated_at: z.string().nullable(),
});

export type Review = z.infer<typeof reviewSchema>;

// 리뷰 목록 조회 응답 스키마
export const reviewListResponseSchema = z.object({
  reviews: z.array(reviewSchema),
  total: z.number(),
});

export type ReviewListResponse = z.infer<typeof reviewListResponseSchema>;