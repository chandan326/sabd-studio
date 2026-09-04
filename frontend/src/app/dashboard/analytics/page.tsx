'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BarChart3, Eye, Heart, Share2, Users, TrendingUp } from 'lucide-react';

export default function AnalyticsDashboardPage() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['analytics-overview'],
    queryFn: () => api.getAnalyticsOverview(),
  });

  if (isLoading) {
    return <div className="py-20 text-center text-xs text-muted-foreground">Loading analytics metrics...</div>;
  }

  const summary = analytics?.summary || {};
  const chartData = analytics?.chart_data || [];
  const platformComparison = analytics?.platform_comparison || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold">Analytics & Performance Metrics</h1>
          <p className="text-xs text-muted-foreground">Track views, impressions, engagement rates, and follower growth across channels.</p>
        </div>
        <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full font-medium">
          Demo Analytics Mode
        </span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl border border-border bg-card shadow-xl space-y-2">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>Total Views</span>
            <Eye className="h-4 w-4 text-primary" />
          </div>
          <div className="text-2xl font-bold">{summary.total_views?.toLocaleString() || 0}</div>
        </div>

        <div className="p-5 rounded-xl border border-border bg-card shadow-xl space-y-2">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>Total Impressions</span>
            <TrendingUp className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold">{summary.total_impressions?.toLocaleString() || 0}</div>
        </div>

        <div className="p-5 rounded-xl border border-border bg-card shadow-xl space-y-2">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>Interactions (Likes/Shares)</span>
            <Heart className="h-4 w-4 text-pink-500" />
          </div>
          <div className="text-2xl font-bold">{(summary.total_likes + summary.total_shares)?.toLocaleString() || 0}</div>
        </div>

        <div className="p-5 rounded-xl border border-border bg-card shadow-xl space-y-2">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>Avg Engagement Rate</span>
            <BarChart3 className="h-4 w-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">{summary.avg_engagement_rate || 4.2}%</div>
        </div>
      </div>

      {/* Recharts Area Chart */}
      <div className="p-6 rounded-2xl border border-border bg-card shadow-xl space-y-4">
        <h3 className="font-bold text-sm">Audience Reach & Views Growth (Last 14 Days)</h3>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
              <Area type="monotone" dataKey="views" stroke="#38bdf8" fillOpacity={1} fill="url(#colorViews)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Platform Breakdown Bar Chart */}
      <div className="p-6 rounded-2xl border border-border bg-card shadow-xl space-y-4">
        <h3 className="font-bold text-sm">Platform Viewership Comparison</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={platformComparison}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="platform" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
              <Bar dataKey="views" fill="#818cf8" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
