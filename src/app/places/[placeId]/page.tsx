'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PlaceDetailPageProps {
  params: Promise<{ placeId: string }>;
}

export default function PlaceDetailPage({ params }: PlaceDetailPageProps) {
  const router = useRouter();
  const [placeId, setPlaceId] = useState<string | null>(null);

  useEffect(() => {
    params.then((resolvedParams) => {
      setPlaceId(resolvedParams.placeId);
    });
  }, [params]);

  if (!placeId) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg text-muted-foreground">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-4xl">
        {/* 헤더 */}
        <div className="mb-6 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            aria-label="뒤로 가기"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">장소 상세 정보</h1>
        </div>

        {/* 임시 콘텐츠 */}
        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-md">
          <p className="text-muted-foreground">
            장소 ID: <span className="font-mono text-foreground">{placeId}</span>
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            상세 정보 화면은 별도로 구현 예정입니다.
          </p>
        </div>
      </div>
    </div>
  );
}
