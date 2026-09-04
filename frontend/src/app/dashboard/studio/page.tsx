'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { FileText, CheckCircle2, Clock, Eye, Sparkles, Filter } from 'lucide-react';

export default function ContentStudioIndexPage() {
  const [selectedPlatform, setSelectedPlatform] = useState('all');

  const { data: assets = [], isLoading } = useQuery({
    queryKey: ['assets', selectedPlatform],
    queryFn: () => api.getAssets(selectedPlatform !== 'all' ? `platform=${selectedPlatform}` : ''),
  });

  const platforms = [
    { id: 'all', label: 'All Platforms' },
    { id: 'youtube', label: 'YouTube' },
    { id: 'instagram', label: 'Instagram' },
    { id: 'linkedin', label: 'LinkedIn' },
    { id: 'twitter', label: 'X / Twitter' },
    { id: 'blog', label: 'Blog' },
    { id: 'shorts', label: 'Shorts' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold">Content Studio Workbench</h1>
          <p className="text-xs text-muted-foreground">Review, edit, regenerate, and approve your multi-platform content assets.</p>
        </div>
      </div>

      {/* Platform Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 text-xs font-medium">
        {platforms.map((p) => (
          <button
            key={p.id}
            onClick={() => setSelectedPlatform(p.id)}
            className={`px-3 py-1.5 rounded-lg border transition-all shrink-0 ${
              selectedPlatform === p.id
                ? 'bg-primary border-primary text-primary-foreground font-semibold shadow-md shadow-primary/20'
                : 'border-border bg-card/60 text-muted-foreground hover:text-foreground'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Assets Grid */}
      {isLoading ? (
        <div className="py-12 text-center text-xs text-muted-foreground">Loading studio assets...</div>
      ) : assets.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-border rounded-2xl bg-card/40 space-y-3">
          <FileText className="h-8 w-8 text-primary mx-auto opacity-50" />
          <h3 className="font-bold text-sm">No assets found</h3>
          <p className="text-xs text-muted-foreground">Create a new campaign to generate platform-tailored assets.</p>
          <Link href="/dashboard/campaigns/new" className="inline-flex bg-primary text-primary-foreground px-4 py-2 rounded-lg text-xs font-semibold">
            Create Campaign
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {assets.map((asset: any) => (
            <div key={asset.id} className="p-5 rounded-2xl border border-border bg-card/60 backdrop-blur-md space-y-3 flex flex-col justify-between hover:border-primary/50 transition-all">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                    {asset.platform}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                    asset.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-secondary text-muted-foreground'
                  }`}>
                    {asset.status}
                  </span>
                </div>
                <h3 className="font-bold text-sm line-clamp-2">{asset.title}</h3>
                <p className="text-xs text-muted-foreground line-clamp-4 leading-relaxed whitespace-pre-line">
                  {asset.content}
                </p>
              </div>

              <div className="flex items-center justify-between border-t border-border pt-3 mt-2 text-xs">
                <span className="text-emerald-400 font-semibold">SEO: {asset.seo_score}/100</span>
                <Link
                  href={`/dashboard/studio/${asset.id}`}
                  className="bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all"
                >
                  Edit in Studio <Eye className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
