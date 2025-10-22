'use client';

import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

export default function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center px-6">
      <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 mb-2">오류 발생</h3>
      <p className="text-sm text-muted-foreground max-w-md mb-6">{message}</p>
      <Button onClick={onRetry} variant="outline">
        다시 시도
      </Button>
    </div>
  );
}
