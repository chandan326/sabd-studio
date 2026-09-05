'use client';

import { Download } from 'lucide-react';
import { exportContent, ExportFormat } from '@/lib/downloads';

const formats: ExportFormat[] = ['pdf', 'png', 'jpg', 'webp', 'txt', 'md', 'html', 'json'];

export default function ExportMenu({ title, content, metadata = {} }: { title: string; content: string; metadata?: Record<string, unknown> }) {
  return <div className="flex items-center gap-2"><Download className="h-4 w-4 text-primary" /><label className="sr-only" htmlFor="export-format">Download format</label><select id="export-format" defaultValue="" onChange={event => { const format = event.target.value as ExportFormat; if (format) exportContent(title, content, format, metadata); event.target.value = ''; }} className="rounded-lg border border-border bg-white px-3 py-2 text-xs font-semibold"><option value="" disabled>Download as…</option>{formats.map(format => <option key={format} value={format}>{format.toUpperCase()}{format === 'png' ? ' · lossless' : format === 'jpg' || format === 'webp' ? ' · max quality' : ''}</option>)}</select></div>;
}
