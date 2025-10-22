'use client';

import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
};

interface StarRatingProps {
  value: number;        // 현재 선택된 별점 (0~5)
  onChange?: (value: number) => void; // 별점 변경 콜백
  readOnly?: boolean;   // 읽기 전용 모드
  size?: 'sm' | 'md' | 'lg';
}

export default function StarRating({
  value,
  onChange,
  readOnly = false,
  size = 'md'
}: StarRatingProps) {
  const handleClick = (rating: number) => {
    if (!readOnly && onChange) {
      onChange(rating);
    }
  };

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            sizeClasses[size],
            star <= value ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300',
            !readOnly && 'cursor-pointer hover:scale-110 transition-transform'
          )}
          onClick={() => handleClick(star)}
        />
      ))}
    </div>
  );
}