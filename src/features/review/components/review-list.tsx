'use client';

import ReviewCard from '@/components/review/review-card';
import type { Review } from '@/features/review/backend/schema';

interface ReviewListProps {
  reviews: Review[];
}

export default function ReviewList({ reviews }: ReviewListProps) {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <h2 className="text-xl font-semibold mb-4">리뷰 ({reviews.length}개)</h2>
      <div className="space-y-4">
        {reviews.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>
    </div>
  );
}
