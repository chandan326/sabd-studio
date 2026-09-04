'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Sparkles, 
  Youtube, 
  Instagram, 
  Linkedin, 
  Twitter, 
  BookOpen, 
  Video, 
  Zap, 
  Search, 
  Calendar, 
  CheckCircle2, 
  ArrowRight,
  Shield,
  Layers,
  BarChart
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header Navigation */}
      <nav className="border-b border-border/80 bg-card/60 backdrop-blur-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center font-bold text-white shadow-lg shadow-primary/25">
              CF
            </div>
            <span className="font-bold text-lg bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              CreatorFlow AI
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground font-medium">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</a>
            <a href="#platforms" className="hover:text-foreground transition-colors">Platforms</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs px-4 py-2.5 rounded-lg shadow-lg shadow-primary/25 flex items-center gap-2 transition-all"
            >
              Start Free Trial <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-24 px-6 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="max-w-5xl mx-auto text-center space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-semibold">
            <Sparkles className="h-3.5 w-3.5" />
            Next-Gen Creator Pipeline Automation
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight">
            From One Idea to an Entire{' '}
            <span className="bg-gradient-to-r from-primary via-cyan-400 to-accent bg-clip-text text-transparent">
              Content Pipeline
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Stop doing manual repurposing. Upload a video, transcript, document, or raw topic idea — CreatorFlow AI generates optimized titles, SEO descriptions, carousel outlines, LinkedIn posts, Twitter threads, blog drafts, and Short scripts in seconds.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/dashboard"
              className="w-full sm:w-auto bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white font-semibold text-sm px-8 py-3.5 rounded-xl shadow-xl shadow-primary/30 flex items-center justify-center gap-2 transition-all"
            >
              Launch Live App Demo <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/register"
              className="w-full sm:w-auto bg-secondary/80 hover:bg-secondary border border-border text-foreground font-medium text-sm px-6 py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all"
            >
              Create Account
            </Link>
          </div>

          {/* Platform Badges */}
          <div className="pt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground font-medium">
            <span>Tailored outputs for:</span>
            <div className="flex items-center gap-2 bg-secondary/40 border border-border px-3 py-1.5 rounded-lg text-foreground">
              <Youtube className="h-4 w-4 text-red-500" /> YouTube
            </div>
            <div className="flex items-center gap-2 bg-secondary/40 border border-border px-3 py-1.5 rounded-lg text-foreground">
              <Instagram className="h-4 w-4 text-pink-500" /> Instagram
            </div>
            <div className="flex items-center gap-2 bg-secondary/40 border border-border px-3 py-1.5 rounded-lg text-foreground">
              <Linkedin className="h-4 w-4 text-blue-500" /> LinkedIn
            </div>
            <div className="flex items-center gap-2 bg-secondary/40 border border-border px-3 py-1.5 rounded-lg text-foreground">
              <Twitter className="h-4 w-4 text-sky-400" /> X / Twitter
            </div>
            <div className="flex items-center gap-2 bg-secondary/40 border border-border px-3 py-1.5 rounded-lg text-foreground">
              <BookOpen className="h-4 w-4 text-emerald-400" /> Blog
            </div>
            <div className="flex items-center gap-2 bg-secondary/40 border border-border px-3 py-1.5 rounded-lg text-foreground">
              <Video className="h-4 w-4 text-amber-400" /> Shorts
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 px-6 border-t border-border/60 bg-card/20">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-bold">Built for Modern Creators & Marketing Teams</h2>
            <p className="text-muted-foreground text-sm max-w-2xl mx-auto">
              Everything you need to automate content creation, audit SEO, schedule posts, and track metrics in one place.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl border border-border bg-card/60 space-y-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Zap className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-lg">Multi-Platform Asset Generator</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Generate 6 platform packs with titles, SEO descriptions, keywords, timestamps, carousel outlines, threads, and short scripts simultaneously.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-border bg-card/60 space-y-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <Search className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-lg">8-Rule SEO Scoring Assistant</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Evaluate keyword placement, readability, title length, missing metadata, and search intent with real 0-100 scores and actionable fix tips.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-border bg-card/60 space-y-3">
              <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                <Calendar className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-lg">Visual Content Calendar</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Schedule approved assets across timezones with drag-and-drop flexibility, platform filters, and automated publishing adapters.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Placeholder */}
      <section id="pricing" className="py-20 px-6 border-t border-border/60">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-bold">Simple, Transparent Pricing</h2>
            <p className="text-muted-foreground text-sm">Scale your content output without scaling your manual workload.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl border border-border bg-card space-y-4">
              <h3 className="font-bold text-lg">Free Starter</h3>
              <div className="text-3xl font-extrabold">$0 <span className="text-xs text-muted-foreground font-normal">/month</span></div>
              <ul className="text-xs space-y-2 text-muted-foreground">
                <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> 3 Campaigns / mo</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Standard LLM Generation</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Basic Content Studio</li>
              </ul>
              <Link href="/register" className="block text-center w-full py-2 rounded-lg border border-border text-xs font-semibold">Get Started</Link>
            </div>

            <div className="p-6 rounded-2xl border-2 border-primary bg-primary/5 space-y-4 relative">
              <span className="absolute -top-3 right-4 bg-primary text-primary-foreground text-[10px] font-bold px-2.5 py-0.5 rounded-full">POPULAR</span>
              <h3 className="font-bold text-lg">Creator Pro</h3>
              <div className="text-3xl font-extrabold">$29 <span className="text-xs text-muted-foreground font-normal">/month</span></div>
              <ul className="text-xs space-y-2 text-muted-foreground">
                <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Unlimited Campaigns</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Advanced SEO Analyzer</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Brand Voice Customization</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Content Calendar Scheduling</li>
              </ul>
              <Link href="/register" className="block text-center w-full py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold shadow-lg shadow-primary/25">Start Pro Trial</Link>
            </div>

            <div className="p-6 rounded-2xl border border-border bg-card space-y-4">
              <h3 className="font-bold text-lg">Agency Team</h3>
              <div className="text-3xl font-extrabold">$99 <span className="text-xs text-muted-foreground font-normal">/month</span></div>
              <ul className="text-xs space-y-2 text-muted-foreground">
                <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Multi-Workspace Isolation</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Team Role Permissions</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> API Access & Audit Logs</li>
              </ul>
              <Link href="/register" className="block text-center w-full py-2 rounded-lg border border-border text-xs font-semibold">Contact Sales</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-border py-8 px-6 bg-card/40 text-xs text-muted-foreground">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 CreatorFlow AI. Production-grade hackathon application.</p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-foreground">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-foreground">Terms of Service</Link>
            <Link href="/api/docs/" target="_blank" className="hover:text-foreground">API Docs</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
