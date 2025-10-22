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
