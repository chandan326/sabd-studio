'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Lightbulb, Sparkles, TrendingUp, Clock, AlertTriangle, ArrowRight } from 'lucide-react';

export default function AIRecommendationsPage() {
  const { data: recommendations = [], isLoading } = useQuery({
    queryKey: ['recommendations'],
    queryFn: () => api.getRecommendations(),
  });

  if (isLoading) {
    return <div className="py-20 text-center text-xs text-muted-foreground">Generating AI Performance Advisor insights...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Lightbulb className="h-6 w-6 text-amber-400" /> AI Performance Advisor
        </h1>
        <p className="text-xs text-muted-foreground">Practical, metric-backed recommendations based on your content analytics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {recommendations.map((item: any) => (
          <div key={item.id} className="p-6 rounded-2xl border border-border bg-card shadow-xl space-y-3 flex flex-col justify-between hover:border-primary/40 transition-all">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded bg-amber-400/10 text-amber-400 border border-amber-400/20">
                  {item.category}
                </span>
                <span className="text-[10px] text-emerald-400 font-medium font-mono">{item.supporting_metric}</span>
              </div>
              <h3 className="font-bold text-base">{item.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
            </div>

            <div className="p-3 rounded-xl bg-secondary/50 border border-border space-y-1">
              <span className="text-[11px] font-semibold text-primary flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5" /> Action Plan
              </span>
              <p className="text-xs text-foreground font-medium">{item.action}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
