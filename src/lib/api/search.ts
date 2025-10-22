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