'use client';

import { useEffect, useRef } from 'react';

interface NaverMapProps {
  center?: { lat: number; lng: number }; // 초기 중심 좌표
  zoom?: number; // 초기 줌 레벨 (기본값: 17)
  onMapReady?: (map: NaverMap) => void; // 지도 초기화 완료 콜백
  className?: string;
}

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