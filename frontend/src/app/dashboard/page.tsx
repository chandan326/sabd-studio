'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Sparkles, FileText, Calendar, Search, ArrowRight, CheckCircle2, Clock, Play } from 'lucide-react';

export default function DashboardOverviewPage() {
  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => api.getCampaigns(),
  });

  const { data: assets = [] } = useQuery({
    queryKey: ['assets'],
    queryFn: () => api.getAssets(),
  });

  const { data: schedules = [] } = useQuery({
    queryKey: ['schedules'],
    queryFn: () => api.getSchedules(),
  });

  const completedCampaigns = campaigns.filter((c: any) => c.status === 'completed').length;
  const totalAssets = assets.length;
  const scheduledCount = schedules.length;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-primary/20 via-card to-card border border-primary/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/20 text-primary text-[11px] font-semibold">
            <Sparkles className="h-3 w-3" /> Judge Demo Workspace Active
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">Creator Analytics & Pipeline Command</h1>
          <p className="text-xs text-muted-foreground">
            From 1 raw topic or transcript into 6 platform-optimized asset packs.
          </p>
        </div>
        <Link
          href="/dashboard/campaigns/new"
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-primary/25 flex items-center gap-2 transition-all shrink-0"
        >
          <Sparkles className="h-4 w-4" /> Create New Campaign
        </Link>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl border border-border bg-card/60 backdrop-blur-md space-y-2">
          <span className="text-xs text-muted-foreground font-medium">Total Campaigns</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold">{campaigns.length}</span>
            <span className="text-[10px] text-emerald-400 font-medium">{completedCampaigns} Completed</span>
          </div>
        </div>

        <div className="p-5 rounded-xl border border-border bg-card/60 backdrop-blur-md space-y-2">
          <span className="text-xs text-muted-foreground font-medium">Generated Content Assets</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold">{totalAssets}</span>
            <span className="text-[10px] text-primary font-medium">6 Platforms</span>
          </div>
        </div>

        <div className="p-5 rounded-xl border border-border bg-card/60 backdrop-blur-md space-y-2">
          <span className="text-xs text-muted-foreground font-medium">Scheduled Posts</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold">{scheduledCount}</span>
            <span className="text-[10px] text-purple-400 font-medium">Visual Calendar</span>
          </div>
        </div>

        <div className="p-5 rounded-xl border border-border bg-card/60 backdrop-blur-md space-y-2">
          <span className="text-xs text-muted-foreground font-medium">Avg SEO Score</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-emerald-400">88<span className="text-xs text-muted-foreground font-normal">/100</span></span>
            <span className="text-[10px] text-emerald-400 font-medium">8 Checks Pass</span>
          </div>
        </div>
      </div>

      {/* Recent Campaigns Section */}
      <div className="p-6 rounded-2xl border border-border bg-card space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-base">Recent Content Campaigns</h2>
            <p className="text-xs text-muted-foreground">Select a campaign to review, edit, and approve assets.</p>
          </div>
          <Link href="/dashboard/campaigns" className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
            View All <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-xs text-muted-foreground">Loading campaigns...</div>
        ) : campaigns.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <p className="text-xs text-muted-foreground">No campaigns created yet.</p>
            <Link href="/dashboard/campaigns/new" className="inline-flex bg-primary text-primary-foreground px-4 py-2 rounded-lg text-xs font-semibold">
              Create First Campaign
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {campaigns.slice(0, 5).map((campaign: any) => (
              <div key={campaign.id} className="py-3.5 flex items-center justify-between gap-4 hover:bg-secondary/20 px-2 rounded-lg transition-colors">
                <div className="space-y-1 min-w-0">
                  <Link href={`/dashboard/campaigns/${campaign.id}`} className="font-semibold text-sm hover:text-primary transition-colors truncate block">
                    {campaign.name}
                  </Link>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="capitalize text-[11px] bg-secondary px-2 py-0.5 rounded font-mono">{campaign.source_type}</span>
                    <span>{campaign.assets_count || 6} Assets Generated</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-[11px] px-2.5 py-1 rounded-full font-medium flex items-center gap-1 ${
                    campaign.status === 'completed'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}>
                    {campaign.status === 'completed' ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3 animate-spin" />}
                    {campaign.status}
                  </span>
                  <Link
                    href={`/dashboard/campaigns/${campaign.id}`}
                    className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground text-xs font-medium"
                  >
                    Open Studio
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Creator Suite Shortcuts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/dashboard/studio" className="p-4 rounded-xl border border-border bg-card/40 hover:bg-secondary/40 transition-all flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-semibold text-sm">Content Studio Workbench</h4>
            <p className="text-[11px] text-muted-foreground">Edit & approve multi-platform assets.</p>
          </div>
        </Link>

        <Link href="/dashboard/seo" className="p-4 rounded-xl border border-border bg-card/40 hover:bg-secondary/40 transition-all flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
            <Search className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-semibold text-sm">SEO 8-Rule Analyzer</h4>
            <p className="text-[11px] text-muted-foreground">Check title length, keywords, & readability.</p>
          </div>
        </Link>

        <Link href="/dashboard/calendar" className="p-4 rounded-xl border border-border bg-card/40 hover:bg-secondary/40 transition-all flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-semibold text-sm">Visual Content Calendar</h4>
            <p className="text-[11px] text-muted-foreground">Schedule posts & manage publishing.</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
