'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ReviewForm from '@/features/review/components/review-form';

interface WriteReviewPageProps {
  params: Promise<{ id: string }>;
}

export default function WriteReviewPage({ params }: WriteReviewPageProps) {
  const { id: placeId } = use(params);
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
            aria-label="뒤로가기"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="ml-2 text-lg font-semibold">리뷰 작성</h1>
        </div>
      </header>

      {/* 폼 영역 */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        <ReviewForm placeId={placeId} />
      </main>
    </div>
  );
}
