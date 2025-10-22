# 메인 (지도) 화면 구현 계획

**문서 버전**: 1.0
**작성일**: 2025-10-23
**기준 문서**: prd.md, userflow.md, common-modules.md, 001-place-search/spec.md

---

## 1. 개요

### 1.1 페이지 목적

메인 (지도) 화면은 앱의 진입점이자 핵심 인터랙션이 발생하는 화면입니다. 사용자가 지도를 통해 장소를 시각적으로 탐색하고, 검색을 통해 원하는 장소를 빠르게 찾을 수 있도록 지원합니다.

### 1.2 주요 기능

1. **지도 표시 및 인터랙션**: 네이버 지도 SDK를 활용한 지도 표시, 이동, 확대/축소
2. **장소 검색**: 상단 검색창을 통한 키워드 기반 장소 검색
3. **검색 결과 표시**: 검색 결과를 오버레이 형태로 표시
4. **장소 선택**: 검색 결과에서 장소 선택 시 지도 마커 표시 및 상세 화면으로 이동

### 1.3 페이지 라우트

- **경로**: `/` (루트 경로)
- **파일 위치**: `src/app/page.tsx`
- **페이지 타입**: Client Component

---

## 2. 페이지 구조 설계

### 2.1 레이아웃 구조

```
┌─────────────────────────────────────────┐
│  [검색 바 - 고정 상단]                    │
├─────────────────────────────────────────┤
│                                         │
│                                         │
│         [지도 영역 - 전체 화면]           │
│                                         │
│                                         │
├─────────────────────────────────────────┤
│  [검색 결과 목록 - 하단 시트 오버레이]      │
│  (검색 실행 시에만 표시)                   │
└─────────────────────────────────────────┘
```

### 2.2 컴포넌트 계층 구조

```
MapSearchPage (src/app/page.tsx)
├── SearchBar (공통 모듈)
│   └── 검색 입력 필드 + 검색 버튼
├── NaverMap (공통 모듈)
│   └── 지도 표시 및 마커 관리
└── SearchResultSheet (신규 페이지 컴포넌트)
    ├── 검색 결과 헤더
    └── PlaceCard[] (공통 모듈)
        └── 각 장소 카드
```

### 2.3 상태 관리

#### 2.3.1 로컬 상태 (useState)

```typescript
// 검색 관련 상태
const [searchQuery, setSearchQuery] = useState<string>(''); // 현재 검색 키워드
const [searchResults, setSearchResults] = useState<Place[]>([]); // 검색 결과 목록
const [selectedPlace, setSelectedPlace] = useState<Place | null>(null); // 선택된 장소
const [isSearching, setIsSearching] = useState<boolean>(false); // 검색 중 로딩 상태

// 지도 관련 상태
const [mapInstance, setMapInstance] = useState<NaverMap | null>(null); // 지도 인스턴스
```

#### 2.3.2 서버 상태 (React Query)

```typescript
// 검색 API는 직접 호출하여 결과를 로컬 상태로 관리
// (React Query 캐싱보다 검색 결과의 즉각적인 반영이 중요)
```

---

## 3. 신규 컴포넌트 구현

### 3.1 SearchResultSheet 컴포넌트

**파일 위치**: `src/app/_components/search-result-sheet.tsx`

**목적**: 검색 결과를 하단 시트 형태로 표시하는 오버레이 컴포넌트

#### Props 인터페이스

```typescript
interface SearchResultSheetProps {
  results: Place[];
  isVisible: boolean;
  onPlaceSelect: (place: Place) => void;
  onClose: () => void;
}
```

#### 주요 기능

1. **검색 결과 목록 표시**
   - 검색된 장소 목록을 PlaceCard로 렌더링
   - 최대 5개 결과 표시 (네이버 API display=5 기준)

2. **빈 상태 처리**
   - 검색 결과가 없을 경우 EmptyState 컴포넌트 표시
   - 메시지: "'{검색어}'에 대한 검색 결과가 없습니다."

3. **스크롤 처리**
   - 결과가 많을 경우 내부 스크롤 가능
   - 최대 높이: `max-h-[50vh]`

4. **닫기 동작**
   - 오버레이 외부 클릭 시 닫힘
   - 닫기 버튼 제공

#### 구현 예시

```tsx
'use client';

import { X } from 'lucide-react';
import PlaceCard from '@/components/place/place-card';
import EmptyState from '@/components/common/empty-state';
import type { Place } from '@/types/place';

interface SearchResultSheetProps {
  results: Place[];
  isVisible: boolean;
  onPlaceSelect: (place: Place) => void;
  onClose: () => void;
}

export default function SearchResultSheet({
  results,
  isVisible,
  onPlaceSelect,
  onClose,
}: SearchResultSheetProps) {
  if (!isVisible) return null;

  return (
    <>
      {/* 백드롭 (오버레이 외부 클릭 감지) */}
      <div
        className="fixed inset-0 z-40 bg-black/20"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* 검색 결과 시트 */}
      <div className="fixed bottom-0 left-0 right-0 z-50 max-h-[60vh] overflow-hidden rounded-t-2xl border-t border-gray-200 bg-white shadow-xl">
        {/* 헤더 */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold">
            검색 결과 ({results.length})
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 transition-colors hover:bg-gray-100"
            aria-label="검색 결과 닫기"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 결과 목록 */}
        <div className="overflow-y-auto p-4" style={{ maxHeight: 'calc(60vh - 64px)' }}>
          {results.length === 0 ? (
            <EmptyState
              title="검색 결과가 없습니다"
              description="다른 키워드로 검색해보세요."
            />
          ) : (
            <div className="space-y-3">
              {results.map((place) => (
                <PlaceCard
                  key={place.id}
                  place={place}
                  onClick={() => onPlaceSelect(place)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
```

---

## 4. 메인 페이지 구현

### 4.1 파일 위치

**경로**: `src/app/page.tsx`

### 4.2 주요 로직

#### 4.2.1 검색 처리

```typescript
const handleSearch = async (query: string) => {
  setIsSearching(true);
  setSearchQuery(query);

  try {
    const results = await searchPlaces(query);
    setSearchResults(results);

    // 검색 결과가 있으면 첫 번째 장소를 지도 중심으로 이동
    if (results.length > 0) {
      const firstPlace = results[0];
      setMarkerPosition(firstPlace.coordinates.lat, firstPlace.coordinates.lng);
    }
  } catch (error) {
    console.error('Search failed:', error);
    toast({
      title: '검색 실패',
      description: '장소 검색 중 오류가 발생했습니다. 다시 시도해주세요.',
      variant: 'destructive',
    });
    setSearchResults([]);
  } finally {
    setIsSearching(false);
  }
};
```

#### 4.2.2 장소 선택 처리

```typescript
const handlePlaceSelect = (place: Place) => {
  setSelectedPlace(place);

  // 지도 마커 위치 업데이트
  setMarkerPosition(place.coordinates.lat, place.coordinates.lng);

  // 상세 페이지로 이동
  router.push(`/places/${place.id}`);
};
```

#### 4.2.3 지도 초기화

```typescript
const handleMapReady = (map: NaverMap) => {
  setMapInstance(map);
};
```

### 4.3 전체 페이지 구현

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import NaverMap from '@/components/map/naver-map';
import SearchBar from '@/components/search/search-bar';
import SearchResultSheet from './_components/search-result-sheet';
import { useMapMarker } from '@/hooks/use-map-marker';
import { searchPlaces } from '@/lib/api/search';
import { useToast } from '@/hooks/use-toast';
import type { Place } from '@/types/place';

export default function MapSearchPage() {
  const router = useRouter();
  const { toast } = useToast();

  // 검색 상태
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<Place[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);

  // 지도 상태
  const [mapInstance, setMapInstance] = useState<any>(null);
  const { setMarkerPosition } = useMapMarker({ map: mapInstance });

  // 검색 처리
  const handleSearch = async (query: string) => {
    if (!query.trim()) return;

    setIsSearching(true);
    setSearchQuery(query);

    try {
      const results = await searchPlaces(query);
      setSearchResults(results);

      // 검색 결과가 있으면 첫 번째 장소로 지도 이동
      if (results.length > 0) {
        const firstPlace = results[0];
        setMarkerPosition(firstPlace.coordinates.lat, firstPlace.coordinates.lng);
      }
    } catch (error) {
      console.error('Search failed:', error);
      toast({
        title: '검색 실패',
        description: '장소 검색 중 오류가 발생했습니다. 다시 시도해주세요.',
        variant: 'destructive',
      });
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // 장소 선택 처리
  const handlePlaceSelect = (place: Place) => {
    setSelectedPlace(place);
    setMarkerPosition(place.coordinates.lat, place.coordinates.lng);

    // 상세 페이지로 이동
    router.push(`/places/${place.id}`);
  };

  // 검색 결과 닫기
  const handleCloseResults = () => {
    setSearchResults([]);
    setSearchQuery('');
  };

  // 지도 초기화 완료
  const handleMapReady = (map: any) => {
    setMapInstance(map);
  };

  return (
    <div className="relative h-screen w-full">
      {/* 상단 검색 바 */}
      <div className="absolute left-0 right-0 top-0 z-30 p-4">
        <div className="mx-auto max-w-xl">
          <SearchBar
            placeholder="장소를 검색하세요 (예: 시청역 맛집)"
            onSearch={handleSearch}
            isLoading={isSearching}
          />
        </div>
      </div>

      {/* 지도 영역 */}
      <NaverMap
        center={{ lat: 37.5665, lng: 126.9780 }} // 서울 시청 기본 좌표
        zoom={15}
        onMapReady={handleMapReady}
        className="h-full w-full"
      />

      {/* 검색 결과 시트 */}
      <SearchResultSheet
        results={searchResults}
        isVisible={searchResults.length > 0}
        onPlaceSelect={handlePlaceSelect}
        onClose={handleCloseResults}
      />
    </div>
  );
}
```

---

## 5. 라우팅 설계

### 5.1 장소 상세 페이지 경로

**현재 라우트**: `/` (메인 지도 화면)
**이동 경로**: `/places/[placeId]` (장소 상세 화면)

### 5.2 라우트 파라미터

- **placeId**: 장소 고유 ID (네이버 API의 `mapx_mapy` 조합)
  - 예시: `127123456_37123456`

### 5.3 장소 상세 페이지 파일 구조

```
src/app/places/
└── [placeId]/
    └── page.tsx
```

**주의사항**:
- Next.js 15에서 `params`는 Promise로 제공되므로 반드시 `await` 처리 필요
- 예시: `const { placeId } = await props.params;`

---

## 6. 에러 처리

### 6.1 검색 에러

**상황**:
- 네트워크 오류
- 네이버 API 호출 실패
- 환경 변수 누락

**처리 방법**:
1. `try-catch`로 에러 감지
2. 로딩 상태 해제
3. Toast 메시지로 사용자에게 알림
4. 검색 결과를 빈 배열로 초기화

**에러 메시지**:
```
title: "검색 실패"
description: "장소 검색 중 오류가 발생했습니다. 다시 시도해주세요."
variant: "destructive"
```

### 6.2 검색 결과 없음

**상황**:
- API 응답은 성공이지만 결과 배열이 비어있음

**처리 방법**:
1. `SearchResultSheet` 내부에서 `EmptyState` 컴포넌트 표시
2. 사용자에게 검색 결과가 없음을 알림

**메시지**:
```
title: "검색 결과가 없습니다"
description: "다른 키워드로 검색해보세요."
```

### 6.3 지도 초기화 실패

**상황**:
- 네이버 지도 SDK 로드 실패
- 잘못된 Client ID

**처리 방법**:
1. `NaverMap` 컴포넌트 내부에서 `window.naver` 존재 확인
2. 존재하지 않을 경우 에러 메시지 표시

**에러 메시지**:
```
"지도를 불러올 수 없습니다. 페이지를 새로고침해주세요."
```

---

## 7. UX 개선 사항

### 7.1 로딩 상태

1. **검색 중 로딩**
   - SearchBar의 `isLoading` prop 활용
   - 검색 버튼에 스피너 표시
   - 입력 필드 비활성화

2. **지도 초기화 로딩**
   - 지도 로딩 중 스켈레톤 UI 표시 (선택 사항)

### 7.2 애니메이션

1. **검색 결과 시트 등장**
   - 하단에서 위로 슬라이드업 애니메이션
   - Tailwind `transition-transform` 활용

2. **지도 마커 이동**
   - `panTo` 함수의 `duration: 1000` 옵션으로 부드러운 이동

### 7.3 접근성

1. **키보드 네비게이션**
   - 검색 입력 필드는 포커스 가능
   - Enter 키로 검색 실행
   - Tab 키로 결과 목록 탐색

2. **스크린 리더 지원**
   - ARIA 레이블 추가
   - 검색 결과 개수 안내

---

## 8. 성능 최적화

### 8.1 컴포넌트 최적화

1. **useCallback 활용**
   - `handleSearch`, `handlePlaceSelect`, `handleCloseResults` 함수를 `useCallback`으로 메모이제이션

2. **useMemo 활용**
   - 검색 결과 필터링이나 정렬이 필요할 경우 `useMemo` 사용

### 8.2 지도 성능

1. **지도 인스턴스 재사용**
   - `mapInstance` 상태로 지도 인스턴스를 저장하여 재렌더링 방지

2. **마커 최적화**
   - `useMapMarker` Hook을 활용하여 마커 생성/제거 최적화

---

## 9. 테스트 시나리오

### 9.1 기본 플로우

| 테스트 ID | 시나리오 | 기대 결과 |
|-----------|---------|----------|
| TC-MAP-01 | 페이지 진입 시 지도 표시 | 서울 시청 기본 좌표로 지도 표시 |
| TC-MAP-02 | "시청역 맛집" 검색 | 검색 결과 시트에 최대 5개 장소 표시 |
| TC-MAP-03 | 검색 결과에서 장소 선택 | 지도 마커 이동 + 상세 페이지 이동 |
| TC-MAP-04 | 검색 결과 시트 닫기 버튼 클릭 | 검색 결과 시트 닫힘 |
| TC-MAP-05 | 오버레이 외부 클릭 | 검색 결과 시트 닫힘 |

### 9.2 에러 케이스

| 테스트 ID | 시나리오 | 기대 결과 |
|-----------|---------|----------|
| TC-MAP-06 | 빈 문자열 검색 | 검색 실행 안됨 |
| TC-MAP-07 | 존재하지 않는 장소 검색 | "검색 결과가 없습니다" 메시지 표시 |
| TC-MAP-08 | 네트워크 오류 시 검색 | Toast 에러 메시지 표시 |
| TC-MAP-09 | 지도 SDK 로드 실패 | 에러 메시지 표시 |

### 9.3 UX 케이스

| 테스트 ID | 시나리오 | 기대 결과 |
|-----------|---------|----------|
| TC-MAP-10 | 검색 입력 필드에서 Enter 키 입력 | 검색 실행 |
| TC-MAP-11 | 검색 중 검색 버튼 클릭 | 버튼 비활성화 + 스피너 표시 |
| TC-MAP-12 | 검색 결과 첫 번째 장소로 지도 이동 | 부드러운 애니메이션과 함께 지도 이동 |

---

## 10. 의존성 체크리스트

### 10.1 필수 공통 모듈

- [x] `NaverMap` 컴포넌트 (`src/components/map/naver-map.tsx`)
- [x] `SearchBar` 컴포넌트 (`src/components/search/search-bar.tsx`)
- [x] `PlaceCard` 컴포넌트 (`src/components/place/place-card.tsx`)
- [x] `EmptyState` 컴포넌트 (`src/components/common/empty-state.tsx`)
- [x] `useMapMarker` Hook (`src/hooks/use-map-marker.ts`)
- [x] `searchPlaces` API 함수 (`src/lib/api/search.ts`)
- [x] `Place` 타입 정의 (`src/types/place.ts`)
- [x] `useToast` Hook (`src/hooks/use-toast.ts`)

### 10.2 신규 컴포넌트

- [ ] `SearchResultSheet` 컴포넌트 (`src/app/_components/search-result-sheet.tsx`)

### 10.3 환경 변수

- [x] `NEXT_PUBLIC_NCP_MAP_CLIENT_ID`: 네이버 지도 Client ID
- [x] `NCP_MAP_CLIENT_SECRET`: 네이버 검색 API Client Secret (백엔드 전용)

---

## 11. 작업 순서

### Phase 1: 신규 컴포넌트 구현 (30분)

1. `SearchResultSheet` 컴포넌트 작성
   - Props 인터페이스 정의
   - 레이아웃 및 스타일 구현
   - 빈 상태 처리

### Phase 2: 메인 페이지 구현 (1시간)

1. 기존 `src/app/page.tsx` 백업 (필요 시)
2. 새로운 `MapSearchPage` 컴포넌트 구현
   - 상태 관리 설정
   - 검색 로직 구현
   - 장소 선택 로직 구현
3. 레이아웃 구성
   - SearchBar 배치
   - NaverMap 배치
   - SearchResultSheet 배치

### Phase 3: 라우팅 설정 (30분)

1. 장소 상세 페이지 경로 생성 (`src/app/places/[placeId]/page.tsx`)
   - 임시 페이지 구현 (상세 구현은 별도 작업)
2. 라우트 테스트

### Phase 4: 에러 처리 및 UX 개선 (1시간)

1. 에러 처리 로직 추가
2. 로딩 상태 구현
3. Toast 메시지 연동
4. 접근성 개선 (ARIA 레이블, 키보드 네비게이션)

### Phase 5: 테스트 및 검증 (1시간)

1. 기본 플로우 테스트
2. 에러 케이스 테스트
3. UX 케이스 테스트
4. 모바일 반응형 테스트

---

## 12. 주의사항

### 12.1 코드 컨벤션

1. **Client Component 명시**
   - 모든 페이지 및 컴포넌트 최상단에 `'use client';` 지시어 추가

2. **타입 안전성**
   - 모든 Props는 TypeScript 인터페이스로 명시
   - 네이버 지도 타입은 `src/types/naver-maps.d.ts` 참조

3. **에러 처리**
   - 모든 비동기 작업은 `try-catch`로 감싸기
   - 에러 메시지는 사용자 친화적으로 작성

### 12.2 성능

1. **불필요한 리렌더링 방지**
   - `useCallback`, `useMemo` 적절히 활용
   - 상태 업데이트는 최소화

2. **지도 성능**
   - 지도 인스턴스는 한 번만 생성하고 재사용
   - 마커는 `useMapMarker` Hook으로 관리

### 12.3 접근성

1. **키보드 네비게이션**
   - 모든 인터랙티브 요소는 포커스 가능
   - Tab 순서가 자연스럽도록 구성

2. **스크린 리더**
   - ARIA 레이블 추가
   - 의미 있는 HTML 구조 사용 (`button`, `nav` 등)

---

## 13. 향후 확장 가능성

현재 범위에는 포함되지 않지만, 향후 추가 가능한 기능:

1. **검색 이력 저장**
   - localStorage 또는 Zustand를 활용한 검색 이력 저장
   - 자동완성 기능

2. **지도 현재 위치 이동**
   - Geolocation API 활용
   - "내 위치" 버튼 추가

3. **검색 필터**
   - 카테고리별 필터 (음식점, 카페, 관광지 등)
   - 거리순 정렬

4. **즐겨찾기**
   - 장소 북마크 기능
   - 로컬 또는 서버 저장

5. **지도 클러스터링**
   - 검색 결과가 많을 경우 마커 클러스터링

---

## 14. 참고 문서

- **프로젝트 문서**:
  - [PRD](/docs/prd.md)
  - [유저플로우](/docs/userflow.md)
  - [공통 모듈](/docs/common-modules.md)
  - [장소 검색 유스케이스](/docs/usecases/001-place-search.md)

- **외부 문서**:
  - [네이버 지도 SDK 문서](https://navermaps.github.io/maps.js.ncp/)
  - [네이버 검색 API 문서](https://developers.naver.com/docs/serviceapi/search/local/local.md)
  - [Next.js 15 Dynamic Routes](https://nextjs.org/docs/app/building-your-application/routing/dynamic-routes)
  - [React Query 공식 문서](https://tanstack.com/query/latest)

---

**문서 종료**
