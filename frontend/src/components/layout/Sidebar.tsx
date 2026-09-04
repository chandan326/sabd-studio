'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Sparkles, 
  FileText, 
  Search, 
  Image as ImageIcon, 
  Calendar, 
  Share2, 
  BarChart3, 
  Lightbulb, 
  Palette, 
  Settings, 
  ShieldCheck 
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Campaigns', href: '/dashboard/campaigns', icon: Sparkles },
  { name: 'Content Studio', href: '/dashboard/studio', icon: FileText },
  { name: 'SEO Analyzer', href: '/dashboard/seo', icon: Search },
  { name: 'Thumbnail Studio', href: '/dashboard/thumbnails', icon: ImageIcon },
  { name: 'Content Calendar', href: '/dashboard/calendar', icon: Calendar },
  { name: 'Integrations', href: '/dashboard/integrations', icon: Share2 },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { name: 'AI Performance Advisor', href: '/dashboard/recommendations', icon: Lightbulb },
  { name: 'Brand Voice', href: '/dashboard/settings/brand', icon: Palette },
  { name: 'Team & Workspace', href: '/dashboard/settings/team', icon: Settings },
  { name: 'Audit Logs', href: '/dashboard/settings/audit', icon: ShieldCheck },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-border bg-card/60 backdrop-blur-md flex flex-col justify-between hidden md:flex min-h-screen">
      <div>
        {/* Brand Logo */}
        <div className="h-16 px-6 border-b border-border flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center font-bold text-white shadow-lg shadow-primary/25">
            CF
          </div>
          <div>
            <span className="font-bold text-base bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              CreatorFlow AI
            </span>
            <span className="block text-[10px] text-muted-foreground font-mono">Pipeline v1.0</span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-1.5">
          {navigation.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-primary text-primary-foreground font-semibold shadow-md shadow-primary/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Demo Status Footer */}
      <div className="p-4 m-4 border border-border/80 rounded-xl bg-secondary/30">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            Engine Active
          </span>
          <span className="text-muted-foreground text-[10px] bg-secondary px-1.5 py-0.5 rounded">Demo Ready</span>
        </div>
        <p className="text-[11px] text-muted-foreground leading-tight mt-1">
          Deterministic LLM Fallback mode active. No external API keys required.
        </p>
      </div>
    </aside>
  );
}
