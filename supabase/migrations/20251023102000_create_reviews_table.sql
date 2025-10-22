-- supabase/migrations/20251023102000_create_reviews_table.sql

-- reviews 테이블 생성
CREATE TABLE IF NOT EXISTS reviews (
    -- 리뷰의 고유 식별자 (PK, 자동 증가)
    id BIGSERIAL PRIMARY KEY,

    -- 리뷰가 속한 장소의 고유 ID (네이버 API에서 제공하는 ID 등)
    place_id VARCHAR(255) NOT NULL,

    -- 리뷰 작성자의 닉네임 또는 이메일
    author_nickname VARCHAR(255) NOT NULL,

    -- 사용자가 부여한 평점 (1~5점)
    rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),

    -- 리뷰 본문
    content TEXT NOT NULL,

    -- 리뷰 수정 및 삭제 시 본인 확인을 위한 비밀번호 (해시된 값)
    password_hash VARCHAR(255) NOT NULL,

    -- 레코드 생성 시각 (자동 기록)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- 레코드 수정 시각
    updated_at TIMESTAMPTZ
);

-- 특정 장소의 리뷰를 빠르게 조회하기 위해 place_id 컬럼에 인덱스를 생성
CREATE INDEX IF NOT EXISTS idx_reviews_place_id ON reviews(place_id);

-- updated_at 자동 갱신 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- updated_at 트리거 생성
DROP TRIGGER IF EXISTS update_reviews_updated_at ON reviews;
CREATE TRIGGER update_reviews_updated_at
BEFORE UPDATE ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- RLS 비활성화
ALTER TABLE reviews DISABLE ROW LEVEL SECURITY;