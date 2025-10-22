'use client';

import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface FloatingActionButtonProps {
  label: string;
  onClick: () => void;
}

export default function FloatingActionButton({ label, onClick }: FloatingActionButtonProps) {
  return (
    <Button
      onClick={onClick}
      size="lg"
      className="fixed bottom-6 right-6 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 md:bottom-8 md:right-8"
    >
      <Plus className="h-5 w-5 mr-2" />
      {label}
    </Button>
  );
}
