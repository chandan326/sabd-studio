'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Sparkles, CheckCircle2, Copy, Download, RefreshCw, Save, History, Search, ArrowLeft, ThumbsUp, ThumbsDown } from 'lucide-react';

export default function SingleAssetStudioEditorPage() {
  const params = useParams();
  const assetId = params.id as string;
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showVersions, setShowVersions] = useState(false);

  const { data: asset, isLoading, refetch } = useQuery({
    queryKey: ['asset', assetId],
    queryFn: () => api.getAsset(assetId),
  });

  useEffect(() => {
    if (asset) {
      setTitle(asset.title || '');
      setContent(asset.content || '');
    }
  }, [asset]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.updateAsset(assetId, { title, content });
      alert('Asset updated and new version saved!');
      refetch();
    } catch (e) {
      alert('Failed to save asset');
    } finally {
      setIsSaving(false);
    }
  };

  const handleApprove = async (status: string) => {
    try {
      await api.approveAsset(assetId, status);
      refetch();
    } catch (e) {
      alert('Failed to update status');
    }
  };

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      await api.regenerateAsset(assetId);
      refetch();
    } catch (e) {
      alert('Regeneration failed');
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(`${title}\n\n${content}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([`${title}\n\n${content}`], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${asset.platform}_${assetId.slice(0, 6)}.txt`;
    document.body.appendChild(element);
    element.click();
  };

  if (isLoading) {
    return <div className="py-20 text-center text-xs text-muted-foreground">Loading asset workbench...</div>;
  }

  if (!asset) {
    return <div className="py-20 text-center text-xs text-muted-foreground">Asset not found.</div>;
  }

  const seoAnalysis = asset.seo_analysis || { overall_score: 85, checks: [], recommendations: [] };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 rounded-lg bg-secondary border border-border">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                {asset.platform}
              </span>
              <h1 className="text-xl font-bold">Content Workbench Editor</h1>
            </div>
            <p className="text-xs text-muted-foreground">Campaign: {asset.campaign_name}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleApprove('approved')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all ${
              asset.status === 'approved' ? 'bg-emerald-500 text-black border-emerald-500' : 'border-border bg-secondary hover:bg-emerald-500/20'
            }`}
          >
            <ThumbsUp className="h-3.5 w-3.5" /> Approve
          </button>
          <button
            onClick={() => handleApprove('rejected')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all ${
              asset.status === 'rejected' ? 'bg-rose-500 text-white border-rose-500' : 'border-border bg-secondary hover:bg-rose-500/20'
            }`}
          >
            <ThumbsDown className="h-3.5 w-3.5" /> Reject
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Live Text Editor */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-6 rounded-2xl border border-border bg-card shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium">Asset Title</span>
              <span className="text-xs text-muted-foreground font-mono">{content.length} characters</span>
            </div>

            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-2.5 text-base font-bold focus:outline-none focus:ring-2 focus:ring-primary"
            />

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Asset Content Copy</label>
              <textarea
                rows={14}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full bg-secondary/30 border border-border rounded-xl p-4 text-xs font-sans leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary whitespace-pre-line"
              />
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-md shadow-primary/20"
                >
                  <Save className="h-3.5 w-3.5" /> {isSaving ? 'Saving...' : 'Save Edit (v' + (asset.current_version + 1) + ')'}
                </button>
                <button
                  onClick={handleRegenerate}
                  disabled={isRegenerating}
                  className="bg-secondary border border-border text-foreground hover:bg-secondary/80 font-medium text-xs px-3.5 py-2 rounded-lg flex items-center gap-1.5"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isRegenerating ? 'animate-spin' : ''}`} /> Regenerate AI
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="bg-secondary border border-border hover:bg-secondary/80 text-foreground text-xs px-3 py-2 rounded-lg flex items-center gap-1.5"
                >
                  <Copy className="h-3.5 w-3.5" /> {copied ? 'Copied!' : 'Copy Copy'}
                </button>
                <button
                  onClick={handleDownload}
                  className="bg-secondary border border-border hover:bg-secondary/80 text-foreground text-xs px-3 py-2 rounded-lg flex items-center gap-1.5"
                >
                  <Download className="h-3.5 w-3.5" /> Download
                </button>
              </div>
            </div>
          </div>

          {/* Version History Accordion */}
          <div className="p-4 rounded-xl border border-border bg-card/40 space-y-2">
            <button
              onClick={() => setShowVersions(!showVersions)}
              className="flex items-center justify-between w-full text-xs font-semibold text-muted-foreground hover:text-foreground"
            >
              <span className="flex items-center gap-2">
                <History className="h-4 w-4 text-primary" /> Version History ({asset.versions?.length || 1} versions)
              </span>
              <span>{showVersions ? 'Hide' : 'Show'}</span>
            </button>

            {showVersions && (
              <div className="space-y-2 pt-2 divide-y divide-border">
                {asset.versions?.map((v: any) => (
                  <div key={v.id} className="pt-2 text-xs space-y-1">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span className="font-semibold text-foreground">Version v{v.version_number}</span>
                      <span className="text-[10px]">{new Date(v.created_at).toLocaleString()}</span>
                    </div>
                    <p className="line-clamp-2 text-[11px] text-muted-foreground">{v.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: SEO Assistant & Metadata Inspector */}
        <div className="space-y-4">
          {/* SEO Score Meter Card */}
          <div className="p-6 rounded-2xl border border-border bg-card shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Search className="h-4 w-4 text-emerald-400" /> SEO Optimization
              </h3>
              <span className="text-2xl font-extrabold text-emerald-400">{seoAnalysis.overall_score}<span className="text-xs text-muted-foreground font-normal">/100</span></span>
            </div>

            <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full bg-emerald-400 transition-all duration-500"
                style={{ width: `${seoAnalysis.overall_score}%` }}
              />
            </div>

            <div className="space-y-2 pt-2">
              <h4 className="text-xs font-semibold text-muted-foreground">Rule Checks</h4>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {seoAnalysis.checks?.map((c: any, idx: number) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-secondary/40 text-xs space-y-0.5 border border-border/50">
                    <div className="flex items-center justify-between font-semibold">
                      <span className="capitalize">{c.rule.replace(/_/g, ' ')}</span>
                      <span className={c.status === 'pass' ? 'text-emerald-400' : 'text-amber-400'}>{c.score}/{c.max_score}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">{c.message}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Metadata Inspector Card */}
          {asset.metadata && (
            <div className="p-6 rounded-2xl border border-border bg-card shadow-xl space-y-3">
              <h3 className="font-bold text-sm">Platform Metadata</h3>
              {asset.metadata.hashtags && (
                <div className="space-y-1">
                  <span className="text-[11px] text-muted-foreground font-medium">Hashtags:</span>
                  <div className="flex flex-wrap gap-1">
                    {asset.metadata.hashtags.map((h: string, idx: number) => (
                      <span key={idx} className="text-[10px] bg-secondary border border-border px-2 py-0.5 rounded text-primary font-mono">{h}</span>
                    ))}
                  </div>
                </div>
              )}
              {asset.metadata.timestamps && (
                <div className="space-y-1">
                  <span className="text-[11px] text-muted-foreground font-medium">Timestamps:</span>
                  <ul className="text-[11px] text-muted-foreground space-y-0.5 font-mono">
                    {asset.metadata.timestamps.map((t: string, idx: number) => (
                      <li key={idx}>• {t}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
