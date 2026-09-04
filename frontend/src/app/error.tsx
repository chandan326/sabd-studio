'use client';

import React from 'react';
import Link from 'next/link';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 text-center space-y-4">
      <div className="text-6xl font-extrabold text-destructive">500</div>
      <h1 className="text-2xl font-bold">Unexpected Application Error</h1>
      <p className="text-xs text-muted-foreground max-w-sm">{error.message || 'An unexpected error occurred in the application.'}</p>
      <div className="flex items-center gap-3">
        <button onClick={() => reset()} className="bg-primary text-primary-foreground font-semibold text-xs px-4 py-2.5 rounded-lg shadow-lg">
          Try Again
        </button>
        <Link href="/dashboard" className="border border-border text-foreground font-medium text-xs px-4 py-2.5 rounded-lg">
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
