'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ShieldCheck, Clock } from 'lucide-react';

export default function AuditLogsPage() {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: () => api.getAuditLogs(),
  });

  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-primary" /> Security & Activity Audit Logs
        </h1>
        <p className="text-xs text-muted-foreground">Trace workspace actions, pipeline triggers, approvals, and security events.</p>
      </div>

      <div className="p-6 rounded-2xl border border-border bg-card shadow-xl space-y-4">
        {isLoading ? (
          <div className="py-12 text-center text-xs text-muted-foreground">Loading audit trail...</div>
        ) : logs.length === 0 ? (
          <div className="py-12 text-center text-xs text-muted-foreground">No audit log entries recorded yet.</div>
        ) : (
          <div className="divide-y divide-border">
            {logs.map((log: any) => (
              <div key={log.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 font-mono">
                    <span className="font-semibold text-primary">{log.action}</span>
                    <span className="text-[10px] text-muted-foreground">[{log.resource_type}: {log.resource_id}]</span>
                  </div>
                  <p className="text-muted-foreground text-[11px]">Actor: {log.actor}</p>
                </div>

                <div className="text-right text-muted-foreground font-mono text-[11px]">
                  {new Date(log.created_at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
