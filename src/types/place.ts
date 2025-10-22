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