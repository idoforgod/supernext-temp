'use client';

import { Card, CardHeader, CardContent } from '@/components/ui/card';

export default function ReviewListSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="h-6 bg-gray-300 rounded w-1/4 mb-4 animate-pulse" />
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="h-5 bg-gray-300 rounded w-1/3 mb-2 animate-pulse" />
                  <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse" />
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <div key={star} className="h-4 w-4 bg-gray-300 rounded-full animate-pulse" />
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
                <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse" />
                <div className="h-4 bg-gray-200 rounded w-4/6 animate-pulse" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
