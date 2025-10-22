'use client';

import { useRef, useCallback } from 'react';

interface UseMapMarkerOptions {
  map: NaverMap | null;
}

interface UseMapMarkerReturn {
  marker: NaverMarker | null;
  setMarkerPosition: (lat: number, lng: number) => void;
  removeMarker: () => void;
}

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