### **데이터베이스 관점의 데이터플로우 (Data Flow)**

유저플로우에 명시된 데이터와 상호작용을 기반으로 한 데이터베이스의 핵심 데이터플로우는 **리뷰(Review) 데이터의 생성(Create)과 조회(Read)** 두 가지로 정의됩니다.

1.  **리뷰 데이터 조회 (Read Flow)**
    *   **트리거:** 사용자가 검색 결과에서 특정 장소를 선택하여 '장소 상세 정보 화면'에 진입할 때 발생합니다.
    *   **프로세스:**
        1.  애플리케이션은 사용자가 선택한 장소의 고유 ID (예: 네이버 API에서 제공하는 장소 ID)를 획득합니다.
        2.  이 장소 ID를 조건( `WHERE place_id = ?` )으로 사용하여 `reviews` 테이블에 `SELECT` 쿼리를 실행합니다.
        3.  데이터베이스는 해당 장소 ID와 일치하는 모든 리뷰 레코드를 조회하여 애플리케이션에 반환합니다.
        4.  애플리케이션은 반환된 리뷰 목록을 화면에 표시합니다.

2.  **리뷰 데이터 생성 (Create Flow)**
    *   **트리거:** 사용자가 '리뷰 작성 화면'에서 모든 정보를 입력하고 '등록하기' 버튼을 탭할 때 발생합니다.
    *   **프로세스:**
        1.  애플리케이션은 유효성 검증을 통과한 리뷰 데이터(작성자, 평점, 내용, 해시 처리된 비밀번호)와 현재 장소의 고유 ID를 준비합니다.
        2.  준비된 데이터를 `reviews` 테이블에 새로운 레코드로 추가하는 `INSERT` 쿼리를 실행합니다.
        3.  데이터베이스는 새로운 레코드를 성공적으로 저장하고, 생성된 레코드의 정보(예: 고유 리뷰 ID)를 반환합니다.
        4.  애플리케이션은 저장이 성공했음을 확인하고, 사용자에게 긍정적인 피드백을 준 뒤 이전 화면의 리뷰 목록을 갱신합니다.

---

### **데이터베이스 스키마 (PostgreSQL)**

위 데이터플로우를 구현하기 위한 최소 단위의 테이블 스키마입니다. 유저플로우에 명시된 데이터만을 포함하여 설계했습니다.

`reviews` 테이블은 사용자가 작성한 모든 리뷰를 저장하는 핵심 테이블입니다.

```sql
-- reviews: 사용자가 작성한 리뷰 정보를 저장하는 테이블
CREATE TABLE reviews (
    -- 리뷰의 고유 식별자 (PK, 자동 증가)
    id BIGSERIAL PRIMARY KEY,

    -- 리뷰가 속한 장소의 고유 ID (네이버 API에서 제공하는 ID 등)
    -- 이 컬럼을 통해 특정 장소에 속한 리뷰들을 조회하므로, 인덱스를 생성합니다.
    place_id VARCHAR(255) NOT NULL,

    -- 리뷰 작성자의 닉네임 또는 이메일
    author_nickname VARCHAR(255) NOT NULL,

    -- 사용자가 부여한 평점 (1~5점)
    -- CHECK 제약 조건을 통해 데이터의 무결성을 보장합니다.
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

-- 특정 장소의 리뷰를 빠르게 조회하기 위해 place_id 컬럼에 인덱스를 생성합니다.
CREATE INDEX idx_reviews_place_id ON reviews(place_id);

-- (선택적) 리뷰가 수정될 때마다 updated_at을 자동으로 갱신하는 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_reviews_updated_at
BEFORE UPDATE ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

```

**스키마 설명:**

*   `id`: 각 리뷰를 유일하게 식별하는 기본 키(Primary Key)입니다.
*   `place_id`: 어떤 장소에 대한 리뷰인지를 식별하는 **매우 중요한 키**입니다. 이 값을 기준으로 특정 장소의 모든 리뷰를 불러옵니다. 성능 향상을 위해 인덱스(Index)를 생성합니다.
*   `author_nickname`, `rating`, `content`: 유저플로우에서 사용자가 직접 입력하는 핵심 데이터 필드입니다. `NOT NULL` 제약조건으로 필수 입력을 강제합니다.
*   `password_hash`: 사용자가 입력한 비밀번호를 그대로 저장하는 것은 보안상 매우 위험하므로, 해시(hash) 알고리즘을 거친 결과값을 저장합니다.
*   `created_at`, `updated_at`: 데이터의 생성 및 마지막 수정 시점을 기록하여 추후 데이터 관리 및 정렬에 활용할 수 있습니다.