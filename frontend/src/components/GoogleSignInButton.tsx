'use client';

import { GoogleLogin } from '@react-oauth/google';
import { api, setAuthToken } from '@/lib/api';

export default function GoogleSignInButton({ onSuccess, onError }: {
  onSuccess: () => void;
  onError: (message: string) => void;
}) {
  if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) return null;
  return (
    <div className="flex justify-center">
      <GoogleLogin
        theme="filled_black"
        shape="pill"
        width="360"
        onSuccess={async (response) => {
          if (!response.credential) return onError('Google did not return a credential.');
          try {
            const data = await api.googleLogin(response.credential);
            if (data.access_token) setAuthToken(data.access_token);
            onSuccess();
          } catch (error: any) {
            onError(error.message || 'Google sign-in failed');
          }
        }}
        onError={() => onError('Google sign-in was cancelled or failed.')}
      />
    </div>
  );
}
