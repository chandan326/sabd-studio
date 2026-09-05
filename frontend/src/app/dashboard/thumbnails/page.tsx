'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api';
import ExportMenu from '@/components/ExportMenu';
import { Image as ImageIcon } from 'lucide-react';

export default function ThumbnailStudioPage() {
  const [headline, setHeadline] = useState('AI CONTENT ENGINE BLUEPRINT');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [theme, setTheme] = useState('dark_neon');
  const [preview, setPreview] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const data = await api.generateThumbnail({
        title: headline,
        aspect_ratio: aspectRatio,
        theme
      });
      setPreview(data);
    } catch (e: any) {
      alert(e.message || 'Thumbnail generation failed');
    } finally {
      setLoading(false);
    }
  };

  const getAspectClass = () => {
    if (aspectRatio === '16:9') return 'aspect-video';
    if (aspectRatio === '1:1') return 'aspect-square';
    if (aspectRatio === '4:5') return 'aspect-[4/5] max-w-xs';
    if (aspectRatio === '9:16') return 'aspect-[9/16] max-w-xs';
    return 'aspect-video';
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-4">
        <h1 className="text-2xl font-bold">Thumbnail Studio</h1>
        <p className="text-xs text-muted-foreground">Design visual thumbnail card previews & AI prompts across 4 aspect ratio presets.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls */}
        <div className="space-y-4 bg-card border border-border p-6 rounded-2xl shadow-xl">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Headline Text</label>
            <input
              type="text"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              className="w-full bg-secondary/50 border border-border rounded-lg px-3.5 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Aspect Ratio Preset</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: '16:9', label: '16:9 (YouTube)' },
                { id: '1:1', label: '1:1 (Instagram)' },
                { id: '4:5', label: '4:5 (Portrait)' },
                { id: '9:16', label: '9:16 (Story/Reel)' },
              ].map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setAspectRatio(r.id)}
                  className={`p-2.5 rounded-lg border text-xs font-semibold transition-all ${
                    aspectRatio === r.id ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-secondary/30'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Color Theme</label>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="dark_neon">Dark Neon Cyan</option>
              <option value="minimal_light">Minimalist Light</option>
              <option value="bold_yellow">Bold Warning Yellow</option>
              <option value="high_contrast">High Contrast Dark</option>
            </select>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs py-3 rounded-xl shadow-lg shadow-primary/25 flex items-center justify-center gap-2"
          >
            {loading ? 'Generating Concept...' : 'Generate Thumbnail Mockup'} <ImageIcon className="h-4 w-4" />
          </button>
        </div>

        {/* Visual Preview Canvas Card */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-6 rounded-2xl border border-border bg-card shadow-xl space-y-4">
            <h3 className="font-bold text-sm">Visual Thumbnail Mockup Preview</h3>
            <div className="flex justify-end"><ExportMenu title={headline || 'Sabd Studio Thumbnail'} content={`High-resolution ${aspectRatio} thumbnail · ${theme} theme · Sabd Studio`} metadata={{ aspect_ratio: aspectRatio, theme }} /></div>

            <div className={`w-full ${getAspectClass()} mx-auto rounded-2xl p-6 flex flex-col justify-between border-2 border-primary/40 shadow-2xl relative overflow-hidden transition-all ${
              theme === 'dark_neon'
                ? 'bg-slate-950 text-cyan-400'
                : theme === 'minimal_light'
                ? 'bg-slate-50 text-slate-900 border-slate-300'
                : theme === 'bold_yellow'
                ? 'bg-amber-400 text-black border-amber-500'
                : 'bg-black text-white border-white/20'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold px-2.5 py-1 rounded bg-primary text-primary-foreground shadow">
                  2026 EDITION
                </span>
                <span className="text-[10px] font-mono opacity-60">{aspectRatio}</span>
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight leading-tight drop-shadow">
                  {headline || 'YOUR HEADLINE HERE'}
                </h2>
                <p className="text-xs opacity-80 font-medium">STEP-BY-STEP CREATOR PIPELINE</p>
              </div>

              <div className="flex items-center justify-between text-[11px] font-bold">
                <span>CREATORFLOW AI</span>
                <span>SWIPE ➡️</span>
              </div>
            </div>

            {/* AI Prompts Inspector */}
            {preview && preview.generated_prompts && (
              <div className="pt-4 border-t border-border space-y-2 animate-in fade-in">
                <h4 className="text-xs font-semibold text-primary">AI Image Generation Prompts (Midjourney / DALL-E 3)</h4>
                <div className="space-y-2">
                  {preview.generated_prompts.map((prompt: string, idx: number) => (
                    <div key={idx} className="p-3 rounded-xl bg-secondary/40 border border-border text-xs font-mono leading-relaxed">
                      {prompt}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
