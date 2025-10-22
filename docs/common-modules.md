# 공통 모듈 작업 계획

**문서 버전**: 1.0
**작성일**: 2025-10-23
**기준 문서**: requirement.md, prd.md, userflow.md, database.md, external/map.md

---

## 1. 개요

본 문서는 장소 검색, 상세 정보 조회, 리뷰 작성 기능 구현에 앞서 개발해야 할 공통 모듈과 컴포넌트를 정의합니다. 모든 설계는 프로젝트 문서에 명시된 내용만을 기반으로 하며, 오버엔지니어링을 지양합니다.

### 1.1 공통 모듈의 범위

- 네이버 지도 SDK 연동 및 지도 표시 컴포넌트
- 네이버 검색 API 연동 백엔드 라우트
- 리뷰 CRUD 백엔드 라우트 및 서비스
- 공통 UI 컴포넌트 (검색 바, 장소 카드, 별점 선택 등)
- 공통 타입 정의 및 유틸리티
- 에러 처리 및 로딩 상태 관리

---

## 2. 네이버 지도 SDK 연동

### 2.1 개요

네이버 지도 SDK를 Next.js 환경에서 로드하고, 지도 표시 및 마커 관리 기능을 제공하는 클라이언트 컴포넌트를 구현합니다.

### 2.2 필수 작업

#### 2.2.1 Layout에 지도 SDK 스크립트 추가

**파일**: `src/app/layout.tsx`

**작업 내용**:
- Next.js `<Script>` 컴포넌트를 사용하여 네이버 지도 SDK 로드
- `strategy="beforeInteractive"` 옵션으로 페이지 상호작용 전에 스크립트 실행
- 환경 변수 `NEXT_PUBLIC_NCP_MAP_CLIENT_ID` 사용

**코드 예시**:
```tsx
// app/layout.tsx
import Script from 'next/script';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        {children}
        <Script
          strategy="beforeInteractive"
          src={`https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${process.env.NEXT_PUBLIC_NCP_MAP_CLIENT_ID}`}
        />
      </body>
    </html>
  );
}
```

#### 2.2.2 환경 변수 설정

**파일**: `.env.local`

**필수 환경 변수**:
```
NEXT_PUBLIC_NCP_MAP_CLIENT_ID=여기에_Client_ID_입력
NCP_MAP_CLIENT_SECRET=여기에_Client_Secret_입력
```

**주의사항**:
- `Client Secret`은 `NEXT_PUBLIC_` 접두사를 붙이지 않음 (서버 전용)
- `.gitignore`에 `.env.local` 포함 확인

#### 2.2.3 네이버 지도 타입 정의

**파일**: `src/types/naver-maps.d.ts` (새로 생성)

**작업 내용**:
- 네이버 지도 SDK의 TypeScript 타입 정의
- `window.naver` 전역 객체 타입 선언

**코드 예시**:
```typescript
// src/types/naver-maps.d.ts
declare global {
  interface Window {
    naver: {
      maps: {
        LatLng: new (lat: number, lng: number) => NaverLatLng;
        Map: new (
          element: HTMLElement,
          options: NaverMapOptions
        ) => NaverMap;
        Marker: new (options: NaverMarkerOptions) => NaverMarker;
      };
    };
  }
}

interface NaverLatLng {
  lat(): number;
  lng(): number;
}

interface NaverMapOptions {
  center: NaverLatLng;
  zoom: number;
}

interface NaverMap {
  setCenter(center: NaverLatLng): void;
  setZoom(level: number): void;
  panTo(center: NaverLatLng, options?: { duration?: number }): void;
}

interface NaverMarkerOptions {
  position: NaverLatLng;
  map: NaverMap;
  title?: string;
}

interface NaverMarker {
  setPosition(position: NaverLatLng): void;
  setMap(map: NaverMap | null): void;
}

export {};
```

#### 2.2.4 지도 컴포넌트

**파일**: `src/components/map/naver-map.tsx` (새로 생성)

**Props**:
```typescript
interface NaverMapProps {
  center?: { lat: number; lng: number }; // 초기 중심 좌표
  zoom?: number; // 초기 줌 레벨 (기본값: 17)
  onMapReady?: (map: NaverMap) => void; // 지도 초기화 완료 콜백
  className?: string;
}
```

**주요 기능**:
- `useEffect`에서 `window.naver` 확인 후 지도 초기화
- `useRef`로 지도 DOM 요소 참조
- 지도 초기화 완료 시 `onMapReady` 콜백 호출

**코드 구조**:
```tsx
'use client';

import { useEffect, useRef } from 'react';

export default function NaverMap({
  center = { lat: 37.3595704, lng: 127.105399 },
  zoom = 17,
  onMapReady,
  className = 'w-full h-full'
}: NaverMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.naver && mapRef.current) {
      const location = new window.naver.maps.LatLng(center.lat, center.lng);
      const map = new window.naver.maps.Map(mapRef.current, {
        center: location,
        zoom: zoom,
      });

      if (onMapReady) {
        onMapReady(map);
      }
    }
  }, [center.lat, center.lng, zoom, onMapReady]);

  return <div ref={mapRef} className={className} />;
}
```

#### 2.2.5 지도 마커 관리 Hook

**파일**: `src/hooks/use-map-marker.ts` (새로 생성)

**목적**: 지도에 마커를 추가/제거/이동하는 로직을 재사용 가능한 Hook으로 분리

**Hook 인터페이스**:
```typescript
interface UseMapMarkerOptions {
  map: NaverMap | null;
}

interface UseMapMarkerReturn {
  marker: NaverMarker | null;
  setMarkerPosition: (lat: number, lng: number) => void;
  removeMarker: () => void;
}
```

**코드 구조**:
```typescript
'use client';

import { useRef, useCallback } from 'react';

export function useMapMarker({ map }: UseMapMarkerOptions): UseMapMarkerReturn {
  const markerRef = useRef<NaverMarker | null>(null);

  const setMarkerPosition = useCallback((lat: number, lng: number) => {
    if (!map || !window.naver) return;

    const position = new window.naver.maps.LatLng(lat, lng);

    if (markerRef.current) {
      // 기존 마커 위치 업데이트
      markerRef.current.setPosition(position);
    } else {
      // 새 마커 생성
      markerRef.current = new window.naver.maps.Marker({
        position,
        map,
      });
    }

    // 지도 중심 이동 (1초 애니메이션)
    map.panTo(position, { duration: 1000 });
  }, [map]);

  const removeMarker = useCallback(() => {
    if (markerRef.current) {
      markerRef.current.setMap(null);
      markerRef.current = null;
    }
  }, []);

  return {
    marker: markerRef.current,
    setMarkerPosition,
    removeMarker,
  };
}
```

---

## 3. 네이버 검색 API 연동

### 3.1 개요

네이버 지역 검색 API를 호출하여 장소 정보를 조회하는 백엔드 Route Handler를 구현합니다.

### 3.2 필수 작업

#### 3.2.1 검색 API Route Handler

**파일**: `src/app/api/search/route.ts` (새로 생성)

**엔드포인트**: `GET /api/search?query={검색어}`

**응답 포맷**:
```typescript
// 성공 시
{
  items: Array<{
    title: string;        // HTML 태그 포함된 장소명
    link: string;         // 네이버 장소 URL
    category: string;     // 카테고리
    description: string;  // 설명
    telephone: string;    // 전화번호
    address: string;      // 지번 주소
    roadAddress: string;  // 도로명 주소
    mapx: string;         // 네이버 X 좌표
    mapy: string;         // 네이버 Y 좌표
  }>
}

// 실패 시
{
  error: {
    code: string;
    message: string;
  }
}
```

**에러 처리**:
- `query` 파라미터 누락: 400 Bad Request
- 네이버 API 호출 실패: 500 Internal Server Error
- 환경 변수 누락: 500 Internal Server Error

**코드 구조**:
```typescript
// src/app/api/search/route.ts
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');

  // 1. 입력 검증
  if (!query) {
    return NextResponse.json(
      { error: { code: 'MISSING_QUERY', message: 'Query parameter is required' } },
      { status: 400 }
    );
  }

  // 2. 환경 변수 확인
  const clientId = process.env.NEXT_PUBLIC_NCP_MAP_CLIENT_ID;
  const clientSecret = process.env.NCP_MAP_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { error: { code: 'CONFIG_ERROR', message: 'Missing API credentials' } },
      { status: 500 }
    );
  }

  // 3. 네이버 API 호출
  const url = `https://openapi.naver.com/v1/search/local.json?query=${encodeURI(query)}&display=5`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-Naver-Client-Id': clientId,
        'X-Naver-Client-Secret': clientSecret,
      },
    });

    if (!response.ok) {
      throw new Error(`Naver API error: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: { code: 'API_ERROR', message: 'Failed to fetch search results' } },
      { status: 500 }
    );
  }
}
```

#### 3.2.2 검색 결과 타입 정의

**파일**: `src/types/place.ts` (새로 생성)

**타입 정의**:
```typescript
// src/types/place.ts

// 네이버 API 원본 응답 타입
export interface NaverSearchItem {
  title: string;
  link: string;
  category: string;
  description: string;
  telephone: string;
  address: string;
  roadAddress: string;
  mapx: string;
  mapy: string;
}

export interface NaverSearchResponse {
  lastBuildDate: string;
  total: number;
  start: number;
  display: number;
  items: NaverSearchItem[];
}

// 앱 내부에서 사용할 Place 타입 (변환된 타입)
export interface Place {
  id: string;          // mapx+mapy 조합으로 생성 (고유 ID)
  name: string;        // HTML 태그 제거된 장소명
  category: string;
  address: string;     // 도로명 주소 우선, 없으면 지번 주소
  telephone: string;
  coordinates: {
    lat: number;       // 위경도 좌표로 변환된 Y 좌표
    lng: number;       // 위경도 좌표로 변환된 X 좌표
  };
}
```

#### 3.2.3 검색 API 클라이언트 함수

**파일**: `src/lib/api/search.ts` (새로 생성)

**목적**: 프론트엔드에서 검색 API를 호출하는 함수 제공

**함수 인터페이스**:
```typescript
export async function searchPlaces(query: string): Promise<Place[]>
```

**코드 구조**:
```typescript
// src/lib/api/search.ts
import { apiClient } from '@/lib/remote/api-client';
import type { NaverSearchResponse, Place } from '@/types/place';

// HTML 태그 제거 유틸리티
function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

// 네이버 좌표 → 위경도 변환 (간단한 근사 변환)
function convertNaverCoordinate(mapx: string, mapy: string) {
  // 네이버 좌표를 위경도로 변환
  // 실제 변환 공식은 네이버 지도 SDK의 UtilityService를 사용해야 정확함
  // 여기서는 간단한 근사값 사용
  const lng = parseFloat(mapx) / 10000000;
  const lat = parseFloat(mapy) / 10000000;
  return { lat, lng };
}

export async function searchPlaces(query: string): Promise<Place[]> {
  const response = await apiClient.get<NaverSearchResponse>('/api/search', {
    params: { query },
  });

  const items = response.data.items || [];

  return items.map((item) => {
    const coords = convertNaverCoordinate(item.mapx, item.mapy);

    return {
      id: `${item.mapx}_${item.mapy}`, // 고유 ID 생성
      name: stripHtmlTags(item.title),
      category: item.category,
      address: item.roadAddress || item.address,
      telephone: item.telephone,
      coordinates: coords,
    };
  });
}
```

---

## 4. 리뷰 CRUD 백엔드 구현

### 4.1 개요

리뷰 데이터의 생성(Create), 조회(Read) 기능을 백엔드 Hono 라우트로 구현합니다. 수정(Update) 및 삭제(Delete)는 현재 범위 밖입니다.

### 4.2 필수 작업

#### 4.2.1 리뷰 스키마 정의

**파일**: `src/features/review/backend/schema.ts` (새로 생성)

**Zod 스키마**:
```typescript
// src/features/review/backend/schema.ts
import { z } from 'zod';

// 리뷰 생성 요청 스키마
export const createReviewSchema = z.object({
  place_id: z.string().min(1, '장소 ID는 필수입니다'),
  author_nickname: z.string().min(1, '작성자 정보는 필수입니다'),
  rating: z.number().int().min(1).max(5, '평점은 1~5 사이여야 합니다'),
  content: z.string().min(10, '리뷰는 최소 10자 이상이어야 합니다').max(1000, '리뷰는 최대 1000자까지 작성 가능합니다'),
  password: z.string().regex(/^\d{4}$/, '비밀번호는 4자리 숫자여야 합니다'),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;

// 리뷰 조회 응답 스키마
export const reviewSchema = z.object({
  id: z.number(),
  place_id: z.string(),
  author_nickname: z.string(),
  rating: z.number(),
  content: z.string(),
  created_at: z.string(), // ISO 8601 timestamp
  updated_at: z.string().nullable(),
});

export type Review = z.infer<typeof reviewSchema>;

// 리뷰 목록 조회 응답 스키마
export const reviewListResponseSchema = z.object({
  reviews: z.array(reviewSchema),
  total: z.number(),
});

export type ReviewListResponse = z.infer<typeof reviewListResponseSchema>;
```

#### 4.2.2 리뷰 에러 코드 정의

**파일**: `src/features/review/backend/error.ts` (새로 생성)

**에러 코드**:
```typescript
// src/features/review/backend/error.ts
export const REVIEW_ERROR = {
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  PLACE_ID_REQUIRED: 'PLACE_ID_REQUIRED',
  DATABASE_ERROR: 'DATABASE_ERROR',
  REVIEW_NOT_FOUND: 'REVIEW_NOT_FOUND',
} as const;

export type ReviewErrorCode = typeof REVIEW_ERROR[keyof typeof REVIEW_ERROR];
```

#### 4.2.3 리뷰 서비스 (Supabase 연동)

**파일**: `src/features/review/backend/service.ts` (새로 생성)

**주요 함수**:
```typescript
// src/features/review/backend/service.ts
import type { SupabaseClient } from '@supabase/supabase-js';
import type { CreateReviewInput, Review } from './schema';
import bcrypt from 'bcryptjs'; // 또는 crypto 모듈 사용

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
```

**주의사항**:
- `bcryptjs` 패키지 설치 필요: `npm install bcryptjs @types/bcryptjs`
- 또는 Node.js 내장 `crypto` 모듈 사용 가능

#### 4.2.4 리뷰 라우트 (Hono)

**파일**: `src/features/review/backend/route.ts` (새로 생성)

**엔드포인트**:
- `POST /api/reviews` - 리뷰 생성
- `GET /api/reviews?place_id={place_id}` - 특정 장소의 리뷰 목록 조회

**코드 구조**:
```typescript
// src/features/review/backend/route.ts
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
```

#### 4.2.5 Hono 앱에 리뷰 라우트 등록

**파일**: `src/backend/hono/app.ts` (수정)

**작업 내용**:
- `registerReviewRoutes` 함수 추가
- `createHonoApp`에서 리뷰 라우트 등록

**코드 예시**:
```typescript
// src/backend/hono/app.ts
import reviewApp from '@/features/review/backend/route';

function registerReviewRoutes(app: Hono<AppEnv>) {
  app.route('/', reviewApp);
}

export function createHonoApp() {
  const app = new Hono<AppEnv>();

  // 기존 미들웨어 등록...

  // 라우트 등록
  registerReviewRoutes(app);
  // registerExampleRoutes(app); // 기존 예시 라우트

  return app;
}
```

#### 4.2.6 리뷰 API 클라이언트 함수

**파일**: `src/features/review/lib/api.ts` (새로 생성)

**함수 인터페이스**:
```typescript
export async function createReview(input: CreateReviewInput): Promise<Review>
export async function getReviewsByPlaceId(placeId: string): Promise<Review[]>
```

**코드 구조**:
```typescript
// src/features/review/lib/api.ts
import { apiClient } from '@/lib/remote/api-client';
import type { CreateReviewInput, Review, ReviewListResponse } from '../backend/schema';

export async function createReview(input: CreateReviewInput): Promise<Review> {
  const response = await apiClient.post<Review>('/api/reviews', input);
  return response.data;
}

export async function getReviewsByPlaceId(placeId: string): Promise<Review[]> {
  const response = await apiClient.get<ReviewListResponse>('/api/reviews', {
    params: { place_id: placeId },
  });
  return response.data.reviews;
}
```

---

## 5. 공통 UI 컴포넌트

### 5.1 개요

여러 페이지에서 재사용될 UI 컴포넌트를 구현합니다.

### 5.2 필수 컴포넌트

#### 5.2.1 검색 바 컴포넌트

**파일**: `src/components/search/search-bar.tsx` (새로 생성)

**Props**:
```typescript
interface SearchBarProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  isLoading?: boolean;
}
```

**주요 기능**:
- 입력 필드와 검색 버튼 제공
- Enter 키 입력 시 검색 실행
- 로딩 상태 시 버튼 비활성화 및 스피너 표시
- 빈 입력값 검증

**코드 구조**:
```tsx
'use client';

import { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function SearchBar({
  placeholder = '장소를 검색하세요',
  onSearch,
  isLoading = false
}: SearchBarProps) {
  const [query, setQuery] = useState('');

  const handleSearch = () => {
    const trimmed = query.trim();
    if (trimmed) {
      onSearch(trimmed);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="flex gap-2">
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={isLoading}
        className="flex-1"
      />
      <Button
        onClick={handleSearch}
        disabled={isLoading || !query.trim()}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Search className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
```

#### 5.2.2 장소 카드 컴포넌트

**파일**: `src/components/place/place-card.tsx` (새로 생성)

**Props**:
```typescript
interface PlaceCardProps {
  place: Place;
  onClick?: () => void;
}
```

**주요 기능**:
- 장소 이름, 카테고리, 주소 표시
- 클릭 시 `onClick` 콜백 호출
- hover 효과

**코드 구조**:
```tsx
'use client';

import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { MapPin, Phone } from 'lucide-react';
import type { Place } from '@/types/place';

export default function PlaceCard({ place, onClick }: PlaceCardProps) {
  return (
    <Card
      className="cursor-pointer hover:shadow-lg transition-shadow"
      onClick={onClick}
    >
      <CardHeader>
        <CardTitle className="text-lg">{place.name}</CardTitle>
        <CardDescription className="space-y-1">
          <div className="flex items-center gap-1 text-sm">
            <span className="text-muted-foreground">{place.category}</span>
          </div>
          <div className="flex items-center gap-1 text-sm">
            <MapPin className="h-3 w-3" />
            <span>{place.address}</span>
          </div>
          {place.telephone && (
            <div className="flex items-center gap-1 text-sm">
              <Phone className="h-3 w-3" />
              <span>{place.telephone}</span>
            </div>
          )}
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
```

#### 5.2.3 별점 선택 컴포넌트

**파일**: `src/components/rating/star-rating.tsx` (새로 생성)

**Props**:
```typescript
interface StarRatingProps {
  value: number;        // 현재 선택된 별점 (0~5)
  onChange?: (value: number) => void; // 별점 변경 콜백
  readOnly?: boolean;   // 읽기 전용 모드
  size?: 'sm' | 'md' | 'lg';
}
```

**주요 기능**:
- 1~5개의 별 아이콘 표시
- 클릭 시 별점 선택 (readOnly가 false일 때)
- hover 효과
- 읽기 전용 모드 (평점 표시용)

**코드 구조**:
```tsx
'use client';

import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
};

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
```

#### 5.2.4 리뷰 카드 컴포넌트

**파일**: `src/components/review/review-card.tsx` (새로 생성)

**Props**:
```typescript
interface ReviewCardProps {
  review: Review;
}
```

**주요 기능**:
- 작성자, 별점, 내용, 작성일 표시
- 날짜 포맷팅 (date-fns 사용)

**코드 구조**:
```tsx
'use client';

import { Card, CardHeader, CardContent } from '@/components/ui/card';
import StarRating from '@/components/rating/star-rating';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { Review } from '@/features/review/backend/schema';

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
```

#### 5.2.5 빈 상태 컴포넌트

**파일**: `src/components/common/empty-state.tsx` (새로 생성)

**Props**:
```typescript
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode; // 버튼 등
}
```

**주요 기능**:
- 검색 결과 없음, 리뷰 없음 등의 빈 상태 표시

**코드 구조**:
```tsx
'use client';

import { AlertCircle } from 'lucide-react';

export default function EmptyState({
  icon = <AlertCircle className="h-12 w-12 text-muted-foreground" />,
  title,
  description,
  action
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {icon}
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      {description && (
        <p className="mt-2 text-sm text-muted-foreground max-w-md">
          {description}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
```

---

## 6. 공통 유틸리티 및 Hook

### 6.1 에러 처리 유틸리티

**파일**: `src/lib/utils/error.ts` (새로 생성)

**함수**:
```typescript
// src/lib/utils/error.ts

// API 에러에서 사용자 친화적인 메시지 추출
export function getErrorMessage(error: unknown, fallback = '오류가 발생했습니다'): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  // Axios 에러 처리 (기존 extractApiErrorMessage 활용)
  return fallback;
}
```

### 6.2 React Query Hook

**파일**: `src/features/review/hooks/use-reviews.ts` (새로 생성)

**목적**: 리뷰 조회 및 생성을 위한 React Query Hook

**Hook 인터페이스**:
```typescript
export function useReviews(placeId: string)
export function useCreateReview()
```

**코드 구조**:
```typescript
// src/features/review/hooks/use-reviews.ts
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
```

---

## 7. 데이터베이스 Migration

### 7.1 리뷰 테이블 생성

**파일**: `supabase/migrations/YYYYMMDDHHMMSS_create_reviews_table.sql` (새로 생성)

**Migration 내용**:
```sql
-- supabase/migrations/YYYYMMDDHHMMSS_create_reviews_table.sql

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

-- RLS 비활성화 (요구사항에 따라)
ALTER TABLE reviews DISABLE ROW LEVEL SECURITY;
```

**실행 방법**:
```bash
# Supabase CLI 사용 시
supabase migration new create_reviews_table
# 생성된 파일에 위 SQL 내용 복사
supabase db push
```

---

## 8. 환경 변수 체크리스트

### 8.1 필수 환경 변수

**파일**: `.env.local`

```
# 네이버 지도 SDK (클라이언트 노출 가능)
NEXT_PUBLIC_NCP_MAP_CLIENT_ID=your_client_id

# 네이버 검색 API (서버 전용, 절대 노출 금지)
NCP_MAP_CLIENT_SECRET=your_client_secret

# API 베이스 URL (선택적, 기본값: 빈 문자열)
NEXT_PUBLIC_API_BASE_URL=

# Supabase 설정 (기존 설정 유지)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 8.2 환경 변수 검증

**파일**: `src/lib/config/env.ts` (새로 생성)

**목적**: 필수 환경 변수 검증 및 타입 안전성 보장

**코드 구조**:
```typescript
// src/lib/config/env.ts
import { z } from 'zod';

const envSchema = z.object({
  // 네이버 지도/검색 API
  NEXT_PUBLIC_NCP_MAP_CLIENT_ID: z.string().min(1, 'Naver Client ID is required'),
  NCP_MAP_CLIENT_SECRET: z.string().min(1, 'Naver Client Secret is required'),

  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('Invalid Supabase URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'Supabase Anon Key is required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'Supabase Service Role Key is required'),
});

export function validateEnv() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('Environment validation failed:', result.error.format());
    throw new Error('Missing or invalid environment variables');
  }

  return result.data;
}
```

---

## 9. 추가 패키지 설치

### 9.1 필수 패키지

```bash
# 비밀번호 해시 (리뷰 기능)
npm install bcryptjs
npm install -D @types/bcryptjs

# Hono Zod Validator (백엔드 검증)
npm install @hono/zod-validator

# 날짜 포맷팅 (리뷰 날짜 표시) - 이미 설치됨
# npm install date-fns
```

### 9.2 선택 패키지

```bash
# React Query Devtools (개발 중 디버깅)
npm install -D @tanstack/react-query-devtools
```

---

## 10. 작업 순서 및 우선순위

### 10.1 Phase 1: 환경 설정 (필수)

**예상 소요 시간**: 30분

1. 환경 변수 설정 (`.env.local`)
2. 패키지 설치 (`bcryptjs`, `@hono/zod-validator`)
3. 네이버 지도 SDK 스크립트 추가 (`src/app/layout.tsx`)
4. 환경 변수 검증 함수 작성 (`src/lib/config/env.ts`)

### 10.2 Phase 2: 타입 및 스키마 정의 (필수)

**예상 소요 시간**: 1시간

1. 네이버 지도 타입 정의 (`src/types/naver-maps.d.ts`)
2. Place 타입 정의 (`src/types/place.ts`)
3. 리뷰 스키마 정의 (`src/features/review/backend/schema.ts`)
4. 리뷰 에러 코드 정의 (`src/features/review/backend/error.ts`)

### 10.3 Phase 3: 데이터베이스 Migration (필수)

**예상 소요 시간**: 30분

1. 리뷰 테이블 생성 Migration SQL 작성
2. Supabase에 Migration 적용
3. 테이블 생성 확인

### 10.4 Phase 4: 백엔드 구현 (필수)

**예상 소요 시간**: 2~3시간

1. 네이버 검색 API Route Handler (`src/app/api/search/route.ts`)
2. 리뷰 서비스 구현 (`src/features/review/backend/service.ts`)
3. 리뷰 라우트 구현 (`src/features/review/backend/route.ts`)
4. Hono 앱에 리뷰 라우트 등록 (`src/backend/hono/app.ts`)
5. 백엔드 API 테스트 (Postman 또는 curl)

### 10.5 Phase 5: 프론트엔드 API 클라이언트 (필수)

**예상 소요 시간**: 1시간

1. 검색 API 클라이언트 함수 (`src/lib/api/search.ts`)
2. 리뷰 API 클라이언트 함수 (`src/features/review/lib/api.ts`)
3. React Query Hook (`src/features/review/hooks/use-reviews.ts`)

### 10.6 Phase 6: 지도 컴포넌트 (필수)

**예상 소요 시간**: 2시간

1. 네이버 지도 컴포넌트 (`src/components/map/naver-map.tsx`)
2. 지도 마커 관리 Hook (`src/hooks/use-map-marker.ts`)
3. 지도 컴포넌트 테스트

### 10.7 Phase 7: 공통 UI 컴포넌트 (필수)

**예상 소요 시간**: 2~3시간

1. 검색 바 컴포넌트 (`src/components/search/search-bar.tsx`)
2. 장소 카드 컴포넌트 (`src/components/place/place-card.tsx`)
3. 별점 선택 컴포넌트 (`src/components/rating/star-rating.tsx`)
4. 리뷰 카드 컴포넌트 (`src/components/review/review-card.tsx`)
5. 빈 상태 컴포넌트 (`src/components/common/empty-state.tsx`)

### 10.8 Phase 8: 유틸리티 및 Helper (선택)

**예상 소요 시간**: 30분

1. 에러 처리 유틸리티 (`src/lib/utils/error.ts`)

---

## 11. 테스트 체크리스트

### 11.1 백엔드 API 테스트

- [ ] `GET /api/search?query=시청역 맛집` 호출 시 검색 결과 반환
- [ ] `GET /api/search` (query 누락) 호출 시 400 에러 반환
- [ ] `POST /api/reviews` 정상 데이터로 호출 시 201 생성 성공
- [ ] `POST /api/reviews` 유효하지 않은 데이터로 호출 시 400 에러 반환
- [ ] `GET /api/reviews?place_id=123` 호출 시 리뷰 목록 반환
- [ ] `GET /api/reviews` (place_id 누락) 호출 시 400 에러 반환

### 11.2 프론트엔드 컴포넌트 테스트

- [ ] 지도 컴포넌트가 정상적으로 렌더링됨
- [ ] 검색 바에 키워드 입력 후 검색 시 `onSearch` 콜백 호출됨
- [ ] 장소 카드 클릭 시 `onClick` 콜백 호출됨
- [ ] 별점 선택 컴포넌트에서 별 클릭 시 `onChange` 콜백 호출됨
- [ ] 리뷰 카드에 작성자, 평점, 내용, 날짜가 올바르게 표시됨

### 11.3 통합 테스트

- [ ] 검색 → 장소 선택 → 지도 마커 표시 플로우 정상 작동
- [ ] 장소 선택 → 리뷰 목록 조회 플로우 정상 작동
- [ ] 리뷰 작성 → 리뷰 목록 갱신 플로우 정상 작동

---

## 12. 주의사항 및 제약사항

### 12.1 네이버 좌표 변환

- 네이버 API의 `mapx`, `mapy` 좌표는 네이버 고유 좌표계
- 정확한 변환을 위해서는 네이버 지도 SDK의 `UtilityService`를 사용해야 함
- 현재 구현에서는 간단한 근사 변환 사용 (실제 프로젝트에서는 정확한 변환 필요)

### 12.2 보안

- `Client Secret`은 절대 클라이언트에 노출되지 않도록 주의
- 비밀번호는 반드시 해시 처리 후 저장
- API 요청 시 HTTPS 사용 (프로덕션 환경)

### 12.3 성능

- 리뷰 목록 조회 시 페이지네이션 구현 고려 (현재 범위 밖)
- 네이버 API 할당량 제한 주의 (무료 플랜 기준)

### 12.4 에러 처리

- 모든 API 호출에 try-catch 구문 적용
- 사용자 친화적인 에러 메시지 표시
- 네트워크 오류 시 재시도 옵션 제공 (선택적)

---

## 13. 향후 확장 가능성

현재 범위에는 포함되지 않지만, 향후 추가 가능한 기능:

- 리뷰 수정 및 삭제 기능
- 리뷰 페이지네이션 (무한 스크롤)
- 장소 즐겨찾기 기능
- 검색 이력 저장 및 자동완성
- 리뷰 이미지 업로드
- 사용자 인증 및 프로필 기능
- 리뷰 좋아요/신고 기능
- 평균 평점 자동 계산 및 캐싱
- 네이버 좌표 변환 정확도 개선

---

## 14. 참고 문서

- [네이버 지도 SDK 문서](https://navermaps.github.io/android-map-sdk/guide-ko/)
- [네이버 검색 API 문서](https://developers.naver.com/docs/serviceapi/search/local/local.md)
- [Next.js Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Hono 공식 문서](https://hono.dev/)
- [Supabase 공식 문서](https://supabase.com/docs)
- [React Query 공식 문서](https://tanstack.com/query/latest)
- [Zod 공식 문서](https://zod.dev/)

---

**문서 종료**
