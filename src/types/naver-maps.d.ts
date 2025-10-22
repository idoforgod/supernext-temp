// src/types/naver-maps.d.ts

declare global {
  namespace naver {
    namespace maps {
      class LatLng {
        constructor(lat: number, lng: number);
        lat(): number;
        lng(): number;
      }

      interface MapOptions {
        center: LatLng;
        zoom: number;
      }

      class Map {
        constructor(element: HTMLElement, options: MapOptions);
        setCenter(center: LatLng): void;
        setZoom(level: number): void;
        panTo(center: LatLng, options?: { duration?: number }): void;
      }

      interface MarkerOptions {
        position: LatLng;
        map: Map;
        title?: string;
      }

      class Marker {
        constructor(options: MarkerOptions);
        setPosition(position: LatLng): void;
        setMap(map: Map | null): void;
      }
    }
  }

  interface Window {
    naver: typeof naver;
  }
}

export {};