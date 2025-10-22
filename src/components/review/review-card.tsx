'use client';

import { Card, CardHeader, CardContent } from '@/components/ui/card';
import StarRating from '@/components/rating/star-rating';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { Review } from '@/features/review/backend/schema';

interface ReviewCardProps {
  review: Review;
}

export default function ReviewCard({ review }: ReviewCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold">{review.author_nickname}</p>
            <p className="text-sm text-muted-foreground">
              {format(new Date(review.created_at), 'PPP', { locale: ko })}
            </p>
          </div>
          <StarRating value={review.rating} readOnly size="sm" />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm whitespace-pre-wrap">{review.content}</p>
      </CardContent>
    </Card>
  );
}