'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Sparkles, CheckCircle2, Clock, Download, RefreshCw, FileText, Share2, Layers, Search, Eye } from 'lucide-react';

export default function CampaignDetailPage() {
  const params = useParams();
  const campaignId = params.id as string;
  const [activeTab, setActiveTab] = useState<'assets' | 'transcript' | 'settings'>('assets');
  const [editedTranscript, setEditedTranscript] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const { data: campaign, isLoading, refetch } = useQuery({
    queryKey: ['campaign', campaignId],
    queryFn: () => api.getCampaign(campaignId),
    refetchInterval: (query: any) => {
      const data = query.state.data;
      if (data && data.status !== 'completed' && data.status !== 'failed') {
        return 2000;
      }
      return false;
    },
  });

  const handleExport = async (format = 'zip') => {
    setIsExporting(true);
    try {
      const blob = await api.exportCampaignPackage(campaignId, format);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `creatorflow_export_${campaignId.slice(0, 8)}.${format}`;
      a.click();
    } catch (e) {
      alert('Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  const handleSaveTranscript = async () => {
    try {
      await api.updateTranscript(campaignId, { edited_text: editedTranscript });
      alert('Transcript updated successfully!');
      refetch();
    } catch (e) {
      alert('Failed to save transcript');
    }
  };

  if (isLoading) {
    return <div className="py-20 text-center text-xs text-muted-foreground">Loading campaign pipeline status...</div>;
  }

  if (!campaign) {
    return <div className="py-20 text-center text-xs text-muted-foreground">Campaign not found.</div>;
  }

  const job = campaign.processing_job || {};
  const isComplete = campaign.status === 'completed';

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-card border border-border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold">{campaign.name}</h1>
            <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1 ${
              isComplete
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
            }`}>
              {isComplete ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3 animate-spin" />}
              {campaign.status}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Target Platforms: <span className="text-primary font-semibold">{campaign.target_platforms.join(', ').toUpperCase()}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => handleExport('zip')}
            disabled={isExporting}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-primary/25 flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <Download className="h-4 w-4" /> Export Package (ZIP/MD)
          </button>
        </div>
      </div>

      {/* Live Stage Progress Indicator */}
      {!isComplete && (
        <div className="p-6 rounded-2xl border border-amber-500/30 bg-amber-500/5 space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-amber-400">
            <span className="flex items-center gap-2">
              <Clock className="h-4 w-4 animate-spin" />
              Stage: {job.current_stage || 'Processing Pipeline...'}
            </span>
            <span>{job.progress || 40}% Completed</span>
          </div>
          <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-primary transition-all duration-500"
              style={{ width: `${job.progress || 40}%` }}
            />
          </div>
        </div>
      )}

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-border text-xs font-medium">
        <button
          onClick={() => setActiveTab('assets')}
          className={`pb-3 px-3 border-b-2 transition-all ${
            activeTab === 'assets' ? 'border-primary text-primary font-bold' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Generated Assets ({campaign.assets?.length || 0})
        </button>
        <button
          onClick={() => {
            setActiveTab('transcript');
            if (campaign.transcript && !editedTranscript) {
              setEditedTranscript(campaign.transcript.text);
            }
          }}
          className={`pb-3 px-3 border-b-2 transition-all ${
            activeTab === 'transcript' ? 'border-primary text-primary font-bold' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Transcript & Extraction
        </button>
      </div>

      {/* TAB 1: Assets List */}
      {activeTab === 'assets' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {campaign.assets?.map((asset: any) => (
            <div key={asset.id} className="p-5 rounded-2xl border border-border bg-card/60 backdrop-blur-md space-y-3 flex flex-col justify-between hover:border-primary/50 transition-all">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                    {asset.platform}
                  </span>
                  <span className="text-xs text-emerald-400 font-semibold">SEO: {asset.seo_score}/100</span>
                </div>
                <h3 className="font-bold text-sm line-clamp-2">{asset.title}</h3>
                <p className="text-xs text-muted-foreground line-clamp-4 leading-relaxed font-sans whitespace-pre-line">
                  {asset.content}
                </p>
              </div>

              <div className="flex items-center justify-between border-t border-border pt-3 mt-2">
                <span className="text-[11px] text-muted-foreground">Version v{asset.current_version}</span>
                <Link
                  href={`/dashboard/studio/${asset.id}`}
                  className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                >
                  Edit in Studio <Eye className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: Transcript */}
      {activeTab === 'transcript' && (
        <div className="p-6 rounded-2xl border border-border bg-card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-sm">Inline Transcript Editor</h2>
            <button
              onClick={handleSaveTranscript}
              className="bg-primary text-primary-foreground font-semibold text-xs px-3.5 py-1.5 rounded-lg"
            >
              Save Transcript Edits
            </button>
          </div>
          <textarea
            rows={10}
            value={editedTranscript || campaign.transcript?.text || ''}
            onChange={(e) => setEditedTranscript(e.target.value)}
            className="w-full bg-secondary/40 border border-border rounded-xl p-4 text-xs focus:outline-none focus:ring-2 focus:ring-primary font-mono leading-relaxed"
          />
        </div>
      )}
    </div>
  );
}
