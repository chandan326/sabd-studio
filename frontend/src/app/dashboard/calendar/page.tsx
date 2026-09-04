'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Calendar as CalendarIcon, Plus, ChevronLeft, ChevronRight, CheckCircle2, Clock, Trash2 } from 'lucide-react';

export default function ContentCalendarPage() {
  const [viewMode, setViewMode] = useState<'month' | 'list'>('month');

  const { data: schedules = [], isLoading, refetch } = useQuery({
    queryKey: ['schedules'],
    queryFn: () => api.getSchedules(),
  });

  const { data: assets = [] } = useQuery({
    queryKey: ['assets'],
    queryFn: () => api.getAssets(),
  });

  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [scheduledFor, setScheduledFor] = useState('');

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssetId || !scheduledFor) return;

    try {
      await api.createSchedule({
        asset_id: selectedAssetId,
        scheduled_for: scheduledFor,
        timezone: 'UTC'
      });
      alert('Content added to calendar schedule!');
      setSelectedAssetId('');
      setScheduledFor('');
      refetch();
    } catch (err: any) {
      alert(err.message || 'Scheduling failed');
    }
  };

  const handleCancelSchedule = async (id: string) => {
    if (confirm('Cancel this scheduled post?')) {
      await api.cancelSchedule(id);
      refetch();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold">Visual Content Calendar</h1>
          <p className="text-xs text-muted-foreground">Schedule and manage multi-platform publishing queues across timezones.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('month')}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold ${
              viewMode === 'month' ? 'bg-primary border-primary text-primary-foreground' : 'border-border bg-card'
            }`}
          >
            Grid Calendar
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold ${
              viewMode === 'list' ? 'bg-primary border-primary text-primary-foreground' : 'border-border bg-card'
            }`}
          >
            List Queue
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Calendar Grid / List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-6 rounded-2xl border border-border bg-card shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <span className="font-bold text-base flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-primary" /> Scheduled Publishing Queue
              </span>
              <span className="text-xs text-muted-foreground">{schedules.length} Items Scheduled</span>
            </div>

            {isLoading ? (
              <div className="py-12 text-center text-xs text-muted-foreground">Loading calendar...</div>
            ) : schedules.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground space-y-2">
                <p>No content scheduled on calendar yet.</p>
                <p className="text-[11px] text-muted-foreground">Select an approved asset on the right panel to schedule.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {schedules.map((item: any) => (
                  <div key={item.id} className="p-4 rounded-xl border border-border bg-secondary/30 flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                          {item.platform}
                        </span>
                        <h4 className="font-bold text-xs">{item.asset_title}</h4>
                      </div>
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 font-mono">
                        <Clock className="h-3 w-3 text-amber-400" />
                        Scheduled: {new Date(item.scheduled_for).toLocaleString()} ({item.timezone})
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-semibold">
                        {item.status}
                      </span>
                      <button
                        onClick={() => handleCancelSchedule(item.id)}
                        className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Schedule New Asset Panel */}
        <div className="space-y-4">
          <form onSubmit={handleCreateSchedule} className="p-6 rounded-2xl border border-border bg-card shadow-xl space-y-4">
            <h3 className="font-bold text-sm">Schedule Approved Asset</h3>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Select Asset</label>
              <select
                value={selectedAssetId}
                onChange={(e) => setSelectedAssetId(e.target.value)}
                required
                className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">-- Choose Asset --</option>
                {assets.map((a: any) => (
                  <option key={a.id} value={a.id}>
                    [{a.platform.toUpperCase()}] {a.title.slice(0, 45)}...
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Target Date & Time (UTC)</label>
              <input
                type="datetime-local"
                value={scheduledFor}
                onChange={(e) => setScheduledFor(e.target.value)}
                required
                className="w-full bg-secondary/50 border border-border rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs py-2.5 rounded-xl shadow-lg shadow-primary/25 flex items-center justify-center gap-2"
            >
              <Plus className="h-4 w-4" /> Add to Content Calendar
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
