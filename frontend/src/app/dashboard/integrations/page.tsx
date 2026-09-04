'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Youtube, Instagram, Linkedin, Twitter, CheckCircle2, XCircle, Link as LinkIcon, Download } from 'lucide-react';

export default function IntegrationsPage() {
  const { data: integrations = [], isLoading, refetch } = useQuery({
    queryKey: ['integrations'],
    queryFn: () => api.getIntegrations(),
  });

  const handleConnect = async (provider: string) => {
    try {
      await api.connectIntegration(provider);
      alert(`Connected to ${provider.toUpperCase()} (Demo Provider Adapter)`);
      refetch();
    } catch (e: any) {
      alert(e.message || 'Connection failed');
    }
  };

  const handleDisconnect = async (id: string) => {
    try {
      await api.disconnectIntegration(id);
      refetch();
    } catch (e: any) {
      alert('Disconnect failed');
    }
  };

  const getIcon = (provider: string) => {
    if (provider === 'youtube') return <Youtube className="h-6 w-6 text-red-500" />;
    if (provider === 'instagram') return <Instagram className="h-6 w-6 text-pink-500" />;
    if (provider === 'linkedin') return <Linkedin className="h-6 w-6 text-blue-500" />;
    if (provider === 'twitter') return <Twitter className="h-6 w-6 text-sky-400" />;
    return <LinkIcon className="h-6 w-6 text-primary" />;
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-4">
        <h1 className="text-2xl font-bold">Platform Integrations</h1>
        <p className="text-xs text-muted-foreground">Connect official platform APIs for automated publishing. Unconfigured channels fall back to Content Package Export.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {integrations.map((item: any) => (
          <div key={item.provider} className="p-6 rounded-2xl border border-border bg-card shadow-xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-secondary">{getIcon(item.provider)}</div>
              <div>
                <h3 className="font-bold text-sm capitalize">{item.provider}</h3>
                <p className="text-xs text-muted-foreground">{item.display_name}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  {item.status === 'connected' ? (
                    <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Connected (Demo API Adapter)
                    </span>
                  ) : (
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <XCircle className="h-3 w-3 text-muted-foreground" /> Unconfigured
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div>
              {item.status === 'connected' ? (
                <button
                  onClick={() => handleDisconnect(item.id)}
                  className="border border-border text-xs px-3.5 py-1.5 rounded-lg text-muted-foreground hover:text-destructive"
                >
                  Disconnect
                </button>
              ) : (
                <button
                  onClick={() => handleConnect(item.provider)}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs px-4 py-2 rounded-lg shadow-md shadow-primary/20"
                >
                  Connect API
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
