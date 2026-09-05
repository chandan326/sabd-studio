'use client';

import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import TrimTimeline from '@/components/TrimTimeline';
import { downloadMedia, renderVideoLocally } from '@/lib/media-render';
import { Captions, Download, Film, FolderCheck, Mic2, Play, Save, SlidersHorizontal, Upload, Volume2, VolumeX } from 'lucide-react';

const aspectClasses: Record<string, string> = { '16:9': 'aspect-video', '9:16': 'aspect-[9/16]', '1:1': 'aspect-square', '4:5': 'aspect-[4/5]' };
const filterPresets: Record<string, string> = { none: '', grayscale: 'grayscale(1)', sepia: 'sepia(.8)', cinematic: 'contrast(1.18) saturate(.82)', vivid: 'contrast(1.08) saturate(1.4)', cool: 'hue-rotate(12deg) saturate(1.12)', soft: 'contrast(.92) saturate(.9) brightness(1.08)' };

export default function MediaEditorPage() {
  const mediaRef = useRef<HTMLVideoElement>(null);
  const previewTimerRef = useRef<number | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [campaignId, setCampaignId] = useState('');
  const [duration, setDuration] = useState(30);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(30);
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [filter, setFilter] = useState('none');
  const [caption, setCaption] = useState('');
  const [muted, setMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [voiceText, setVoiceText] = useState('');
  const [voiceLanguage, setVoiceLanguage] = useState('en-IN');
  const [voiceRate, setVoiceRate] = useState(1);
  const [voicePitch, setVoicePitch] = useState(1);
  const [quality, setQuality] = useState('1080p');
  const [renderUrl, setRenderUrl] = useState('');
  const [voiceoverUrl, setVoiceoverUrl] = useState('');
  const [renderedBlob, setRenderedBlob] = useState<Blob | null>(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Choose a video or audio file to begin.');
  const [busy, setBusy] = useState(false);

  const { data: campaigns = [] } = useQuery({ queryKey: ['campaigns'], queryFn: () => api.getCampaigns() });

  useEffect(() => { try { const raw = localStorage.getItem('sabd_clip_handoff'); if (!raw) return; const clip = JSON.parse(raw); setTrimStart(Number(clip.start)||0); setTrimEnd(Number(clip.end)||30); setAspectRatio(clip.aspect||'9:16'); setCaption(clip.caption||''); setStatus(`Clip preset “${clip.title||'AI highlight'}” loaded. Upload your authorised original video to render it.`); localStorage.removeItem('sabd_clip_handoff'); } catch {} }, []);

  useEffect(() => () => {
    if (previewTimerRef.current) window.clearTimeout(previewTimerRef.current);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const selectFile = (selected: File | null) => {
    if (!selected) return;
    if (!selected.type.startsWith('video/') && !selected.type.startsWith('audio/')) { setStatus('Please choose a supported video or audio file.'); return; }
    if (selected.size > 500 * 1024 * 1024) { setStatus('File must be smaller than 500 MB.'); return; }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(selected); setPreviewUrl(URL.createObjectURL(selected)); setRenderUrl(''); setRenderedBlob(null); setStatus(`${selected.name} ready for editing.`);
  };

  const syncDuration = () => {
    const value = Math.max(1, Math.floor(mediaRef.current?.duration || 30));
    setDuration(value); setTrimStart(current => Math.min(current, Math.max(0,value-.1))); setTrimEnd(current => Math.min(current || value,value));
  };

  const previewTrim = () => {
    if (!mediaRef.current) return;
    if (previewTimerRef.current) window.clearTimeout(previewTimerRef.current);
    mediaRef.current.currentTime = trimStart;
    mediaRef.current.playbackRate = playbackRate;
    void mediaRef.current.play();
    previewTimerRef.current = window.setTimeout(() => mediaRef.current?.pause(), Math.max(250, (trimEnd - trimStart) * 1000 / playbackRate));
  };

  const previewFilter = `${filterPresets[filter]} brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`.trim();
  const edits = { trim_start: trimStart, trim_end: trimEnd, aspect_ratio: aspectRatio, filter, brightness, contrast, saturation, muted, playback_rate: playbackRate, caption, quality, voiceover: { text: voiceText, language: voiceLanguage, rate: voiceRate, pitch: voicePitch } };

  const previewVoice = () => {
    if (!voiceText.trim() || !('speechSynthesis' in window)) { setStatus('Enter voice-over text in a supported browser first.'); return; }
    window.speechSynthesis.cancel();
    const speech = new SpeechSynthesisUtterance(voiceText); speech.lang = voiceLanguage; speech.rate = voiceRate; speech.pitch = voicePitch;
    window.speechSynthesis.speak(speech); setStatus('Voice-over preview playing. ElevenLabs can render the selected voice after its API key is configured.');
  };

  const saveProject = () => {
    if (!file) { setStatus('Choose a media file first.'); return; }
    localStorage.setItem('sabd_media_project', JSON.stringify({ source: file.name, campaignId, edits, savedAt: new Date().toISOString() }));
    setStatus('Project settings saved in this browser.');
  };

  const saveRender = async () => {
    if (!file) { setStatus('Choose a media file first.'); return; }
    if (trimEnd <= trimStart) { setStatus('Trim end must be after trim start.'); return; }
    if (!file.type.startsWith('video/')) { setStatus('Local visual rendering currently requires a video file. Audio projects can still be saved.'); return; }
    setBusy(true); setProgress(0); setStatus('Rendering locally in your browser…');
    try {
      const blob = await renderVideoLocally({ sourceUrl: previewUrl, start: trimStart, end: trimEnd, aspect: aspectRatio, filter: previewFilter, caption, muted, playbackRate, quality: quality === '720p' ? '720p' : '1080p' }, setProgress);
      setRenderedBlob(blob); setStatus('Render complete. Download is ready.');
      if (campaignId) {
        const source = await api.uploadCampaignFile(campaignId, file);
        const result = await api.renderCampaignMedia(campaignId, { source_asset_id: source.id, edits });
        setRenderUrl(result.render_url || ''); setVoiceoverUrl(result.voiceover_url || '');
      }
    } catch (error: any) { setStatus(error.message || 'Media render failed.'); }
    finally { setBusy(false); }
  };

  const downloadRecipe = () => {
    const blob = new Blob([JSON.stringify({ source: file?.name, campaign_id: campaignId, edits }, null, 2)], { type: 'application/json' });
    const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = 'sabd-studio-edit.json'; link.click(); URL.revokeObjectURL(link.href);
  };

  return <div className="space-y-6">
    <div className="border-b border-border pb-4"><h1 className="flex items-center gap-2 text-2xl font-bold"><Film className="h-6 w-6 text-primary" /> Media Editor</h1><p className="mt-1 text-xs text-muted-foreground">Upload, preview, trim, reframe, filter, caption, and prepare media for publishing.</p></div>
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-4">
      <section className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
        {!previewUrl ? <label className="grid min-h-80 cursor-pointer place-items-center rounded-xl border-2 border-dashed border-blue-200 bg-blue-50/60 text-center hover:bg-blue-50"><span><Upload className="mx-auto h-9 w-9 text-primary" /><strong className="mt-3 block text-sm">Upload video or audio</strong><span className="mt-1 block text-xs text-muted-foreground">MP4, WebM, MOV, MP3, WAV · up to 500 MB</span></span><input className="sr-only" type="file" accept="video/*,audio/*" onChange={(event) => selectFile(event.target.files?.[0] || null)} /></label> : <div className="space-y-4">
          <div className={`relative mx-auto max-h-[560px] overflow-hidden rounded-xl bg-black ${aspectClasses[aspectRatio]}`}><video ref={mediaRef} src={previewUrl} controls muted={muted} onLoadedMetadata={syncDuration} onTimeUpdate={() => { if (mediaRef.current && mediaRef.current.currentTime >= trimEnd) mediaRef.current.pause(); }} style={{ filter: previewFilter }} className="h-full w-full object-cover" />{caption ? <div className="pointer-events-none absolute inset-x-4 bottom-12 text-center"><span className="rounded bg-black/75 px-3 py-1.5 text-sm font-semibold text-white">{caption}</span></div> : null}</div>
          <button onClick={previewTrim} className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-xs font-semibold hover:bg-slate-50"><Play className="h-4 w-4" /> Preview selection</button>
        </div>}
        <p role="status" className="rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-800">{status}</p>
      </section>
      <TrimTimeline compact duration={duration} start={trimStart} end={trimEnd} disabled={!file} onChange={(start, end) => { setTrimStart(start); setTrimEnd(end); setRenderedBlob(null); }} onPreview={previewTrim} />
      </div>

      <aside className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-sm lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto">
        <div><p className="text-sm font-bold">Editing controls</p><p className="text-[11px] text-muted-foreground">Changes appear instantly in the preview.</p></div>
        <label className="block text-xs font-semibold">Campaign<select value={campaignId} onChange={e => setCampaignId(e.target.value)} className="mt-1.5 w-full rounded-lg border border-border bg-white px-3 py-2 text-xs"><option value="">Choose campaign</option>{campaigns.map((item: any) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label className="block text-xs font-semibold">Visual filter<select value={filter} onChange={e => setFilter(e.target.value)} className="mt-1.5 w-full rounded-lg border border-border bg-white px-3 py-2 text-xs">{Object.keys(filterPresets).map(value => <option key={value} value={value}>{value[0].toUpperCase() + value.slice(1)}</option>)}</select></label>
        <div className="space-y-3 rounded-xl border border-border bg-slate-50 p-3"><p className="flex items-center gap-2 text-xs font-semibold"><SlidersHorizontal className="h-4 w-4 text-primary" /> Fine adjustments</p>{[['Brightness', brightness, setBrightness], ['Contrast', contrast, setContrast], ['Saturation', saturation, setSaturation]].map(([label, value, setter]: any) => <label key={label} className="block text-[11px] text-muted-foreground"><span className="flex justify-between"><span>{label}</span><span>{value}%</span></span><input type="range" min="50" max="150" value={value} onChange={event => setter(Number(event.target.value))} className="mt-1 w-full" /></label>)}</div>
        <label className="block text-xs font-semibold">Playback speed<select value={playbackRate} onChange={e => setPlaybackRate(Number(e.target.value))} className="mt-1.5 w-full rounded-lg border border-border bg-white px-3 py-2 text-xs"><option value="0.75">0.75×</option><option value="1">1×</option><option value="1.25">1.25×</option><option value="1.5">1.5×</option><option value="2">2×</option></select></label>
        <label className="block text-xs font-semibold"><span className="flex items-center gap-2"><Captions className="h-4 w-4 text-primary" /> Caption overlay</span><textarea rows={3} value={caption} onChange={e => setCaption(e.target.value)} placeholder="Add on-screen caption…" className="mt-1.5 w-full rounded-lg border border-border px-3 py-2 text-xs" /></label>
        <div className="space-y-3 rounded-xl border border-blue-200 bg-blue-50/50 p-3"><p className="flex items-center gap-2 text-xs font-semibold"><Mic2 className="h-4 w-4 text-primary" /> AI voice-over</p><textarea rows={3} value={voiceText} onChange={event => setVoiceText(event.target.value)} placeholder="Enter voice-over script…" className="w-full rounded-lg border border-border bg-white px-3 py-2 text-xs" /><div className="grid grid-cols-3 gap-2"><select aria-label="Voice language" value={voiceLanguage} onChange={event => setVoiceLanguage(event.target.value)} className="rounded-lg border border-border bg-white p-2 text-[10px]"><option value="en-IN">English IN</option><option value="en-GB">English UK</option><option value="hi-IN">Hindi</option></select><select aria-label="Voice speed" value={voiceRate} onChange={event => setVoiceRate(Number(event.target.value))} className="rounded-lg border border-border bg-white p-2 text-[10px]"><option value="0.85">Calm</option><option value="1">Natural</option><option value="1.15">Energetic</option></select><select aria-label="Voice pitch" value={voicePitch} onChange={event => setVoicePitch(Number(event.target.value))} className="rounded-lg border border-border bg-white p-2 text-[10px]"><option value="0.85">Low</option><option value="1">Natural</option><option value="1.15">Bright</option></select></div><button onClick={previewVoice} className="w-full rounded-lg border border-primary bg-white px-3 py-2 text-xs font-semibold text-primary">Preview voice</button></div>
        <button onClick={() => setMuted(value => !value)} className="flex w-full items-center justify-between rounded-lg border border-border px-3 py-2 text-xs font-semibold"><span>{muted ? 'Audio muted' : 'Audio enabled'}</span>{muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4 text-primary" />}</button>
        {voiceoverUrl ? <a href={voiceoverUrl} target="_blank" rel="noreferrer" className="flex w-full items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-xs font-semibold"><Mic2 className="h-4 w-4 text-primary" /> Open generated voice-over</a> : null}
      </aside>
    </div>
    <section className="sticky bottom-3 z-20 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-xl backdrop-blur"><div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between"><div className="flex-1"><p className="mb-2 text-xs font-semibold">Output canvas</p><div className="flex flex-wrap gap-2">{Object.keys(aspectClasses).map(value => <button key={value} onClick={() => setAspectRatio(value)} className={`rounded-lg border px-4 py-2 text-xs font-semibold ${aspectRatio === value ? 'border-primary bg-blue-50 text-primary' : 'border-border'}`}>{value}</button>)}</div></div><label className="text-xs font-semibold">Quality<select value={quality} onChange={event => setQuality(event.target.value)} className="mt-1 block rounded-lg border border-border bg-white px-3 py-2 text-xs"><option value="720p">HD 720p</option><option value="1080p">Full HD 1080p</option><option value="1440p">2K cloud</option><option value="2160p">4K cloud</option></select></label><div className="flex flex-wrap gap-2"><button disabled={!file} onClick={saveProject} className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-xs font-semibold disabled:opacity-50"><FolderCheck className="h-4 w-4" /> Save project</button><button disabled={busy || !file} onClick={saveRender} className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-xs font-semibold text-white disabled:opacity-50"><Save className="h-4 w-4" />{busy ? `Rendering ${progress}%` : 'Render video'}</button><button disabled={!renderedBlob} onClick={() => renderedBlob && downloadMedia(renderedBlob, `${file?.name.replace(/\.[^.]+$/, '') || 'video'}-edited.webm`)} className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-xs font-semibold text-white disabled:opacity-40"><Download className="h-4 w-4" /> Download video</button><button disabled={!file} onClick={downloadRecipe} className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-xs font-semibold disabled:opacity-50"><Download className="h-4 w-4" /> Recipe</button></div></div>{renderUrl ? <a href={renderUrl} target="_blank" rel="noreferrer" className="mt-3 inline-block text-xs font-semibold text-primary">Open cloud render →</a> : null}</section>
  </div>;
}
