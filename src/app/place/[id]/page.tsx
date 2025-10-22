import { Suspense } from 'react';
import PlaceDetailClient from './place-detail-client';

interface PlaceDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{
    name?: string;
    address?: string;
    lat?: string;
    lng?: string;
  }>;
}

export default async function PlaceDetailPage({ params, searchParams }: PlaceDetailPageProps) {
  const { id: placeId } = await params;
  const search = await searchParams;

  const placeInfo = {
    id: placeId,
    name: search?.name || '',
    address: search?.address || '',
    coordinates: {
      lat: search?.lat ? parseFloat(search.lat) : 0,
      lng: search?.lng ? parseFloat(search.lng) : 0,
    },
  };

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PlaceDetailClient placeInfo={placeInfo} />
    </Suspense>
  );
}
