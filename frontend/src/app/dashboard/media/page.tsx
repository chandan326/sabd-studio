'use client';

import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Captions, Download, Film, Mic2, Play, Save, Scissors, SlidersHorizontal, Upload, Volume2, VolumeX } from 'lucide-react';

const aspectClasses: Record<string, string> = { '16:9': 'aspect-video', '9:16': 'aspect-[9/16]', '1:1': 'aspect-square', '4:5': 'aspect-[4/5]' };
const filterPresets: Record<string, string> = { none: '', grayscale: 'grayscale(1)', sepia: 'sepia(.8)', cinematic: 'contrast(1.18) saturate(.82)', vivid: 'contrast(1.08) saturate(1.4)', cool: 'hue-rotate(12deg) saturate(1.12)', soft: 'contrast(.92) saturate(.9) brightness(1.08)' };

export default function MediaEditorPage() {
  const mediaRef = useRef<HTMLVideoElement>(null);
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
  const [status, setStatus] = useState('Choose a video or audio file to begin.');
  const [busy, setBusy] = useState(false);

  const { data: campaigns = [] } = useQuery({ queryKey: ['campaigns'], queryFn: () => api.getCampaigns() });

  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  const selectFile = (selected: File | null) => {
    if (!selected) return;
    if (!selected.type.startsWith('video/') && !selected.type.startsWith('audio/')) { setStatus('Please choose a supported video or audio file.'); return; }
    if (selected.size > 500 * 1024 * 1024) { setStatus('File must be smaller than 500 MB.'); return; }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(selected); setPreviewUrl(URL.createObjectURL(selected)); setRenderUrl(''); setStatus(`${selected.name} ready for editing.`);
  };

  const syncDuration = () => {
    const value = Math.max(1, Math.floor(mediaRef.current?.duration || 30));
    setDuration(value); setTrimEnd(value);
  };

  const previewTrim = () => {
    if (!mediaRef.current) return;
    mediaRef.current.currentTime = trimStart;
    mediaRef.current.playbackRate = playbackRate;
    void mediaRef.current.play();
    window.setTimeout(() => mediaRef.current?.pause(), Math.max(250, (trimEnd - trimStart) * 1000 / playbackRate));
  };

  const previewFilter = `${filterPresets[filter]} brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`.trim();
  const edits = { trim_start: trimStart, trim_end: trimEnd, aspect_ratio: aspectRatio, filter, brightness, contrast, saturation, muted, playback_rate: playbackRate, caption, quality, voiceover: { text: voiceText, language: voiceLanguage, rate: voiceRate, pitch: voicePitch } };

  const previewVoice = () => {
    if (!voiceText.trim() || !('speechSynthesis' in window)) { setStatus('Enter voice-over text in a supported browser first.'); return; }
    window.speechSynthesis.cancel();
    const speech = new SpeechSynthesisUtterance(voiceText); speech.lang = voiceLanguage; speech.rate = voiceRate; speech.pitch = voicePitch;
    window.speechSynthesis.speak(speech); setStatus('Voice-over preview playing. ElevenLabs can render the selected voice after its API key is configured.');
  };

  const saveRender = async () => {
    if (!file) { setStatus('Choose a media file first.'); return; }
    if (!campaignId) { setStatus('Choose a campaign so the media and edit recipe can be saved.'); return; }
    if (trimEnd <= trimStart) { setStatus('Trim end must be after trim start.'); return; }
    setBusy(true); setStatus('Uploading source and preparing render…');
    try {
      const source = await api.uploadCampaignFile(campaignId, file);
      const result = await api.renderCampaignMedia(campaignId, { source_asset_id: source.id, edits });
      setRenderUrl(result.render_url || '');
      setVoiceoverUrl(result.voiceover_url || '');
      setStatus(result.render_url ? 'Cloud render is ready.' : 'Edit recipe saved. Add Cloudinary variables for server rendering.');
    } catch (error: any) { setStatus(error.message || 'Media render failed.'); }
    finally { setBusy(false); }
  };

  const downloadRecipe = () => {
    const blob = new Blob([JSON.stringify({ source: file?.name, campaign_id: campaignId, edits }, null, 2)], { type: 'application/json' });
    const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = 'sabd-studio-edit.json'; link.click(); URL.revokeObjectURL(link.href);
  };

  return <div className="space-y-6">
    <div className="border-b border-border pb-4"><h1 className="flex items-center gap-2 text-2xl font-bold"><Film className="h-6 w-6 text-primary" /> Media Editor</h1><p className="mt-1 text-xs text-muted-foreground">Upload, preview, trim, reframe, filter, caption, and prepare media for publishing.</p></div>
    <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
      <section className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
        {!previewUrl ? <label className="grid min-h-80 cursor-pointer place-items-center rounded-xl border-2 border-dashed border-blue-200 bg-blue-50/60 text-center hover:bg-blue-50"><span><Upload className="mx-auto h-9 w-9 text-primary" /><strong className="mt-3 block text-sm">Upload video or audio</strong><span className="mt-1 block text-xs text-muted-foreground">MP4, WebM, MOV, MP3, WAV · up to 500 MB</span></span><input className="sr-only" type="file" accept="video/*,audio/*" onChange={(event) => selectFile(event.target.files?.[0] || null)} /></label> : <div className="space-y-4">
          <div className={`relative mx-auto max-h-[560px] overflow-hidden rounded-xl bg-black ${aspectClasses[aspectRatio]}`}><video ref={mediaRef} src={previewUrl} controls muted={muted} onLoadedMetadata={syncDuration} onTimeUpdate={() => { if (mediaRef.current && mediaRef.current.currentTime >= trimEnd) mediaRef.current.pause(); }} style={{ filter: previewFilter }} className="h-full w-full object-cover" />{caption ? <div className="pointer-events-none absolute inset-x-4 bottom-12 text-center"><span className="rounded bg-black/75 px-3 py-1.5 text-sm font-semibold text-white">{caption}</span></div> : null}</div>
          <div className="rounded-xl border border-border bg-slate-50 p-4"><div className="mb-3 flex items-center justify-between"><span className="flex items-center gap-2 text-xs font-semibold"><Scissors className="h-4 w-4 text-primary" /> Trim range</span><span className="text-xs text-muted-foreground">{trimStart}s – {trimEnd}s</span></div><div className="grid grid-cols-2 gap-4"><label className="text-xs text-muted-foreground">Start<input type="range" min="0" max={Math.max(0, trimEnd - 1)} value={trimStart} onChange={e => setTrimStart(Number(e.target.value))} className="mt-2 w-full" /></label><label className="text-xs text-muted-foreground">End<input type="range" min={trimStart + 1} max={duration} value={trimEnd} onChange={e => setTrimEnd(Number(e.target.value))} className="mt-2 w-full" /></label></div></div>
          <button onClick={previewTrim} className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-xs font-semibold hover:bg-slate-50"><Play className="h-4 w-4" /> Preview selection</button>
        </div>}
        <p role="status" className="rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-800">{status}</p>
      </section>

      <aside className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
        <label className="block text-xs font-semibold">Campaign<select value={campaignId} onChange={e => setCampaignId(e.target.value)} className="mt-1.5 w-full rounded-lg border border-border bg-white px-3 py-2 text-xs"><option value="">Choose campaign</option>{campaigns.map((item: any) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <div><span className="text-xs font-semibold">Canvas</span><div className="mt-2 grid grid-cols-4 gap-2">{Object.keys(aspectClasses).map(value => <button key={value} onClick={() => setAspectRatio(value)} className={`rounded-lg border px-2 py-2 text-xs ${aspectRatio === value ? 'border-primary bg-blue-50 text-primary' : 'border-border'}`}>{value}</button>)}</div></div>
        <label className="block text-xs font-semibold">Visual filter<select value={filter} onChange={e => setFilter(e.target.value)} className="mt-1.5 w-full rounded-lg border border-border bg-white px-3 py-2 text-xs">{Object.keys(filterPresets).map(value => <option key={value} value={value}>{value[0].toUpperCase() + value.slice(1)}</option>)}</select></label>
        <div className="space-y-3 rounded-xl border border-border bg-slate-50 p-3"><p className="flex items-center gap-2 text-xs font-semibold"><SlidersHorizontal className="h-4 w-4 text-primary" /> Fine adjustments</p>{[['Brightness', brightness, setBrightness], ['Contrast', contrast, setContrast], ['Saturation', saturation, setSaturation]].map(([label, value, setter]: any) => <label key={label} className="block text-[11px] text-muted-foreground"><span className="flex justify-between"><span>{label}</span><span>{value}%</span></span><input type="range" min="50" max="150" value={value} onChange={event => setter(Number(event.target.value))} className="mt-1 w-full" /></label>)}</div>
        <label className="block text-xs font-semibold">Playback speed<select value={playbackRate} onChange={e => setPlaybackRate(Number(e.target.value))} className="mt-1.5 w-full rounded-lg border border-border bg-white px-3 py-2 text-xs"><option value="0.75">0.75×</option><option value="1">1×</option><option value="1.25">1.25×</option><option value="1.5">1.5×</option><option value="2">2×</option></select></label>
        <label className="block text-xs font-semibold"><span className="flex items-center gap-2"><Captions className="h-4 w-4 text-primary" /> Caption overlay</span><textarea rows={3} value={caption} onChange={e => setCaption(e.target.value)} placeholder="Add on-screen caption…" className="mt-1.5 w-full rounded-lg border border-border px-3 py-2 text-xs" /></label>
        <div className="space-y-3 rounded-xl border border-blue-200 bg-blue-50/50 p-3"><p className="flex items-center gap-2 text-xs font-semibold"><Mic2 className="h-4 w-4 text-primary" /> AI voice-over</p><textarea rows={3} value={voiceText} onChange={event => setVoiceText(event.target.value)} placeholder="Enter voice-over script…" className="w-full rounded-lg border border-border bg-white px-3 py-2 text-xs" /><div className="grid grid-cols-3 gap-2"><select aria-label="Voice language" value={voiceLanguage} onChange={event => setVoiceLanguage(event.target.value)} className="rounded-lg border border-border bg-white p-2 text-[10px]"><option value="en-IN">English IN</option><option value="en-GB">English UK</option><option value="hi-IN">Hindi</option></select><select aria-label="Voice speed" value={voiceRate} onChange={event => setVoiceRate(Number(event.target.value))} className="rounded-lg border border-border bg-white p-2 text-[10px]"><option value="0.85">Calm</option><option value="1">Natural</option><option value="1.15">Energetic</option></select><select aria-label="Voice pitch" value={voicePitch} onChange={event => setVoicePitch(Number(event.target.value))} className="rounded-lg border border-border bg-white p-2 text-[10px]"><option value="0.85">Low</option><option value="1">Natural</option><option value="1.15">Bright</option></select></div><button onClick={previewVoice} className="w-full rounded-lg border border-primary bg-white px-3 py-2 text-xs font-semibold text-primary">Preview voice</button></div>
        <label className="block text-xs font-semibold">Export quality<select value={quality} onChange={event => setQuality(event.target.value)} className="mt-1.5 w-full rounded-lg border border-border bg-white px-3 py-2 text-xs"><option value="720p">HD · 720p</option><option value="1080p">Full HD · 1080p</option><option value="1440p">2K · 1440p</option><option value="2160p">Ultra HD · 4K</option></select></label>
        <button onClick={() => setMuted(value => !value)} className="flex w-full items-center justify-between rounded-lg border border-border px-3 py-2 text-xs font-semibold"><span>{muted ? 'Audio muted' : 'Audio enabled'}</span>{muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4 text-primary" />}</button>
        <button disabled={busy || !file} onClick={saveRender} className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"><Save className="h-4 w-4" />{busy ? 'Preparing…' : 'Save & render'}</button>
        {renderUrl ? <a href={renderUrl} target="_blank" rel="noreferrer" className="flex w-full items-center justify-center gap-2 rounded-lg border border-primary px-4 py-2.5 text-xs font-semibold text-primary"><Download className="h-4 w-4" /> Open rendered media</a> : <button disabled={!file} onClick={downloadRecipe} className="flex w-full items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-xs font-semibold disabled:opacity-50"><Download className="h-4 w-4" /> Export edit recipe</button>}
        {voiceoverUrl ? <a href={voiceoverUrl} target="_blank" rel="noreferrer" className="flex w-full items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-xs font-semibold"><Mic2 className="h-4 w-4 text-primary" /> Open generated voice-over</a> : null}
      </aside>
    </div>
  </div>;
}
