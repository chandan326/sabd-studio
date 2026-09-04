'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, Plus, Sun, Moon, User as UserIcon, LogOut, CheckCircle2, AlertCircle } from 'lucide-react';
import { api, clearAuthToken } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';

export default function Header() {
  const router = useRouter();
  const [showNotifications, setShowNotifications] = useState(false);
  const [isDark, setIsDark] = useState(true);

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.getNotifications(),
    refetchInterval: 10000,
  });

  const toggleTheme = () => {
    setIsDark(!isDark);
    if (isDark) {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    }
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch (e) {
      console.warn(e);
    }
    clearAuthToken();
    router.push('/login');
  };

  const unreadCount = notifications.filter((n: any) => !n.read).length;

  return (
    <header className="h-16 border-b border-border bg-card/40 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Workspace Context Switcher */}
      <div className="flex items-center gap-3">
        <div className="bg-secondary/80 border border-border px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm font-medium">
          <span className="h-2 w-2 rounded-full bg-primary" />
          <span>Alex's Creator Studio</span>
          <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-mono">PRO</span>
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/campaigns/new"
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs px-3.5 py-2 rounded-lg flex items-center gap-1.5 shadow-md shadow-primary/20 transition-all"
        >
          <Plus className="h-4 w-4" />
          New Campaign
        </Link>

        {/* Theme Switcher */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-all"
          title="Toggle Theme"
        >
          {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-indigo-500" />}
        </button>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-all relative"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-accent animate-ping" />
            )}
          </button>

          {/* Notification Drawer Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-xl shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between border-b border-border pb-2 mb-3">
                <span className="font-semibold text-sm">Notifications</span>
                <span className="text-xs text-muted-foreground">{notifications.length} total</span>
              </div>
              <div className="space-y-2.5 max-h-64 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-4 text-center">No notifications yet.</p>
                ) : (
                  notifications.map((item: any) => (
                    <div key={item.id} className="p-2.5 rounded-lg bg-secondary/40 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 font-medium text-foreground">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                        {item.title}
                      </div>
                      <p className="text-muted-foreground text-[11px] leading-relaxed">{item.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Menu / Logout */}
        <button
          onClick={handleLogout}
          className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
          title="Sign Out"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
