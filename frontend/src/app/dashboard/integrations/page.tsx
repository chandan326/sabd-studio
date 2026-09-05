'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Check, Clipboard, Cloud, Database, Mail, PlugZap, Share2, Sparkles, Subtitles } from 'lucide-react';

const iconMap: Record<string, any> = { Publishing: Share2, Media: Cloud, Data: Database, AI: Sparkles, Transcription: Subtitles, Voice: Subtitles, Email: Mail };

export default function IntegrationsPage() {
  const [message, setMessage] = useState('');
  const { data: integrations = [], isLoading } = useQuery({ queryKey: ['integrations'], queryFn: () => api.getIntegrations() });

  const copyVariables = async (variables: string[]) => {
    await navigator.clipboard.writeText(variables.map(key => `${key}=`).join('\n'));
    setMessage('Environment variable template copied. Add values in Vercel → Project Settings → Environment Variables.');
  };

  const verify = async (provider: string) => {
    try { await api.connectIntegration(provider); setMessage(`${provider} configuration is ready.`); }
    catch (error: any) { setMessage(error.message || 'Configuration could not be verified.'); }
  };

  if (isLoading) return <div className="py-20 text-center text-xs text-muted-foreground">Checking integration configuration…</div>;

  return <div className="space-y-6">
    <div className="border-b border-border pb-4"><h1 className="flex items-center gap-2 text-2xl font-bold"><PlugZap className="h-6 w-6 text-primary" /> Integration Hub</h1><p className="mt-1 text-xs text-muted-foreground">Configure AI, media, data, email, transcription, and publishing providers without placing secrets in source code.</p></div>
    {message ? <p role="status" className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-xs text-blue-800">{message}</p> : null}
    <div className="grid gap-4 lg:grid-cols-2">
      {integrations.map((item: any) => {
        const Icon = iconMap[item.category] || PlugZap;
        const variables = item.required_env || [];
        return <article key={item.provider} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-start gap-4"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-blue-50 text-primary"><Icon className="h-5 w-5" /></span><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><h2 className="font-semibold capitalize">{item.provider}</h2><span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${item.configured ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{item.configured ? 'Variables ready' : 'Setup required'}</span></div><p className="mt-1 text-xs text-muted-foreground">{item.category} · {item.display_name}</p></div></div>
          <div className="mt-4 rounded-lg bg-slate-50 p-3"><p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Required Vercel variables</p><div className="mt-2 flex flex-wrap gap-1.5">{variables.map((key: string) => <code key={key} className="rounded border border-slate-200 bg-white px-2 py-1 text-[10px] text-slate-700">{key}</code>)}</div></div>
          <div className="mt-4 flex gap-2"><button onClick={() => copyVariables(variables)} className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-semibold hover:bg-slate-50"><Clipboard className="h-3.5 w-3.5" /> Copy variables</button><button onClick={() => verify(item.provider)} className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"><Check className="h-3.5 w-3.5" /> Verify setup</button></div>
        </article>;
      })}
    </div>
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-900"><strong>OAuth note:</strong> Provider credentials enable backend verification. YouTube, Meta, LinkedIn, and X still require approved OAuth redirect URLs and scopes before real publishing can be enabled.</div>
  </div>;
}
