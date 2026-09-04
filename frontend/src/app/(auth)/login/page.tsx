'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, setAuthToken } from '@/lib/api';
import { Sparkles, ArrowRight, AlertCircle } from 'lucide-react';
import GoogleSignInButton from '@/components/GoogleSignInButton';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('demo@creatorflow.ai');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await api.login({ email, password });
      if (data.access_token) {
        setAuthToken(data.access_token);
      }
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const fillJudgeCredentials = () => {
    setEmail('demo@creatorflow.ai');
    setPassword('password123');
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex h-10 w-10 rounded-xl bg-gradient-to-tr from-primary to-accent items-center justify-center font-bold text-white shadow-lg shadow-primary/25 mb-2">
            CF
          </div>
          <h1 className="text-2xl font-bold">Welcome Back</h1>
          <p className="text-xs text-muted-foreground">Sign in to your CreatorFlow AI Workspace</p>
        </div>

        {/* Judge Demo Quick Action */}
        <div className="p-3 border border-primary/30 rounded-xl bg-primary/10 flex items-center justify-between text-xs">
          <div>
            <span className="font-semibold text-primary block">Hackathon Judge Credentials</span>
            <span className="text-[11px] text-muted-foreground">demo@creatorflow.ai / password123</span>
          </div>
          <button
            type="button"
            onClick={fillJudgeCredentials}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-2.5 py-1 rounded text-[11px] transition-all"
          >
            Auto-Fill
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 bg-card border border-border p-6 rounded-2xl shadow-xl">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-secondary/50 border border-border rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-secondary/50 border border-border rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs py-2.5 rounded-lg shadow-lg shadow-primary/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {loading ? 'Signing In...' : 'Sign In'} <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </form>

        <GoogleSignInButton onSuccess={() => router.push('/dashboard')} onError={setError} />

        <p className="text-center text-xs text-muted-foreground">
          Don't have an account?{' '}
          <Link href="/register" className="text-primary font-semibold hover:underline">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}
