'use client';

import StarRating from '@/components/rating/star-rating';
import { MapPin } from 'lucide-react';

interface PlaceHeaderProps {
  name: string;
  address: string;
  averageRating: number;
  reviewCount: number;
}

export default function PlaceHeader({
  name,
  address,
  averageRating,
  reviewCount
}: PlaceHeaderProps) {
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-semibold text-gray-900 mb-2">{name}</h1>

        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <MapPin className="h-4 w-4" />
          <span>{address}</span>
        </div>

        {reviewCount > 0 && (
          <div className="flex items-center gap-2">
            <StarRating value={averageRating} readOnly size="sm" />
            <span className="text-sm text-gray-600">
              {averageRating.toFixed(1)} (리뷰 {reviewCount}개)
            </span>
          </div>
        )}

        {reviewCount === 0 && (
          <p className="text-sm text-gray-500">아직 리뷰가 없습니다</p>
        )}
      </div>
    </div>
  );
}
