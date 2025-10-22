// src/lib/utils/error.ts

// API 에러에서 사용자 친화적인 메시지 추출
export function getErrorMessage(error: unknown, fallback = '오류가 발생했습니다'): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  // Axios 에러 처리 (기존 extractApiErrorMessage 활용)
  return fallback;
}