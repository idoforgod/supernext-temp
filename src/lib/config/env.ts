// src/lib/config/env.ts
import { z } from 'zod';

const envSchema = z.object({
  // 네이버 지도/검색 API
  NEXT_PUBLIC_NCP_MAP_CLIENT_ID: z.string().min(1, 'Naver Client ID is required'),
  NCP_MAP_CLIENT_SECRET: z.string().min(1, 'Naver Client Secret is required'),

  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('Invalid Supabase URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'Supabase Anon Key is required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'Supabase Service Role Key is required'),
});

export function validateEnv() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('Environment validation failed:', result.error.format());
    throw new Error('Missing or invalid environment variables');
  }

  return result.data;
}