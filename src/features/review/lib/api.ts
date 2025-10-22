import { apiClient } from '@/lib/remote/api-client';
import type { CreateReviewInput, Review, ReviewListResponse } from '../backend/schema';

export async function createReview(input: CreateReviewInput): Promise<Review> {
  const response = await apiClient.post<Review>('/api/reviews', input);
  return response.data;
}

export async function getReviewsByPlaceId(placeId: string): Promise<Review[]> {
  const response = await apiClient.get<ReviewListResponse>('/api/reviews', {
    params: { place_id: placeId },
  });
  return response.data.reviews;
}