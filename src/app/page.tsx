'use client';

import { useState, useCallback } from 'react';
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
  const [mapInstance, setMapInstance] = useState<naver.maps.Map | null>(null);
  const { setMarkerPosition } = useMapMarker({ map: mapInstance });

  // 검색 처리
  const handleSearch = useCallback(async (query: string) => {
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
  }, [setMarkerPosition, toast]);

  // 장소 선택 처리
  const handlePlaceSelect = useCallback((place: Place) => {
    setSelectedPlace(place);
    setMarkerPosition(place.coordinates.lat, place.coordinates.lng);

    // 상세 페이지로 이동
    router.push(`/places/${place.id}`);
  }, [setMarkerPosition, router]);

  // 검색 결과 닫기
  const handleCloseResults = useCallback(() => {
    setSearchResults([]);
    setSearchQuery('');
  }, []);

  // 지도 초기화 완료
  const handleMapReady = useCallback((map: naver.maps.Map) => {
    setMapInstance(map);
  }, []);

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
