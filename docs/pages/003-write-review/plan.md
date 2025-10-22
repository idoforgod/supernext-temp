# 리뷰 작성 화면 구현 계획

**문서 버전**: 1.0
**작성일**: 2025-10-23
**기준 문서**: prd.md, userflow.md, usecases/write-review.md, common-modules.md

---

## 1. 개요

### 1.1 목적

사용자가 장소 상세 정보 화면에서 리뷰 작성 화면으로 진입하여, 작성자 정보, 별점, 리뷰 내용, 비밀번호를 입력하고 리뷰를 등록할 수 있는 폼 화면을 구현합니다.

### 1.2 범위

**포함 사항**:
- 리뷰 작성 폼 화면 (`/place/[id]/write-review`)
- 작성자 이메일, 별점, 리뷰 내용, 비밀번호 입력 필드
- react-hook-form을 활용한 폼 검증 및 상태 관리
- 기존 StarRating 컴포넌트 활용
- useCreateReview Hook을 통한 API 요청
- 성공 시 이전 페이지로 자동 이동 및 토스트 메시지 표시
- 에러 처리 및 로딩 상태 관리

**제외 사항**:
- 리뷰 수정 및 삭제 기능 (별도 유스케이스)
- 이미지 첨부 기능
- 리뷰 신고 기능

### 1.3 참조 문서

- **PRD**: `docs/prd.md` - 리뷰 작성 기능 명세
- **유스케이스**: `docs/usecases/write-review.md` - 상세 플로우 및 예외 처리
- **공통 모듈**: `docs/common-modules.md` - StarRating 컴포넌트, useCreateReview Hook
- **유저플로우**: `docs/userflow.md` - 리뷰 작성 플로우

---

## 2. 기존 구현 확인

### 2.1 이미 구현된 공통 모듈

#### 2.1.1 리뷰 스키마 및 타입 정의

**파일**: `src/features/review/backend/schema.ts`

```typescript
// 이미 구현됨
export const createReviewSchema = z.object({
  place_id: z.string().min(1, '장소 ID는 필수입니다'),
  author_nickname: z.string().min(1, '작성자 정보는 필수입니다'),
  rating: z.number().int().min(1).max(5, '평점은 1~5 사이여야 합니다'),
  content: z.string().min(10, '리뷰는 최소 10자 이상이어야 합니다').max(1000, '리뷰는 최대 1000자까지 작성 가능합니다'),
  password: z.string().regex(/^\d{4}$/, '비밀번호는 4자리 숫자여야 합니다'),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
```

**활용 방법**:
- react-hook-form의 zodResolver와 함께 사용하여 폼 검증
- 클라이언트 측에서 동일 스키마로 타입 안전성 보장

#### 2.1.2 리뷰 생성 Hook

**파일**: `src/features/review/hooks/use-reviews.ts`

```typescript
// 이미 구현됨
export function useCreateReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createReview,
    onSuccess: (newReview) => {
      queryClient.invalidateQueries({
        queryKey: ['reviews', newReview.place_id],
      });
    },
  });
}
```

**활용 방법**:
- 폼 제출 시 `mutate()` 함수 호출
- `isLoading`, `isError`, `error` 상태를 활용하여 UI 피드백 제공
- 성공 시 자동으로 리뷰 목록 캐시 무효화

#### 2.1.3 StarRating 컴포넌트

**파일**: `src/components/rating/star-rating.tsx`

```typescript
// 이미 구현됨
interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  readOnly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}
```

**활용 방법**:
- 평점 선택 UI로 직접 사용
- react-hook-form의 Controller와 함께 사용하여 폼 상태 통합

### 2.2 사용 가능한 Shadcn-UI 컴포넌트

**확인된 컴포넌트**:
- `Input` - 작성자 이메일 입력
- `Textarea` - 리뷰 내용 입력
- `Button` - 등록 버튼
- `Label` - 필드 레이블
- `Form` - react-hook-form 통합 컴포넌트
- `Card` - 폼 컨테이너 (선택적)
- `Toast/Toaster` - 성공/실패 메시지

**추가 필요 여부**: 모든 필요한 컴포넌트가 이미 설치됨

---

## 3. 페이지 구조 설계

### 3.1 라우팅 구조

**URL 패턴**: `/place/[id]/write-review`

**파일 경로**: `src/app/place/[id]/write-review/page.tsx`

**페이지 타입**: Client Component (`"use client"`)

**Props**:
```typescript
interface WriteReviewPageProps {
  params: Promise<{ id: string }>;
}
```

### 3.2 컴포넌트 계층 구조

```
WriteReviewPage (page.tsx)
├── WriteReviewHeader (헤더 영역)
│   ├── 뒤로가기 버튼
│   └── 페이지 제목 ("리뷰 작성")
│
└── ReviewForm (리뷰 작성 폼)
    ├── FormField: 작성자 이메일
    │   ├── Label
    │   ├── Input
    │   └── ErrorMessage
    │
    ├── FormField: 평점 선택
    │   ├── Label
    │   ├── StarRating (공통 컴포넌트)
    │   └── ErrorMessage
    │
    ├── FormField: 리뷰 내용
    │   ├── Label
    │   ├── Textarea
    │   ├── 글자 수 카운터
    │   └── ErrorMessage
    │
    ├── FormField: 비밀번호
    │   ├── Label
    │   ├── Input (type="password", inputMode="numeric")
    │   ├── 안내 문구
    │   └── ErrorMessage
    │
    └── SubmitButton
        ├── 등록하기 버튼
        └── 로딩 스피너
```

### 3.3 상태 관리 전략

**폼 상태**: react-hook-form으로 관리
- `useForm<CreateReviewInput>` + `zodResolver(createReviewSchema)`
- 실시간 검증 모드: `mode: 'onChange'`
- 재검증 모드: `reValidateMode: 'onChange'`

**서버 상태**: React Query (useCreateReview Hook)
- 로딩 상태: `isPending`
- 에러 상태: `isError`, `error`
- 성공 핸들러: 토스트 메시지 + 페이지 이동

**로컬 상태**: 없음 (모든 상태는 react-hook-form에서 관리)

---

## 4. 단계별 구현 계획

### 4.1 Phase 1: 페이지 기본 구조 생성

**작업 내용**:
1. `src/app/place/[id]/write-review/page.tsx` 파일 생성
2. 기본 레이아웃 구조 작성 (헤더 + 폼 컨테이너)
3. 뒤로가기 버튼 구현 (`useRouter().back()`)

**예상 코드 구조**:
```typescript
'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default async function WriteReviewPage({
  params,
}: WriteReviewPageProps) {
  const { id: placeId } = await params;
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="sticky top-0 z-50 bg-white border-b">
        <div className="flex items-center px-4 py-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="ml-2 text-lg font-semibold">리뷰 작성</h1>
        </div>
      </header>

      {/* 폼 영역 */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* ReviewForm 컴포넌트가 여기에 들어감 */}
      </main>
    </div>
  );
}
```

### 4.2 Phase 2: 리뷰 폼 컴포넌트 구현

**파일**: `src/features/review/components/review-form.tsx` (새로 생성)

**Props**:
```typescript
interface ReviewFormProps {
  placeId: string;
  onSuccess?: () => void;
}
```

**구현 내용**:
1. react-hook-form 설정
2. 각 입력 필드 구현
3. 폼 제출 핸들러
4. 로딩 및 에러 처리

**코드 구조**:
```typescript
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createReviewSchema, type CreateReviewInput } from '../backend/schema';
import { useCreateReview } from '../hooks/use-reviews';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export default function ReviewForm({ placeId, onSuccess }: ReviewFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { mutate: createReview, isPending } = useCreateReview();

  const form = useForm<CreateReviewInput>({
    resolver: zodResolver(createReviewSchema),
    mode: 'onChange',
    defaultValues: {
      place_id: placeId,
      author_nickname: '',
      rating: 0,
      content: '',
      password: '',
    },
  });

  const onSubmit = (data: CreateReviewInput) => {
    createReview(data, {
      onSuccess: () => {
        toast({
          title: '리뷰가 등록되었습니다',
          description: '소중한 의견 감사합니다.',
        });
        onSuccess?.();
        router.back();
      },
      onError: (error) => {
        toast({
          variant: 'destructive',
          title: '리뷰 등록 실패',
          description: error.message || '잠시 후 다시 시도해주세요.',
        });
      },
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* 필드 구현 */}
    </form>
  );
}
```

### 4.3 Phase 3: 작성자 이메일 필드 구현

**작업 내용**:
- Shadcn-UI Form 컴포넌트 활용
- FormField, FormItem, FormLabel, FormControl, FormMessage 사용
- Input 컴포넌트 연결

**코드 구조**:
```tsx
<FormField
  control={form.control}
  name="author_nickname"
  render={({ field }) => (
    <FormItem>
      <FormLabel>
        작성자 (닉네임 또는 이메일) <span className="text-red-500">*</span>
      </FormLabel>
      <FormControl>
        <Input
          {...field}
          type="text"
          placeholder="예: hong@example.com"
          autoComplete="email"
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

### 4.4 Phase 4: 별점 선택 필드 구현

**작업 내용**:
- StarRating 컴포넌트를 react-hook-form Controller와 통합
- 미선택 상태 시 에러 메시지 표시

**코드 구조**:
```tsx
<FormField
  control={form.control}
  name="rating"
  render={({ field }) => (
    <FormItem>
      <FormLabel>
        평점 <span className="text-red-500">*</span>
      </FormLabel>
      <FormControl>
        <div className="flex items-center gap-2">
          <StarRating
            value={field.value}
            onChange={field.onChange}
            size="lg"
          />
          {field.value > 0 && (
            <span className="text-sm text-muted-foreground">
              ({field.value}점)
            </span>
          )}
        </div>
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

### 4.5 Phase 5: 리뷰 내용 입력 필드 구현

**작업 내용**:
- Textarea 컴포넌트 사용
- 실시간 글자 수 카운터 표시
- 최소/최대 글자 수 제한 안내

**코드 구조**:
```tsx
<FormField
  control={form.control}
  name="content"
  render={({ field }) => (
    <FormItem>
      <FormLabel>
        리뷰 내용 <span className="text-red-500">*</span>
      </FormLabel>
      <FormControl>
        <Textarea
          {...field}
          placeholder="이 장소에 대한 솔직한 리뷰를 작성해주세요. (최소 10자, 최대 1000자)"
          rows={5}
        />
      </FormControl>
      <div className="flex justify-between items-center text-xs text-muted-foreground">
        <span>최소 10자 이상, 최대 1000자 이하</span>
        <span className={field.value.length > 1000 ? 'text-red-500' : ''}>
          {field.value.length} / 1000자
        </span>
      </div>
      <FormMessage />
    </FormItem>
  )}
/>
```

### 4.6 Phase 6: 비밀번호 입력 필드 구현

**작업 내용**:
- Input 컴포넌트에 `type="password"`, `inputMode="numeric"` 설정
- 4자리 숫자 검증
- 안내 문구 표시

**코드 구조**:
```tsx
<FormField
  control={form.control}
  name="password"
  render={({ field }) => (
    <FormItem>
      <FormLabel>
        비밀번호 (리뷰 수정/삭제 시 사용) <span className="text-red-500">*</span>
      </FormLabel>
      <FormControl>
        <Input
          {...field}
          type="password"
          inputMode="numeric"
          placeholder="4자리 숫자를 입력하세요"
          maxLength={4}
        />
      </FormControl>
      <p className="text-xs text-muted-foreground">
        입력하신 비밀번호는 리뷰 수정 및 삭제 시 사용됩니다.
      </p>
      <FormMessage />
    </FormItem>
  )}
/>
```

### 4.7 Phase 7: 등록 버튼 구현

**작업 내용**:
- 로딩 상태 시 스피너 표시 및 버튼 비활성화
- 폼 유효성 검사 실패 시 비활성화

**코드 구조**:
```tsx
<div className="pt-4">
  <Button
    type="submit"
    className="w-full"
    disabled={isPending || !form.formState.isValid}
  >
    {isPending ? (
      <>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        등록 중...
      </>
    ) : (
      '등록하기'
    )}
  </Button>
</div>
```

### 4.8 Phase 8: 작성 중 이탈 방지 (선택적)

**작업 내용**:
- react-hook-form의 `formState.isDirty` 활용
- 뒤로가기 시 확인 다이얼로그 표시

**구현 방법**:
```typescript
useEffect(() => {
  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    if (form.formState.isDirty && !form.formState.isSubmitSuccessful) {
      e.preventDefault();
      e.returnValue = '';
    }
  };

  window.addEventListener('beforeunload', handleBeforeUnload);
  return () => window.removeEventListener('beforeunload', handleBeforeUnload);
}, [form.formState.isDirty, form.formState.isSubmitSuccessful]);
```

**주의**: 브라우저 내장 다이얼로그만 가능, 커스텀 메시지는 불가

---

## 5. 에러 처리 전략

### 5.1 클라이언트 측 검증 에러

**처리 방법**:
- react-hook-form이 자동으로 처리
- FormMessage 컴포넌트가 에러 메시지 표시
- createReviewSchema의 에러 메시지 그대로 사용

**예시**:
- "작성자 정보는 필수입니다"
- "평점은 1~5 사이여야 합니다"
- "리뷰는 최소 10자 이상이어야 합니다"
- "비밀번호는 4자리 숫자여야 합니다"

### 5.2 서버 측 에러

**처리 방법**:
- useCreateReview Hook의 `onError` 콜백에서 처리
- Toast 메시지로 사용자에게 피드백
- 폼은 그대로 유지 (입력 데이터 보존)

**에러 타입별 메시지**:
- 네트워크 에러: "네트워크 연결을 확인하고 다시 시도해주세요."
- 서버 에러 (500): "서버 오류로 리뷰를 등록하지 못했습니다. 잠시 후 다시 시도해주세요."
- 검증 실패 (400): 서버에서 반환한 에러 메시지 사용
- 중복 리뷰 (429): "이미 이 장소에 리뷰를 작성하셨습니다. 잠시 후 다시 시도해주세요."

### 5.3 에러 메시지 우선순위

1. **필드별 검증 에러**: FormMessage로 각 필드 하단에 표시
2. **폼 제출 에러**: Toast 메시지로 화면 상단에 표시
3. **네트워크 에러**: Toast 메시지 + 재시도 안내

---

## 6. UI/UX 세부 사항

### 6.1 레이아웃

**모바일 우선 설계**:
- 최대 너비: `max-w-2xl` (768px)
- 패딩: `px-4` (모바일), `px-6` (태블릿 이상)
- 간격: `space-y-6` (필드 간 24px)

**헤더**:
- Sticky 포지션: `sticky top-0 z-50`
- 배경: 불투명 흰색 + 하단 보더
- 높이: `h-14` (56px)

**폼 컨테이너**:
- 배경: 흰색 카드 (선택적)
- 패딩: `p-6`
- Border radius: `rounded-xl`

### 6.2 접근성 (Accessibility)

**키보드 네비게이션**:
- Tab 키로 필드 간 이동
- Enter 키로 폼 제출
- Escape 키로 뒤로가기 (선택적)

**스크린 리더 지원**:
- 모든 입력 필드에 Label 연결
- 필수 필드 표시: `<span className="text-red-500">*</span>`
- 에러 메시지 ARIA 속성 자동 적용 (Shadcn-UI Form)

**포커스 인디케이터**:
- Shadcn-UI 기본 스타일 사용
- `focus-visible:ring-2 focus-visible:ring-primary`

### 6.3 반응형 디자인

**모바일 (< 768px)**:
- 전체 너비 사용
- 패딩 최소화
- 큰 터치 영역 (최소 44x44px)

**태블릿 이상 (>= 768px)**:
- 중앙 정렬 컨테이너
- 여백 증가
- 폼 너비 제한 (max-w-2xl)

### 6.4 인터랙션 디테일

**별점 선택**:
- hover 시 별 크기 확대 (`hover:scale-110`)
- transition 적용 (`transition-transform`)
- 선택된 별 색상: 노란색 (`fill-yellow-400`)

**글자 수 카운터**:
- 실시간 업데이트
- 1000자 초과 시 빨간색 표시
- 오른쪽 정렬

**등록 버튼**:
- 전체 너비 (`w-full`)
- 로딩 시 스피너 표시 (Loader2 아이콘)
- 비활성 상태: 반투명 처리
- transition 적용 (`transition-all duration-200`)

---

## 7. 테스트 시나리오

### 7.1 정상 플로우

1. **페이지 진입**:
   - URL: `/place/123/write-review`
   - 헤더에 "리뷰 작성" 제목 표시
   - 뒤로가기 버튼 표시
   - 빈 폼 표시

2. **데이터 입력**:
   - 작성자: "hong@example.com" 입력
   - 평점: 5점 선택 (별 5개 클릭)
   - 내용: "정말 맛있었어요. 강력 추천합니다!" (20자) 입력
   - 비밀번호: "1234" 입력

3. **폼 제출**:
   - "등록하기" 버튼 클릭
   - 로딩 스피너 표시
   - 버튼 비활성화

4. **성공 처리**:
   - Toast 메시지: "리뷰가 등록되었습니다"
   - 이전 페이지로 자동 이동
   - 장소 상세 페이지에서 새 리뷰 확인

### 7.2 검증 실패 케이스

**작성자 누락**:
- 입력: 빈 값
- 결과: "작성자 정보는 필수입니다" 메시지 표시
- 위치: 작성자 필드 하단

**평점 미선택**:
- 입력: 별점 0점 (선택 안 함)
- 결과: "평점은 1~5 사이여야 합니다" 메시지 표시
- 위치: 평점 필드 하단

**리뷰 내용 부족**:
- 입력: "좋아요" (3자)
- 결과: "리뷰는 최소 10자 이상이어야 합니다" 메시지 표시
- 위치: 리뷰 내용 필드 하단

**리뷰 내용 초과**:
- 입력: 1001자
- 결과: "리뷰는 최대 1000자까지 작성 가능합니다" 메시지 표시
- 글자 수 카운터 빨간색 표시

**비밀번호 형식 오류**:
- 입력: "12" (2자리) 또는 "abcd" (문자)
- 결과: "비밀번호는 4자리 숫자여야 합니다" 메시지 표시
- 위치: 비밀번호 필드 하단

### 7.3 서버 에러 케이스

**네트워크 오류**:
- 시나리오: 인터넷 연결 끊김
- 결과: Toast 메시지 "네트워크 연결을 확인하고 다시 시도해주세요."
- 폼 데이터 보존

**서버 오류 (500)**:
- 시나리오: 데이터베이스 저장 실패
- 결과: Toast 메시지 "서버 오류로 리뷰를 등록하지 못했습니다. 잠시 후 다시 시도해주세요."
- 폼 데이터 보존

**중복 리뷰 (429)**:
- 시나리오: 5분 이내 동일 장소 재작성
- 결과: Toast 메시지 "이미 이 장소에 리뷰를 작성하셨습니다. 잠시 후 다시 시도해주세요."
- 폼 데이터 보존

---

## 8. 파일 구조 정리

### 8.1 생성할 파일 목록

```
src/
├── app/
│   └── place/
│       └── [id]/
│           └── write-review/
│               └── page.tsx          # 리뷰 작성 페이지
│
└── features/
    └── review/
        └── components/
            └── review-form.tsx       # 리뷰 작성 폼 컴포넌트
```

### 8.2 기존 파일 활용

**공통 컴포넌트**:
- `src/components/rating/star-rating.tsx` - 별점 선택
- `src/components/ui/form.tsx` - react-hook-form 통합
- `src/components/ui/input.tsx` - 텍스트 입력
- `src/components/ui/textarea.tsx` - 다중 라인 입력
- `src/components/ui/button.tsx` - 버튼
- `src/components/ui/label.tsx` - 레이블
- `src/components/ui/toast.tsx` - 토스트 메시지

**백엔드 리소스**:
- `src/features/review/backend/schema.ts` - 스키마 및 타입
- `src/features/review/hooks/use-reviews.ts` - useCreateReview Hook
- `src/features/review/lib/api.ts` - API 클라이언트 함수

---

## 9. 개발 우선순위

### 9.1 필수 구현 (MVP)

**우선순위 1 (핵심 기능)**:
- [ ] 리뷰 작성 페이지 라우팅 (`page.tsx`)
- [ ] 리뷰 폼 컴포넌트 기본 구조 (`review-form.tsx`)
- [ ] react-hook-form 설정 및 검증
- [ ] 작성자, 평점, 내용, 비밀번호 필드 구현
- [ ] 폼 제출 및 API 연동
- [ ] 성공 시 페이지 이동 및 토스트 메시지

**우선순위 2 (UX 개선)**:
- [ ] 로딩 상태 처리
- [ ] 에러 메시지 표시
- [ ] 글자 수 카운터
- [ ] 뒤로가기 버튼

### 9.2 선택적 개선 사항

**우선순위 3 (추가 기능)**:
- [ ] 작성 중 이탈 방지 (beforeunload 이벤트)
- [ ] 자동 저장 (localStorage)
- [ ] 키보드 단축키 (Escape로 취소)
- [ ] 애니메이션 효과
- [ ] 카드 컨테이너 스타일링

---

## 10. 코딩 가이드라인 준수 사항

### 10.1 프로젝트 규칙

**Client Component 사용**:
- 모든 페이지와 컴포넌트에 `"use client"` 지시어 추가

**Promise Props 처리**:
- page.tsx의 params는 Promise로 처리: `await params`

**HTTP 요청 라우팅**:
- 모든 API 호출은 `@/lib/remote/api-client` 를 통해 라우팅
- 이미 구현된 `createReview` 함수 사용

**Hono 라우트 경로**:
- 백엔드는 이미 구현되어 있음 (`POST /api/reviews`)
- 클라이언트에서는 Hook만 사용

### 10.2 라이브러리 활용

**폼 관리**: react-hook-form + zod
**상태 관리**: React Query (useCreateReview)
**UI 컴포넌트**: Shadcn-UI
**아이콘**: lucide-react
**날짜 포맷**: date-fns (필요 시)
**유틸리티**: es-toolkit (필요 시)

### 10.3 코드 스타일

**함수형 프로그래밍**:
- Pure Functions 지향
- Immutability 유지
- Early Returns 활용

**타입 안전성**:
- TypeScript strict mode
- Zod 스키마 활용
- 타입 추론 최대화

**가독성**:
- 명확한 변수명
- 짧은 함수 (한 가지 역할만)
- 주석보다 명확한 코드

---

## 11. 예상 소요 시간

**Phase 1**: 페이지 기본 구조 (30분)
**Phase 2**: 리뷰 폼 컴포넌트 골격 (30분)
**Phase 3-6**: 입력 필드 구현 (각 30분, 총 2시간)
**Phase 7**: 등록 버튼 및 제출 로직 (30분)
**Phase 8**: 에러 처리 및 테스트 (1시간)

**총 예상 시간**: 약 5시간

---

## 12. 주의사항

### 12.1 보안

**비밀번호 처리**:
- 클라이언트에서는 평문으로 전송
- 백엔드에서 bcrypt 해시 처리 (이미 구현됨)
- HTTPS 필수 (프로덕션 환경)

**입력 검증**:
- 클라이언트 측: react-hook-form + zod
- 서버 측: Hono + zod (이미 구현됨)
- 이중 검증으로 보안 강화

### 12.2 성능

**폼 검증 모드**:
- `mode: 'onChange'` 사용으로 실시간 피드백
- 과도한 리렌더링 방지를 위해 `reValidateMode` 조정 가능

**API 요청 최적화**:
- React Query의 캐싱 활용
- 중복 요청 방지 (isLoading 체크)

### 12.3 접근성

**필수 요구사항**:
- 모든 입력 필드에 Label 연결
- 키보드 네비게이션 지원
- 에러 메시지 ARIA 속성
- 터치 영역 최소 44x44px

---

## 13. 구현 후 체크리스트

### 13.1 기능 동작 확인

- [ ] 페이지 진입 시 빈 폼 표시
- [ ] 작성자 입력 필드 동작
- [ ] 별점 선택 동작 (1~5점)
- [ ] 리뷰 내용 입력 및 글자 수 카운터 표시
- [ ] 비밀번호 입력 (숫자 키패드, 마스킹)
- [ ] 유효성 검증 실패 시 에러 메시지 표시
- [ ] 폼 제출 시 로딩 상태 표시
- [ ] 성공 시 토스트 메시지 및 페이지 이동
- [ ] 실패 시 에러 토스트 및 폼 데이터 보존
- [ ] 뒤로가기 버튼 동작

### 13.2 UI/UX 검증

- [ ] 모바일 반응형 레이아웃
- [ ] 태블릿/데스크톱 레이아웃
- [ ] 터치 영역 크기 (최소 44x44px)
- [ ] 키보드 네비게이션 (Tab, Enter)
- [ ] 포커스 인디케이터 표시
- [ ] 별점 hover 효과
- [ ] 버튼 hover/active 효과
- [ ] 로딩 스피너 애니메이션

### 13.3 에러 케이스 테스트

- [ ] 작성자 누락 에러
- [ ] 평점 미선택 에러
- [ ] 리뷰 내용 최소 글자 수 에러
- [ ] 리뷰 내용 최대 글자 수 에러
- [ ] 비밀번호 형식 에러 (2자리, 문자)
- [ ] 네트워크 오류 처리
- [ ] 서버 오류 (500) 처리
- [ ] 중복 리뷰 (429) 처리

### 13.4 접근성 검증

- [ ] 스크린 리더 호환성
- [ ] 키보드만으로 모든 기능 사용 가능
- [ ] 에러 메시지 ARIA 속성
- [ ] 필수 필드 시각적 표시 (*)
- [ ] 색상 대비 WCAG AA 준수

---

## 14. 참고 코드 예시

### 14.1 완성된 ReviewForm 컴포넌트 구조

```typescript
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { createReviewSchema, type CreateReviewInput } from '../backend/schema';
import { useCreateReview } from '../hooks/use-reviews';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import StarRating from '@/components/rating/star-rating';

interface ReviewFormProps {
  placeId: string;
  onSuccess?: () => void;
}

export default function ReviewForm({ placeId, onSuccess }: ReviewFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { mutate: createReview, isPending } = useCreateReview();

  const form = useForm<CreateReviewInput>({
    resolver: zodResolver(createReviewSchema),
    mode: 'onChange',
    defaultValues: {
      place_id: placeId,
      author_nickname: '',
      rating: 0,
      content: '',
      password: '',
    },
  });

  const onSubmit = (data: CreateReviewInput) => {
    createReview(data, {
      onSuccess: () => {
        toast({
          title: '리뷰가 등록되었습니다',
          description: '소중한 의견 감사합니다.',
        });
        onSuccess?.();
        router.back();
      },
      onError: (error) => {
        toast({
          variant: 'destructive',
          title: '리뷰 등록 실패',
          description: error.message || '잠시 후 다시 시도해주세요.',
        });
      },
    });
  };

  const contentLength = form.watch('content').length;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* 작성자 필드 */}
        <FormField
          control={form.control}
          name="author_nickname"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                작성자 (닉네임 또는 이메일) <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="text"
                  placeholder="예: hong@example.com"
                  autoComplete="email"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 평점 필드 */}
        <FormField
          control={form.control}
          name="rating"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                평점 <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <div className="flex items-center gap-2">
                  <StarRating
                    value={field.value}
                    onChange={field.onChange}
                    size="lg"
                  />
                  {field.value > 0 && (
                    <span className="text-sm text-muted-foreground">
                      ({field.value}점)
                    </span>
                  )}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 리뷰 내용 필드 */}
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                리뷰 내용 <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="이 장소에 대한 솔직한 리뷰를 작성해주세요. (최소 10자, 최대 1000자)"
                  rows={5}
                />
              </FormControl>
              <div className="flex justify-between items-center text-xs text-muted-foreground">
                <span>최소 10자 이상, 최대 1000자 이하</span>
                <span className={contentLength > 1000 ? 'text-red-500' : ''}>
                  {contentLength} / 1000자
                </span>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 비밀번호 필드 */}
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                비밀번호 (리뷰 수정/삭제 시 사용){' '}
                <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="password"
                  inputMode="numeric"
                  placeholder="4자리 숫자를 입력하세요"
                  maxLength={4}
                />
              </FormControl>
              <p className="text-xs text-muted-foreground">
                입력하신 비밀번호는 리뷰 수정 및 삭제 시 사용됩니다.
              </p>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 등록 버튼 */}
        <div className="pt-4">
          <Button
            type="submit"
            className="w-full"
            disabled={isPending || !form.formState.isValid}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                등록 중...
              </>
            ) : (
              '등록하기'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
```

---

## 15. 마무리

### 15.1 구현 완료 후 확인 사항

- [ ] 코드 리뷰 완료
- [ ] 유닛 테스트 작성 (선택적)
- [ ] E2E 테스트 작성 (선택적)
- [ ] 문서 업데이트
- [ ] Git 커밋 및 PR 생성

### 15.2 향후 개선 가능성

**Phase 2 기능**:
- 리뷰 수정 기능 (비밀번호 검증)
- 리뷰 삭제 기능 (비밀번호 검증)
- 리뷰 이미지 첨부
- 리뷰 임시 저장 (localStorage)

**UX 개선**:
- 애니메이션 효과 (Framer Motion)
- 다크 모드 지원
- 오프라인 지원 (Service Worker)
- 리뷰 작성 가이드 툴팁

---

**문서 종료**
