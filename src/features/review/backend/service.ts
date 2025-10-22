import type { SupabaseClient } from '@supabase/supabase-js';
import type { CreateReviewInput, Review } from './schema';
import bcrypt from 'bcryptjs';

export class ReviewService {
  constructor(private supabase: SupabaseClient) {}

  // 리뷰 생성
  async createReview(input: CreateReviewInput): Promise<Review> {
    // 비밀번호 해시
    const passwordHash = await bcrypt.hash(input.password, 10);

    const { data, error } = await this.supabase
      .from('reviews')
      .insert({
        place_id: input.place_id,
        author_nickname: input.author_nickname,
        rating: input.rating,
        content: input.content,
        password_hash: passwordHash,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return {
      id: data.id,
      place_id: data.place_id,
      author_nickname: data.author_nickname,
      rating: data.rating,
      content: data.content,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  }

  // 특정 장소의 리뷰 목록 조회
  async getReviewsByPlaceId(placeId: string): Promise<Review[]> {
    const { data, error } = await this.supabase
      .from('reviews')
      .select('id, place_id, author_nickname, rating, content, created_at, updated_at')
      .eq('place_id', placeId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return data || [];
  }
}