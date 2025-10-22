'use client';

import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { MapPin, Phone } from 'lucide-react';
import type { Place } from '@/types/place';

interface PlaceCardProps {
  place: Place;
  onClick?: () => void;
}

export default function PlaceCard({ place, onClick }: PlaceCardProps) {
  return (
    <Card
      className="cursor-pointer hover:shadow-lg transition-shadow"
      onClick={onClick}
    >
      <CardHeader>
        <CardTitle className="text-lg">{place.name}</CardTitle>
        <CardDescription className="space-y-1">
          <div className="flex items-center gap-1 text-sm">
            <span className="text-muted-foreground">{place.category}</span>
          </div>
          <div className="flex items-center gap-1 text-sm">
            <MapPin className="h-3 w-3" />
            <span>{place.address}</span>
          </div>
          {place.telephone && (
            <div className="flex items-center gap-1 text-sm">
              <Phone className="h-3 w-3" />
              <span>{place.telephone}</span>
            </div>
          )}
        </CardDescription>
      </CardHeader>
    </Card>
  );
}