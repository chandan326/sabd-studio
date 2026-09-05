'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Sparkles, 
  FileText,
  Clapperboard,
  Search, 
  Image as ImageIcon, 
  Calendar, 
  Share2, 
  BarChart3, 
  Lightbulb, 
  Palette, 
  Settings, 
  ShieldCheck 
  ,ChevronDown
  ,WandSparkles
} from 'lucide-react';

const navGroups = [
  { label: 'Create', items: [{ name: 'Campaigns', href: '/dashboard/campaigns', icon: Sparkles }, { name: 'Content Studio', href: '/dashboard/studio', icon: FileText }, { name: 'AI Clip Studio', href: '/dashboard/clips', icon: WandSparkles }, { name: 'Media Editor', href: '/dashboard/media', icon: Clapperboard }, { name: 'Thumbnail Studio', href: '/dashboard/thumbnails', icon: ImageIcon }] },
  { label: 'Publish & improve', items: [{ name: 'SEO Analyzer', href: '/dashboard/seo', icon: Search }, { name: 'Content Calendar', href: '/dashboard/calendar', icon: Calendar }, { name: 'Integrations', href: '/dashboard/integrations', icon: Share2 }, { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 }, { name: 'AI Advisor', href: '/dashboard/recommendations', icon: Lightbulb }] },
  { label: 'Workspace', items: [{ name: 'Brand Voice', href: '/dashboard/settings/brand', icon: Palette }, { name: 'Team & Workspace', href: '/dashboard/settings/team', icon: Settings }, { name: 'Audit Logs', href: '/dashboard/settings/audit', icon: ShieldCheck }] },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 h-screen w-64 shrink-0 border-r border-border bg-white hidden md:flex flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        {/* Brand Logo */}
        <div className="h-16 px-6 border-b border-border flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center font-bold text-white shadow-sm">
            S
          </div>
          <div>
            <span className="font-semibold text-base text-slate-900">
              Sabd Studio
            </span>
            <span className="block text-[10px] text-muted-foreground font-mono">Pipeline v1.0</span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-2">
          <Link href="/dashboard" className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold ${pathname === '/dashboard' ? 'bg-blue-50 text-primary' : 'text-slate-600 hover:bg-slate-50'}`}><LayoutDashboard className="h-4 w-4" /> Overview</Link>
          {navGroups.map(group => {
            const groupActive = group.items.some(item => pathname?.startsWith(item.href));
            return <details key={group.label} open={groupActive || group.label === 'Create'} className="group rounded-xl border border-slate-100 bg-white">
              <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500"><span>{group.label}</span><ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" /></summary>
              <div className="space-y-1 px-2 pb-2">{group.items.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-blue-50 text-primary font-semibold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-slate-50'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                {item.name}
              </Link>
            );
              })}</div>
            </details>;
          })}
        </nav>
      </div>

      {/* Demo Status Footer */}
      <div className="shrink-0 p-3 m-3 border border-border/80 rounded-xl bg-secondary/30">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="font-semibold text-primary flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-primary" />
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
