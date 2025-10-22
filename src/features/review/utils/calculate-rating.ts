import type { Review } from '../backend/schema';

export interface AverageRatingData {
  average: number; // 평균 평점 (소수점 1자리)
  count: number;   // 총 리뷰 개수
}

export function calculateAverageRating(reviews: Review[] | undefined): AverageRatingData {
  if (!reviews || reviews.length === 0) {
    return { average: 0, count: 0 };
  }

  const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
  const average = Math.round((sum / reviews.length) * 10) / 10;

  return { average, count: reviews.length };
}
