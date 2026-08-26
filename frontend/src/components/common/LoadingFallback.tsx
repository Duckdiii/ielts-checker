import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingFallbackProps {
  message?: string;
}

export function LoadingFallback({ message = 'Đang tải module...' }: LoadingFallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] w-full p-8 space-y-4">
      <div className="relative flex items-center justify-center">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 animate-pulse" />
        <Loader2 className="w-6 h-6 text-indigo-400 animate-spin absolute" />
      </div>
      <p className="text-sm font-medium text-slate-400 animate-pulse">{message}</p>
    </div>
  );
}
