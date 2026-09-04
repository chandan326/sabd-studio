'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Sparkles, Plus, Search, CheckCircle2, Clock, Trash2, ArrowRight } from 'lucide-react';

export default function CampaignsListPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: campaigns = [], isLoading, refetch } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => api.getCampaigns(),
  });

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this campaign?')) {
      await api.deleteCampaign(id);
      refetch();
    }
  };

  const filteredCampaigns = campaigns.filter((c: any) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold">Content Campaigns</h1>
          <p className="text-xs text-muted-foreground">Manage and track your AI content pipeline jobs.</p>
        </div>
        <Link
          href="/dashboard/campaigns/new"
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-primary/25 flex items-center gap-2 transition-all shrink-0"
        >
          <Plus className="h-4 w-4" /> Create New Campaign
        </Link>
      </div>

      {/* Search & Filter */}
      <div className="flex items-center gap-4 bg-card border border-border p-3 rounded-xl">
        <div className="relative flex-1">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search campaigns by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-secondary/50 border border-border rounded-lg pl-9 pr-4 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Campaigns Table / Cards */}
      {isLoading ? (
        <div className="py-12 text-center text-xs text-muted-foreground">Loading campaigns...</div>
      ) : filteredCampaigns.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-border rounded-2xl bg-card/40 space-y-3">
          <Sparkles className="h-8 w-8 text-primary mx-auto opacity-50" />
          <h3 className="font-bold text-sm">No campaigns found</h3>
          <p className="text-xs text-muted-foreground">Create a campaign to turn ideas or transcripts into multi-platform content assets.</p>
          <Link href="/dashboard/campaigns/new" className="inline-flex bg-primary text-primary-foreground px-4 py-2 rounded-lg text-xs font-semibold">
            Create Campaign
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredCampaigns.map((campaign: any) => (
            <div key={campaign.id} className="p-5 rounded-2xl border border-border bg-card/60 backdrop-blur-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-primary/50 transition-all">
              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center gap-2">
                  <Link href={`/dashboard/campaigns/${campaign.id}`} className="font-bold text-base hover:text-primary transition-colors">
                    {campaign.name}
                  </Link>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold flex items-center gap-1 ${
                    campaign.status === 'completed'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}>
                    {campaign.status === 'completed' ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3 animate-spin" />}
                    {campaign.status}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span className="capitalize bg-secondary px-2 py-0.5 rounded font-mono text-[11px]">{campaign.source_type}</span>
                  <span>{campaign.assets_count || 6} Multi-Platform Assets</span>
                  <span>Created {new Date(campaign.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 w-full md:w-auto justify-end border-t md:border-t-0 border-border pt-3 md:pt-0">
                <button
                  onClick={() => handleDelete(campaign.id)}
                  className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                  title="Delete Campaign"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <Link
                  href={`/dashboard/campaigns/${campaign.id}`}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs px-4 py-2 rounded-lg shadow-md shadow-primary/20 flex items-center gap-1.5 transition-all"
                >
                  Open Studio <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
