import { NextResponse } from 'next/server';
import { validateEnv } from '@/lib/config/env';

export async function GET(request: Request) {
  // 환경 변수 검증
  const env = validateEnv();

  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');

  // 1. 입력 검증
  if (!query) {
    return NextResponse.json(
      { error: { code: 'MISSING_QUERY', message: 'Query parameter is required' } },
      { status: 400 }
    );
  }

  // 2. 환경 변수 확인
  const clientId = env.NEXT_PUBLIC_NCP_MAP_CLIENT_ID;
  const clientSecret = env.NCP_MAP_CLIENT_SECRET;

  // 3. 네이버 API 호출
  const url = `https://openapi.naver.com/v1/search/local.json?query=${encodeURI(query)}&display=5`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-Naver-Client-Id': clientId,
        'X-Naver-Client-Secret': clientSecret,
      },
    });

    if (!response.ok) {
      throw new Error(`Naver API error: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: { code: 'API_ERROR', message: 'Failed to fetch search results' } },
      { status: 500 }
    );
  }
}