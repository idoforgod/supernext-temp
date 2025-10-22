'use client';

import ReviewList from './review-list';
import ReviewListSkeleton from './review-list-skeleton';
import EmptyState from '@/components/common/empty-state';
import ErrorState from '@/components/common/error-state';
import { MessageSquare } from 'lucide-react';
import type { Review } from '@/features/review/backend/schema';

interface ReviewListContainerProps {
  reviews: Review[] | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  onRetry: () => void;
}

export default function ReviewListContainer({
  reviews,
  isLoading,
  isError,
  error,
  onRetry
}: ReviewListContainerProps) {
  if (isLoading) {
    return <ReviewListSkeleton />;
  }

  if (isError) {
    return (
      <ErrorState
        message={error?.message || '리뷰를 불러오는 중 오류가 발생했습니다.'}
        onRetry={onRetry}
      />
    );
  }

  if (reviews && reviews.length === 0) {
    return (
      <div className="px-6 py-8">
        <EmptyState
          icon={<MessageSquare className="h-12 w-12 text-muted-foreground" />}
          title="아직 리뷰가 없습니다"
          description="이 장소에 대한 첫 번째 리뷰를 작성해보세요!"
        />
      </div>
    );
  }

  return <ReviewList reviews={reviews || []} />;
}
