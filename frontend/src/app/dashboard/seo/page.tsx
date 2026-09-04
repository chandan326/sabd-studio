'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api';
import { Search, Sparkles, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';

export default function SEOAnalyzerPage() {
  const [title, setTitle] = useState('How to Build an AI Content Engine in 2026: Step-by-Step Guide');
  const [content, setContent] = useState(`In this comprehensive breakdown, we explore everything you need to know about AI content engines.

📌 WHAT YOU WILL LEARN:
• The fundamental principles of content automation
• 3 critical mistakes to avoid
• Step-by-step implementation blueprint

💡 Don't forget to Like, Subscribe, and hit the Notification Bell for weekly updates!`);
  const [platform, setPlatform] = useState('youtube');
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyse = async () => {
    setLoading(true);
    try {
      const data = await api.analyseSEO({ title, content, platform });
      setAnalysis(data);
    } catch (e: any) {
      alert(e.message || 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-4">
        <h1 className="text-2xl font-bold">SEO 8-Rule Scoring Engine</h1>
        <p className="text-xs text-muted-foreground">Test your title and body copy against search placement rules in real-time.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Interactive Input */}
        <div className="lg:col-span-2 space-y-4 bg-card border border-border p-6 rounded-2xl shadow-xl">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Target Platform</label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="youtube">YouTube</option>
              <option value="instagram">Instagram</option>
              <option value="linkedin">LinkedIn</option>
              <option value="twitter">X / Twitter</option>
              <option value="blog">Blog</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-secondary/50 border border-border rounded-lg px-3.5 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Description / Copy</label>
            <textarea
              rows={8}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full bg-secondary/50 border border-border rounded-lg p-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <button
            onClick={handleAnalyse}
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs py-3 rounded-xl shadow-lg shadow-primary/25 flex items-center justify-center gap-2"
          >
            {loading ? 'Evaluating Rules...' : 'Run 8-Rule SEO Analysis'} <Search className="h-4 w-4" />
          </button>
        </div>

        {/* Right Column: Score Breakdown */}
        <div className="space-y-4">
          {analysis ? (
            <div className="p-6 rounded-2xl border border-border bg-card shadow-xl space-y-4 animate-in fade-in">
              <div className="text-center space-y-1 border-b border-border pb-4">
                <span className="text-xs text-muted-foreground font-medium">Overall SEO Score</span>
                <div className="text-4xl font-extrabold text-emerald-400">{analysis.overall_score}<span className="text-base text-muted-foreground font-normal">/100</span></div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground">Individual Rule Checks</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {analysis.checks?.map((c: any, idx: number) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-secondary/40 border border-border/50 text-xs space-y-0.5">
                      <div className="flex items-center justify-between font-semibold">
                        <span className="capitalize">{c.rule.replace(/_/g, ' ')}</span>
                        <span className={c.status === 'pass' ? 'text-emerald-400' : 'text-amber-400'}>{c.score}/{c.max_score}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">{c.message}</p>
                    </div>
                  ))}
                </div>
              </div>

              {analysis.recommendations?.length > 0 && (
                <div className="pt-2 border-t border-border space-y-1">
                  <h4 className="text-xs font-semibold text-amber-400">Actionable Suggestions</h4>
                  <ul className="text-[11px] text-muted-foreground space-y-1">
                    {analysis.recommendations.map((r: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 border border-dashed border-border rounded-2xl text-center text-xs text-muted-foreground bg-card/20 space-y-2">
              <Search className="h-6 w-6 text-muted-foreground mx-auto" />
              <p>Click "Run 8-Rule SEO Analysis" to generate real-time score & check details.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
