'use client';

import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GoogleOAuthProvider } from '@react-oauth/google';

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  const content = (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  return googleClientId ? <GoogleOAuthProvider clientId={googleClientId}>{content}</GoogleOAuthProvider> : content;
}
