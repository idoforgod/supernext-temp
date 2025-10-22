import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getReviewsByPlaceId, createReview } from '../lib/api';
import type { CreateReviewInput } from '../backend/schema';

// 리뷰 목록 조회
export function useReviews(placeId: string) {
  return useQuery({
    queryKey: ['reviews', placeId],
    queryFn: () => getReviewsByPlaceId(placeId),
    enabled: !!placeId,
  });
}

// 리뷰 생성
export function useCreateReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createReview,
    onSuccess: (newReview) => {
      // 해당 장소의 리뷰 목록 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: ['reviews', newReview.place_id],
      });
    },
  });
}