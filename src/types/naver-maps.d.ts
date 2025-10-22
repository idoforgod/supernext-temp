// src/types/naver-maps.d.ts

declare global {
  interface Window {
    naver: {
      maps: {
        LatLng: new (lat: number, lng: number) => NaverLatLng;
        Map: new (
          element: HTMLElement,
          options: NaverMapOptions
        ) => NaverMap;
        Marker: new (options: NaverMarkerOptions) => NaverMarker;
      };
    };
  }
}

interface NaverLatLng {
  lat(): number;
  lng(): number;
}

interface NaverMapOptions {
  center: NaverLatLng;
  zoom: number;
}

interface NaverMap {
  setCenter(center: NaverLatLng): void;
  setZoom(level: number): void;
  panTo(center: NaverLatLng, options?: { duration?: number }): void;
}

interface NaverMarkerOptions {
  position: NaverLatLng;
  map: NaverMap;
  title?: string;
}

interface NaverMarker {
  setPosition(position: NaverLatLng): void;
  setMap(map: NaverMap | null): void;
}

export {};