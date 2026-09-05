export type ExportFormat = 'txt' | 'md' | 'html' | 'json' | 'pdf' | 'png' | 'jpg' | 'webp';

const safeName = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 70) || 'sabd-studio-content';

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url; link.download = filename; document.body.appendChild(link); link.click(); link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character] || character));
}

function buildPdf(title: string, content: string) {
  const clean = `${title}\n\n${content}`.replace(/[^\x20-\x7E\n]/g, '?');
  const sourceLines = clean.split('\n').flatMap(line => line.match(/.{1,88}/g) || ['']);
  const pages: string[][] = [];
  for (let index = 0; index < sourceLines.length; index += 48) pages.push(sourceLines.slice(index, index + 48));
  const objects: string[] = ['<< /Type /Catalog /Pages 2 0 R >>'];
  const pageIds: number[] = [];
  objects.push('PAGES_PLACEHOLDER');
  objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  for (const lines of pages.length ? pages : [[]]) {
    const stream = lines.map((line, index) => `1 0 0 1 54 ${770 - index * 15} Tm (${line.replace(/([\\()])/g, '\\$1')}) Tj`).join('\n');
    const contentId = objects.length + 2;
    const pageId = objects.length + 1;
    pageIds.push(pageId);
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentId} 0 R >>`);
    objects.push(`<< /Length ${stream.length + 18} >>\nstream\nBT /F1 10 Tf\n${stream}\nET\nendstream`);
  }
  objects[1] = `<< /Type /Pages /Kids [${pageIds.map(id => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`;
  let pdf = '%PDF-1.4\n'; const offsets = [0];
  objects.forEach((object, index) => { offsets.push(pdf.length); pdf += `${index + 1} 0 obj\n${object}\nendobj\n`; });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map(offset => `${String(offset).padStart(10, '0')} 00000 n `).join('\n')}\ntrailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new Blob([pdf], { type: 'application/pdf' });
}

function exportImage(title: string, content: string, format: 'png' | 'jpg' | 'webp') {
  const canvas = document.createElement('canvas'); canvas.width = 2400; canvas.height = 1350;
  const context = canvas.getContext('2d'); if (!context) return;
  context.fillStyle = '#ffffff'; context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = '#1a73e8'; context.fillRect(0, 0, 28, canvas.height);
  context.fillStyle = '#0f172a'; context.font = '700 74px Arial'; context.fillText(title.slice(0, 52), 110, 150);
  context.fillStyle = '#475569'; context.font = '36px Arial';
  const words = content.replace(/\s+/g, ' ').split(' '); let line = ''; let y = 245;
  for (const word of words) { const test = `${line}${word} `; if (context.measureText(test).width > 2150) { context.fillText(line, 110, y); line = `${word} `; y += 56; if (y > 1180) break; } else line = test; }
  context.fillText(line, 110, y); context.fillStyle = '#1a73e8'; context.font = '700 28px Arial'; context.fillText('SABD STUDIO', 110, 1270);
  const mime = format === 'jpg' ? 'image/jpeg' : `image/${format}`;
  canvas.toBlob(blob => { if (blob) downloadBlob(blob, `${safeName(title)}.${format}`); }, mime, 1);
}

export function exportContent(title: string, content: string, format: ExportFormat, metadata: Record<string, unknown> = {}) {
  const name = safeName(title);
  if (format === 'png' || format === 'jpg' || format === 'webp') return exportImage(title, content, format);
  if (format === 'pdf') return downloadBlob(buildPdf(title, content), `${name}.pdf`);
  if (format === 'json') return downloadBlob(new Blob([JSON.stringify({ title, content, ...metadata }, null, 2)], { type: 'application/json' }), `${name}.json`);
  if (format === 'html') { const html = `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title></head><body style="font:16px/1.7 Arial;max-width:860px;margin:48px auto;padding:24px"><h1>${escapeHtml(title)}</h1><div>${escapeHtml(content).replace(/\n/g, '<br>')}</div></body></html>`; return downloadBlob(new Blob([html], { type: 'text/html' }), `${name}.html`); }
  const output = format === 'md' ? `# ${title}\n\n${content}` : `${title}\n\n${content}`;
  downloadBlob(new Blob([output], { type: format === 'md' ? 'text/markdown' : 'text/plain' }), `${name}.${format}`);
}
