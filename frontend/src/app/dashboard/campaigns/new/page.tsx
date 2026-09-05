'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Sparkles, FileText, Upload, Link as LinkIcon, Youtube, Instagram, Linkedin, Twitter, BookOpen, Video, ArrowRight, Check } from 'lucide-react';

export default function NewCampaignWizardPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [sourceType, setSourceType] = useState<'text' | 'transcript' | 'document' | 'video' | 'audio' | 'url'>('text');
  const [sourceText, setSourceText] = useState('Building a production-grade AI content pipeline application that automates YouTube, Instagram, LinkedIn, Twitter, Blog, and Shorts asset generation from a single transcript or topic idea.');
  const [sourceUrl, setSourceUrl] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['youtube', 'instagram', 'linkedin', 'twitter', 'blog', 'shorts']);
  const [tone, setTone] = useState('Authoritative, engaging, and action-oriented');
  const [targetAudience, setTargetAudience] = useState('Content Creators & Tech Entrepreneurs');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const togglePlatform = (p: string) => {
    if (selectedPlatforms.includes(p)) {
      if (selectedPlatforms.length > 1) {
        setSelectedPlatforms(selectedPlatforms.filter((x) => x !== p));
      }
    } else {
      setSelectedPlatforms([...selectedPlatforms, p]);
    }
  };

  const handleNext = () => setStep((s) => Math.min(s + 1, 4));
  const handleBack = () => setStep((s) => Math.max(s - 1, 1));

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const campaignName = name.trim() || `Campaign ${new Date().toLocaleDateString()}`;
      const data = await api.createCampaign({
        name: campaignName,
        source_type: sourceType,
        source_text: sourceText,
        source_url: sourceUrl,
        target_platforms: selectedPlatforms,
        tone,
        target_audience: targetAudience
      });

      if (uploadedFile && data.id) {
        try {
          await api.uploadCampaignFile(data.id, uploadedFile);
          await api.processCampaign(data.id);
        } catch (fileErr) {
          console.warn('File upload warning:', fileErr);
        }
      }

      router.push(`/dashboard/campaigns/${data.id}`);
    } catch (err: any) {
      alert(err.message || 'Failed to create campaign');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Create New Campaign</h1>
        <p className="text-xs text-muted-foreground">Follow the 4-step wizard to launch your multi-platform AI pipeline.</p>
      </div>

      {/* Progress Steps Header */}
      <div className="grid grid-cols-4 gap-2 text-xs border-b border-border pb-4">
        {[
          { num: 1, label: 'Content Source' },
          { num: 2, label: 'Target Platforms' },
          { num: 3, label: 'Brand Voice' },
          { num: 4, label: 'Review & Launch' },
        ].map((s) => (
          <div
            key={s.num}
            className={`flex items-center gap-2 p-2.5 rounded-lg border transition-all ${
              step === s.num
                ? 'border-primary bg-primary/10 text-primary font-semibold'
                : step > s.num
                ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400 font-medium'
                : 'border-border text-muted-foreground'
            }`}
          >
            <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${
              step === s.num ? 'bg-primary text-primary-foreground' : step > s.num ? 'bg-emerald-500 text-black' : 'bg-secondary'
            }`}>
              {step > s.num ? <Check className="h-3.5 w-3.5" /> : s.num}
            </div>
            <span className="hidden sm:inline">{s.label}</span>
          </div>
        ))}
      </div>

      {/* STEP 1: Content Ingestion Source */}
      {step === 1 && (
        <div className="space-y-6 bg-card border border-border p-6 rounded-2xl shadow-xl animate-in fade-in">
          <div className="space-y-1">
            <h2 className="font-bold text-base">Step 1: Choose Your Content Source</h2>
            <p className="text-xs text-muted-foreground">Enter a topic, paste a transcript, upload a document/media file, or enter a public URL.</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Campaign Name</label>
            <input
              type="text"
              placeholder="e.g. AI Agents in Web Development 2026"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-secondary/50 border border-border rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Source Type Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { id: 'text', label: 'Topic / Text Idea', icon: Sparkles },
              { id: 'transcript', label: 'Raw Transcript', icon: FileText },
              { id: 'document', label: 'File Upload (PDF/DOCX)', icon: Upload },
              { id: 'video', label: 'Video Upload', icon: Video },
              { id: 'audio', label: 'Audio Upload', icon: Upload },
              { id: 'url', label: 'Public URL Import', icon: LinkIcon },
            ].map((st) => {
              const Icon = st.icon;
              return (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setSourceType(st.id as any)}
                  className={`p-4 rounded-xl border text-left flex flex-col justify-between gap-3 transition-all ${
                    sourceType === st.id
                      ? 'border-primary bg-primary/10 text-primary font-semibold shadow-md shadow-primary/10'
                      : 'border-border bg-secondary/30 hover:bg-secondary/60 text-muted-foreground'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs">{st.label}</span>
                </button>
              );
            })}
          </div>

          {['document', 'video', 'audio'].includes(sourceType) ? (
            <div className="border-2 border-dashed border-border p-8 rounded-xl text-center space-y-2 bg-secondary/20">
              <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
              <p className="text-xs font-medium">Upload PDF, DOCX, TXT, MP3, or MP4 file</p>
                <input
                  type="file"
                  accept={sourceType === 'video' ? 'video/*' : sourceType === 'audio' ? 'audio/*' : '.pdf,.docx,.txt'}
                onChange={(e) => setUploadedFile(e.target.files?.[0] || null)}
                className="text-xs text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground"
              />
              {uploadedFile && <p className="text-xs text-emerald-400 font-semibold">Selected: {uploadedFile.name}</p>}
            </div>
          ) : sourceType === 'url' ? (
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Public Content URL</label>
              <input
                type="url"
                placeholder="https://example.com/article"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                className="w-full bg-secondary/50 border border-border rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          ) : (
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Source Content / Transcript Text</label>
              <textarea
                rows={5}
                value={sourceText}
                onChange={(e) => setSourceText(e.target.value)}
                placeholder="Paste your raw text idea, meeting transcript, or outline here..."
                className="w-full bg-secondary/50 border border-border rounded-lg p-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              onClick={handleNext}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs px-6 py-2.5 rounded-lg shadow-lg shadow-primary/20 flex items-center gap-2"
            >
              Next: Select Platforms <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Target Platforms */}
      {step === 2 && (
        <div className="space-y-6 bg-card border border-border p-6 rounded-2xl shadow-xl animate-in fade-in">
          <div className="space-y-1">
            <h2 className="font-bold text-base">Step 2: Select Target Platforms</h2>
            <p className="text-xs text-muted-foreground">Select the social media channels you want AI assets generated for.</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { id: 'youtube', label: 'YouTube Package', icon: Youtube, color: 'text-red-500' },
              { id: 'instagram', label: 'Instagram Pack', icon: Instagram, color: 'text-pink-500' },
              { id: 'linkedin', label: 'LinkedIn Article/Post', icon: Linkedin, color: 'text-blue-500' },
              { id: 'twitter', label: 'X / Twitter Thread', icon: Twitter, color: 'text-sky-400' },
              { id: 'blog', label: 'SEO Blog Draft', icon: BookOpen, color: 'text-emerald-400' },
              { id: 'shorts', label: 'Short-Form Script', icon: Video, color: 'text-amber-400' },
            ].map((p) => {
              const Icon = p.icon;
              const isSelected = selectedPlatforms.includes(p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => togglePlatform(p.id)}
                  className={`p-4 rounded-xl border text-left flex items-center gap-3 transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/10 font-semibold text-foreground shadow-md'
                      : 'border-border bg-secondary/30 opacity-60 hover:opacity-100'
                  }`}
                >
                  <Icon className={`h-5 w-5 ${p.color}`} />
                  <span className="text-xs font-medium">{p.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex justify-between pt-2">
            <button onClick={handleBack} className="border border-border text-xs px-4 py-2 rounded-lg font-medium">Back</button>
            <button
              onClick={handleNext}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs px-6 py-2.5 rounded-lg shadow-lg shadow-primary/20 flex items-center gap-2"
            >
              Next: Brand Voice <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Brand Voice & Audience */}
      {step === 3 && (
        <div className="space-y-6 bg-card border border-border p-6 rounded-2xl shadow-xl animate-in fade-in">
          <div className="space-y-1">
            <h2 className="font-bold text-base">Step 3: Brand Voice & Target Audience</h2>
            <p className="text-xs text-muted-foreground">Customize tone and audience preferences for this generation batch.</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Target Audience</label>
              <input
                type="text"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                className="w-full bg-secondary/50 border border-border rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Tone of Voice</label>
              <input
                type="text"
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full bg-secondary/50 border border-border rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="flex justify-between pt-2">
            <button onClick={handleBack} className="border border-border text-xs px-4 py-2 rounded-lg font-medium">Back</button>
            <button
              onClick={handleNext}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs px-6 py-2.5 rounded-lg shadow-lg shadow-primary/20 flex items-center gap-2"
            >
              Next: Review & Launch <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Review & Trigger */}
      {step === 4 && (
        <div className="space-y-6 bg-card border border-border p-6 rounded-2xl shadow-xl animate-in fade-in">
          <div className="space-y-1">
            <h2 className="font-bold text-base">Step 4: Review & Launch AI Pipeline</h2>
            <p className="text-xs text-muted-foreground">Confirm settings and trigger background multi-platform asset generation.</p>
          </div>

          <div className="p-4 rounded-xl bg-secondary/40 border border-border text-xs space-y-2">
            <div><span className="text-muted-foreground">Campaign Name:</span> <strong className="text-foreground">{name || 'Default Campaign'}</strong></div>
            <div><span className="text-muted-foreground">Source Type:</span> <strong className="text-foreground uppercase">{sourceType}</strong></div>
            <div><span className="text-muted-foreground">Platforms:</span> <strong className="text-primary">{selectedPlatforms.join(', ').toUpperCase()}</strong></div>
            <div><span className="text-muted-foreground">Audience & Tone:</span> <strong className="text-foreground">{targetAudience} ({tone})</strong></div>
          </div>

          <div className="flex justify-between pt-2">
            <button onClick={handleBack} className="border border-border text-xs px-4 py-2 rounded-lg font-medium">Back</button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white font-semibold text-xs px-8 py-3 rounded-xl shadow-xl shadow-primary/30 flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Launch AI Pipeline'} <Sparkles className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
