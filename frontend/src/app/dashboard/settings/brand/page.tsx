'use client';

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Palette, Save, CheckCircle2 } from 'lucide-react';

export default function BrandVoiceSettingsPage() {
  const [brandName, setBrandName] = useState('');
  const [description, setDescription] = useState('');
  const [audience, setAudience] = useState('');
  const [niche, setNiche] = useState('');
  const [tone, setTone] = useState('');
  const [preferredTerms, setPreferredTerms] = useState('');
  const [avoidedTerms, setAvoidedTerms] = useState('');
  const [loading, setLoading] = useState(false);

  const { data: brand, refetch } = useQuery({
    queryKey: ['brand-profile'],
    queryFn: () => api.getBrandProfile(),
  });

  useEffect(() => {
    if (brand) {
      setBrandName(brand.brand_name || '');
      setDescription(brand.description || '');
      setAudience(brand.audience || '');
      setNiche(brand.niche || '');
      setTone(brand.tone || '');
      setPreferredTerms(brand.preferred_terms || '');
      setAvoidedTerms(brand.avoided_terms || '');
    }
  }, [brand]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.updateBrandProfile({
        brand_name: brandName,
        description,
        audience,
        niche,
        tone,
        preferred_terms: preferredTerms,
        avoided_terms: avoidedTerms
      });
      alert('Brand voice profile saved! Future AI generations will incorporate these preferences.');
      refetch();
    } catch (err: any) {
      alert(err.message || 'Failed to update brand profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="border-b border-border pb-4">
        <h1 className="text-2xl font-bold">Brand Voice Profile</h1>
        <p className="text-xs text-muted-foreground">Configure your brand identity, target audience, tone, and vocabulary for AI content generation.</p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 rounded-2xl border border-border bg-card shadow-xl space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Brand Name</label>
            <input
              type="text"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              className="w-full bg-secondary/50 border border-border rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Industry / Niche</label>
            <input
              type="text"
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              className="w-full bg-secondary/50 border border-border rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Target Audience</label>
          <input
            type="text"
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
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

        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Preferred Vocabulary (Comma Separated)</label>
          <textarea
            rows={2}
            value={preferredTerms}
            onChange={(e) => setPreferredTerms(e.target.value)}
            className="w-full bg-secondary/50 border border-border rounded-lg p-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Avoided Terms / Words (Comma Separated)</label>
          <textarea
            rows={2}
            value={avoidedTerms}
            onChange={(e) => setAvoidedTerms(e.target.value)}
            className="w-full bg-secondary/50 border border-border rounded-lg p-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs px-6 py-2.5 rounded-lg shadow-lg shadow-primary/25 flex items-center gap-2"
        >
          <Save className="h-4 w-4" /> {loading ? 'Saving...' : 'Save Brand Profile'}
        </button>
      </form>
    </div>
  );
}
