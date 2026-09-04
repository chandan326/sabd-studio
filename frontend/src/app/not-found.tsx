import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 text-center space-y-4">
      <div className="text-6xl font-extrabold text-primary">404</div>
      <h1 className="text-2xl font-bold">Page Not Found</h1>
      <p className="text-xs text-muted-foreground max-w-sm">The page or resource you requested does not exist or has been moved.</p>
      <Link href="/dashboard" className="bg-primary text-primary-foreground font-semibold text-xs px-5 py-2.5 rounded-lg shadow-lg">
        Return to Dashboard
      </Link>
    </div>
  );
}
