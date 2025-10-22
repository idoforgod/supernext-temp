'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useReviews } from '@/features/review/hooks/use-reviews';
import PlaceHeader from '@/features/place/components/place-header';
import ReviewListContainer from '@/features/review/components/review-list-container';
import FloatingActionButton from '@/components/common/floating-action-button';
import { calculateAverageRating } from '@/features/review/utils/calculate-rating';

interface PlaceDetailClientProps {
  placeInfo: {
    id: string;
    name: string;
    address: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
}

export default function PlaceDetailClient({ placeInfo }: PlaceDetailClientProps) {
  const router = useRouter();
  const { data: reviews, isLoading, isError, error, refetch } = useReviews(placeInfo.id);

  const { average: averageRating, count: reviewCount } = useMemo(
    () => calculateAverageRating(reviews),
    [reviews]
  );

  const handleWriteReview = () => {
    router.push(`/place/${placeInfo.id}/write-review`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PlaceHeader
        name={placeInfo.name}
        address={placeInfo.address}
        averageRating={averageRating}
        reviewCount={reviewCount}
      />

      <ReviewListContainer
        reviews={reviews}
        isLoading={isLoading}
        isError={isError}
        error={error}
        onRetry={refetch}
      />

      <FloatingActionButton label="리뷰 작성하기" onClick={handleWriteReview} />
    </div>
  );
}
