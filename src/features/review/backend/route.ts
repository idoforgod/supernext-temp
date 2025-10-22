import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import type { AppEnv } from '@/backend/hono/context';
import { respond, success, failure } from '@/backend/http/response';
import { createReviewSchema } from './schema';
import { ReviewService } from './service';
import { REVIEW_ERROR } from './error';

const reviewApp = new Hono<AppEnv>();

// 리뷰 생성
reviewApp.post(
  '/api/reviews',
  zValidator('json', createReviewSchema),
  async (c) => {
    const input = c.req.valid('json');
    const supabase = c.get('supabase');
    const service = new ReviewService(supabase);

    try {
      const review = await service.createReview(input);
      return respond(c, success(review, 201));
    } catch (error) {
      c.get('logger').error('Failed to create review', error);
      return respond(
        c,
        failure(500, REVIEW_ERROR.DATABASE_ERROR, 'Failed to create review')
      );
    }
  }
);

// 리뷰 목록 조회
reviewApp.get('/api/reviews', async (c) => {
  const placeId = c.req.query('place_id');

  if (!placeId) {
    return respond(
      c,
      failure(400, REVIEW_ERROR.PLACE_ID_REQUIRED, 'place_id is required')
    );
  }

  const supabase = c.get('supabase');
  const service = new ReviewService(supabase);

  try {
    const reviews = await service.getReviewsByPlaceId(placeId);
    return respond(c, success({ reviews, total: reviews.length }));
  } catch (error) {
    c.get('logger').error('Failed to fetch reviews', error);
    return respond(
      c,
      failure(500, REVIEW_ERROR.DATABASE_ERROR, 'Failed to fetch reviews')
    );
  }
});

export default reviewApp;