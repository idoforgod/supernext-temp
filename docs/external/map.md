### **Next.js 프로젝트 네이버 지도 연동 최종 가이드 (맛집 리뷰 기능 구현)**

본 문서는 Next.js 풀스택 환경에서 '위치 기반 맛집 리뷰' 기능을 구현하기 위해 네이버 지도 연동에 필요한 모든 정보를 담고 있습니다.

### **1. 연동 대상 확정: SDK와 API 동시 사용**

성공적인 기능 구현을 위해 **지도 SDK (Maps JavaScript API)**와 **웹 서비스 API (지역 검색)**를 함께 사용해야 합니다.

*   **지도 SDK (Maps JavaScript API)**: 사용자에게 보여지는 지도 화면, 마커 표시 등 **프런트엔드(Client-side)**의 모든 시각적 요소를 담당합니다.
*   **웹 서비스 API (지역 검색)**: 사용자가 입력한 검색어로 장소 정보를 조회하는 **백엔드(Server-side)**의 데이터 처리 부분을 담당합니다.

---

### **2. 지도 SDK (Maps JavaScript API) 연동 상세 가이드**

#### 가. 사용할 기능

*   **지도 표시**: 웹 페이지에 인터랙티브한 지도를 렌더링합니다.
*   **마커 표시**: 검색 결과나 저장된 맛집의 위치를 지도 위에 아이콘으로 표시합니다.
*   **좌표 변환**: 네이버의 독자적인 좌표계를 범용적인 위경도 좌표계로 변환하여 사용합니다.

#### 나. 설치 및 세팅 방법

별도의 라이브러리 설치는 필요하지 않으며, Next.js의 `<Script>` 컴포넌트를 사용하여 외부 스크립트를 로드합니다.

1.  **위치**: `app/layout.tsx` 파일
2.  **설정**: `<body>` 태그 내에 아래 `<Script>` 컴포넌트를 추가하여 모든 페이지에서 SDK를 사용할 수 있도록 합니다. `strategy="beforeInteractive"` 옵션은 페이지가 상호작용 가능해지기 전에 스크립트를 실행하여 지도 로딩 시간을 최적화합니다.

    ```tsx
    // app/layout.tsx
    import Script from 'next/script';

    export default function RootLayout({ children }: { children: React.ReactNode }) {
      return (
        <html lang="ko">
          <body>
            {children}
            <Script
              strategy="beforeInteractive"
              src={`https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${process.env.NEXT_PUBLIC_NCP_MAP_CLIENT_ID}`}
            />
          </body>
        </html>
      );
    }
    ```

#### 다. 인증정보 관리 방법

*   **필요한 정보**: **Client ID**
*   **관리 방법**:
    1.  프로젝트 루트에 `.env.local` 파일을 생성합니다.
    2.  아래와 같이 `NEXT_PUBLIC_` 접두사를 붙여 환경 변수를 저장합니다. 이 접두사는 Next.js가 해당 변수를 브라우저 환경에 안전하게 노출시키도록 하는 규칙입니다.

        ```.env.local
        NEXT_PUBLIC_NCP_MAP_CLIENT_ID=여기에_발급받은_Client_ID를_입력하세요
        ```

#### 라. 호출 방법

지도 로직은 반드시 `'use client'` 지시어가 선언된 클라이언트 컴포넌트 내부, 그리고 `useEffect` 훅 안에서 호출해야 합니다.

```tsx
// components/Map.tsx
'use client';

import { useEffect, useRef } from 'react';

export default function Map() {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 지도 스크립트가 로드되었고, 지도를 렌더링할 DOM 요소가 있는지 확인
    if (window.naver && mapRef.current) {
      const location = new window.naver.maps.LatLng(37.3595704, 127.105399); // 초기 위치
      const map = new window.naver.maps.Map(mapRef.current, {
        center: location,
        zoom: 17,
      });

      // 마커 생성 및 표시
      new window.naver.maps.Marker({
        position: location,
        map: map,
      });
    }
  }, []);

  return <div ref={mapRef} style={{ width: '100%', height: '500px' }} />;
}
```

---

### **3. 웹 서비스 API (지역 검색) 연동 상세 가이드**

#### 가. 사용할 기능

*   **장소 검색**: 사용자가 입력한 텍스트 쿼리(예: "강남역 맛집")를 네이버 서버로 보내 장소 이름, 주소, 좌표 등이 포함된 목록을 받아옵니다.

#### 나. 설치 및 세팅 방법

REST API이므로 별도의 설치는 필요 없으며, Next.js의 백엔드 기능(Route Handler)을 통해 HTTP 요청을 보냅니다.

*   **API 주소**: `https://openapi.naver.com`
*   **엔드포인트**: `/v1/search/local.json`
*   **백엔드 파일 생성**: `app/api/search/route.ts` 파일을 생성하여 API 요청 로직을 구현합니다.

#### 다. 인증정보 관리 방법

*   **필요한 정보**: **Client ID**, **Client Secret**
*   **관리 방법**:
    1.  `.env.local` 파일에 인증 정보를 추가합니다.
    2.  **`Client Secret`은 외부에 노출되면 안 되는 민감 정보이므로 절대 `NEXT_PUBLIC_` 접두사를 붙여서는 안 됩니다.**

        ```.env.local
        NEXT_PUBLIC_NCP_MAP_CLIENT_ID=여기에_Client_ID_입력
        NCP_MAP_CLIENT_SECRET=여기에_Client_Secret_입력
        ```

#### 라. 호출 방법

`app/api/search/route.ts` 파일 내에서 `fetch` 함수를 사용해 네이버 API 서버로 요청을 보냅니다. 인증 정보는 HTTP 요청 헤더에 담아 전송합니다.

```ts
// app/api/search/route.ts
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');

  if (!query) {
    return NextResponse.json({ error: 'Query is required' }, { status: 400 });
  }

  // API 요청 URL
  const url = `https://openapi.naver.com/v1/search/local.json?query=${encodeURI(query)}&display=5`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-Naver-Client-Id': process.env.NEXT_PUBLIC_NCP_MAP_CLIENT_ID || '',
        'X-Naver-Client-Secret': process.env.NCP_MAP_CLIENT_SECRET || '',
      },
    });

    if (!response.ok) {
      // API 호출 실패 시 에러 처리
      throw new Error(`API call failed with status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
```

### **4. 최종 요약**

| 구분 | 연동 대상 | 주요 역할 | 필요한 인증 정보 | 구현 위치 (Next.js) |
| :--- | :--- | :--- | :--- | :--- |
| **프런트엔드** | **지도 SDK (Maps JavaScript API)** | 지도/마커 렌더링, 사용자 상호작용 | Client ID | `'use client'` 컴포넌트 (`useEffect` 훅) |
| **백엔드** | **웹 서비스 API (지역 검색)** | 키워드 기반 장소 데이터 조회 | Client ID, Client Secret | Route Handler (`app/api/.../route.ts`) |