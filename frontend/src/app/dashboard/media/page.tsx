'use client';

import { useEffect, useRef, useState } from 'react';
import TrimTimeline from '@/components/TrimTimeline';
import { downloadMedia, mergeVideoClipsLocally, renderVideoLocally } from '@/lib/media-render';
import { Captions, Download, Film, FolderCheck, Mic2, Play, Plus, RotateCcw, Save, SlidersHorizontal, Trash2, Upload, Volume2, VolumeX } from 'lucide-react';

const aspectClasses: Record<string, string> = { '16:9': 'aspect-video', '9:16': 'aspect-[9/16]', '1:1': 'aspect-square', '4:5': 'aspect-[4/5]' };
const filterPresets: Record<string, string> = { none: '', grayscale: 'grayscale(1)', sepia: 'sepia(.8)', cinematic: 'contrast(1.18) saturate(.82)', vivid: 'contrast(1.08) saturate(1.4)', cool: 'hue-rotate(12deg) saturate(1.12)', soft: 'contrast(.92) saturate(.9) brightness(1.08)' };
type ClipEdit = { duration: number; start: number; end: number; reverse: boolean };
type QueuedClip = ClipEdit & { id: string; file: File; url: string };

export default function MediaEditorPage() {
  const mediaRef = useRef<HTMLVideoElement>(null);
  const previewTimerRef = useRef<number | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
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
  const [renderedBlob, setRenderedBlob] = useState<Blob | null>(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Choose a video or audio file to begin.');
  const [busy, setBusy] = useState(false);
  const [mainEdit, setMainEdit] = useState<ClipEdit>({ duration: 30, start: 0, end: 30, reverse: false });
  const [selectedClipId, setSelectedClipId] = useState('main');
  const [mergeClips, setMergeClips] = useState<QueuedClip[]>([]);

  const selectedQueuedClip = mergeClips.find(clip => clip.id === selectedClipId);
  const activePreviewUrl = selectedQueuedClip?.url || previewUrl;
  const selectedReverse = selectedQueuedClip?.reverse ?? mainEdit.reverse;

  useEffect(() => { try { const raw = localStorage.getItem('sabd_clip_handoff'); if (!raw) return; const clip = JSON.parse(raw); setTrimStart(Number(clip.start)||0); setTrimEnd(Number(clip.end)||30); setAspectRatio(clip.aspect||'9:16'); setCaption(clip.caption||''); setStatus(`Clip preset “${clip.title||'AI highlight'}” loaded. Upload your authorised original video to render it.`); localStorage.removeItem('sabd_clip_handoff'); } catch {} }, []);

  useEffect(() => () => {
    if (previewTimerRef.current) window.clearTimeout(previewTimerRef.current);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const readVideoDuration = (url: string) => new Promise<number>((resolve) => {
    const probe = document.createElement('video'); probe.preload = 'metadata'; probe.src = url;
    probe.onloadedmetadata = () => resolve(Math.max(1, Math.floor(probe.duration || 30)));
    probe.onerror = () => resolve(30);
  });

  const addMergeClips = async (files: FileList | null) => {
    if (!files || !file) { setStatus('Upload the first video, then use Merge to add more clips.'); return; }
    const accepted = Array.from(files).filter(item => item.type.startsWith('video/')).slice(0, Math.max(0, 9 - mergeClips.length));
    const queued = await Promise.all(accepted.map(async item => {
      const url = URL.createObjectURL(item); const clipDuration = await readVideoDuration(url);
      return { id: crypto.randomUUID(), file: item, url, duration: clipDuration, start: 0, end: clipDuration, reverse: false };
    }));
    setMergeClips(current => [...current, ...queued]);
    if (queued[0]) selectQueuedClip(queued[0]);
    setRenderedBlob(null); setStatus(`${accepted.length} clip${accepted.length === 1 ? '' : 's'} added. Select any clip below to edit it.`);
  };

  const removeMergeClip = (id: string) => setMergeClips(current => {
    const target = current.find(item => item.id === id); if (target) URL.revokeObjectURL(target.url);
    if (selectedClipId === id) selectMainClip();
    return current.filter(item => item.id !== id);
  });

  const selectMainClip = () => { setSelectedClipId('main'); setDuration(mainEdit.duration); setTrimStart(mainEdit.start); setTrimEnd(mainEdit.end); };
  const selectQueuedClip = (clip: QueuedClip) => { setSelectedClipId(clip.id); setDuration(clip.duration); setTrimStart(clip.start); setTrimEnd(clip.end); };

  const updateSelectedRange = (start: number, end: number) => {
    setTrimStart(start); setTrimEnd(end); setRenderedBlob(null);
    if (selectedClipId === 'main') setMainEdit(current => ({ ...current, start, end }));
    else setMergeClips(current => current.map(clip => clip.id === selectedClipId ? { ...clip, start, end } : clip));
  };

  const toggleSelectedReverse = () => {
    if (selectedClipId === 'main') setMainEdit(current => ({ ...current, reverse: !current.reverse }));
    else setMergeClips(current => current.map(clip => clip.id === selectedClipId ? { ...clip, reverse: !clip.reverse } : clip));
    setRenderedBlob(null); setStatus(`${selectedReverse ? 'Forward' : 'Reverse'} playback enabled for the selected clip.`);
  };

  const selectFile = (selected: File | null) => {
    if (!selected) return;
    if (!selected.type.startsWith('video/') && !selected.type.startsWith('audio/')) { setStatus('Please choose a supported video or audio file.'); return; }
    if (selected.size > 500 * 1024 * 1024) { setStatus('File must be smaller than 500 MB.'); return; }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(selected); setPreviewUrl(URL.createObjectURL(selected)); setSelectedClipId('main'); setMainEdit({ duration: 30, start: 0, end: 30, reverse: false }); setDuration(30); setTrimStart(0); setTrimEnd(30); setRenderedBlob(null); setStatus(`${selected.name} ready. Use Merge to add up to 9 more clips.`);
  };

  const syncDuration = () => {
    const value = Math.max(1, Math.floor(mediaRef.current?.duration || 30));
    setDuration(value);
    if (selectedClipId === 'main') {
      setMainEdit(current => { const next = { ...current, duration: value, start: Math.min(current.start, Math.max(0, value - .1)), end: current.duration === 30 && current.end === 30 ? value : Math.min(current.end, value) }; setTrimStart(next.start); setTrimEnd(next.end); return next; });
    }
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
    localStorage.setItem('sabd_media_project', JSON.stringify({ source: file.name, edits, main_edit: mainEdit, merge_clips: mergeClips.map(clip => ({ name: clip.file.name, start: clip.start, end: clip.end, reverse: clip.reverse })), savedAt: new Date().toISOString() }));
    setStatus('Project settings saved in this browser.');
  };

  const saveRender = async () => {
    if (!file) { setStatus('Choose a media file first.'); return; }
    if (mainEdit.end <= mainEdit.start || mergeClips.some(clip => clip.end <= clip.start)) { setStatus('Every clip must have an end time after its start time.'); return; }
    if (!file.type.startsWith('video/')) { setStatus('Local visual rendering currently requires a video file. Audio projects can still be saved.'); return; }
    setBusy(true); setProgress(0); setStatus('Rendering locally in your browser…');
    try {
      const renderOptions = { sourceUrl: previewUrl, start: mainEdit.start, end: mainEdit.end, reverse: mainEdit.reverse, aspect: aspectRatio, filter: previewFilter, caption, muted, playbackRate, quality };
      const blob = mergeClips.length || mainEdit.reverse
        ? await mergeVideoClipsLocally(renderOptions, mergeClips.map(clip => ({ sourceUrl: clip.url, start: clip.start, end: clip.end, reverse: clip.reverse })), setProgress)
        : await renderVideoLocally(renderOptions, setProgress);
      setRenderedBlob(blob); setStatus('Render complete. Download is ready.');
    } catch (error: any) { setStatus(error.message || 'Media render failed.'); }
    finally { setBusy(false); }
  };

  const downloadRecipe = () => {
    const blob = new Blob([JSON.stringify({ source: file?.name, edits, main_edit: mainEdit, merge_clips: mergeClips.map(clip => ({ name: clip.file.name, start: clip.start, end: clip.end, reverse: clip.reverse })) }, null, 2)], { type: 'application/json' });
    const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = 'sabd-studio-edit.json'; link.click(); URL.revokeObjectURL(link.href);
  };

  return <div className="space-y-6">
    <div className="border-b border-border pb-4"><h1 className="flex items-center gap-2 text-2xl font-bold"><Film className="h-6 w-6 text-primary" /> Media Editor</h1><p className="mt-1 text-xs text-muted-foreground">Upload, preview, trim, reframe, filter, caption, and prepare media for publishing.</p></div>
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-4">
      <section className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
        {!previewUrl ? <label className="grid min-h-80 cursor-pointer place-items-center rounded-xl border-2 border-dashed border-blue-200 bg-blue-50/60 text-center hover:bg-blue-50"><span><Upload className="mx-auto h-9 w-9 text-primary" /><strong className="mt-3 block text-sm">Upload video or audio</strong><span className="mt-1 block text-xs text-muted-foreground">MP4, WebM, MOV, MP3, WAV · up to 500 MB</span></span><input className="sr-only" type="file" accept="video/*,audio/*" onChange={(event) => selectFile(event.target.files?.[0] || null)} /></label> : <div className="space-y-4">
          <div className={`relative mx-auto max-h-[560px] overflow-hidden rounded-xl bg-black ${aspectClasses[aspectRatio]}`}><video ref={mediaRef} src={activePreviewUrl} controls muted={muted} onLoadedMetadata={syncDuration} onTimeUpdate={() => { if (mediaRef.current && mediaRef.current.currentTime >= trimEnd) mediaRef.current.pause(); }} style={{ filter: previewFilter }} className="h-full w-full object-cover" />{caption ? <div className="pointer-events-none absolute inset-x-4 bottom-12 text-center"><span className="rounded bg-black/75 px-3 py-1.5 text-sm font-semibold text-white">{caption}</span></div> : null}</div>
          <button onClick={previewTrim} className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-xs font-semibold hover:bg-slate-50"><Play className="h-4 w-4" /> Preview selection</button>
        </div>}
        <div className="space-y-2 rounded-xl border border-blue-100 bg-blue-50 p-3">
          <div className="flex items-center justify-between gap-3"><p role="status" className="min-w-0 truncate text-[11px] text-blue-800">{status}</p><label className={`inline-flex shrink-0 items-center gap-1 rounded-lg bg-primary px-3 py-2 text-[10px] font-semibold text-white ${file && mergeClips.length < 9 ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}><Plus className="h-3.5 w-3.5" /> Merge<input type="file" accept="video/*" multiple disabled={!file || mergeClips.length >= 9} className="sr-only" onChange={event => { void addMergeClips(event.target.files); event.currentTarget.value=''; }} /></label></div>
          {file ? <div className="flex gap-1.5 overflow-x-auto pb-1">
            <button type="button" onClick={selectMainClip} className={`min-w-28 rounded-lg border px-2.5 py-2 text-left ${selectedClipId === 'main' ? 'border-primary bg-white ring-1 ring-primary' : 'border-blue-100 bg-white/70'}`}><span className="block text-[9px] font-bold text-primary">01 · MAIN</span><span className="block truncate text-[10px] font-medium" title={file.name}>{file.name}</span>{mainEdit.reverse ? <span className="text-[9px] text-violet-600">Reversed</span> : null}</button>
            {mergeClips.map((clip, index) => <button key={clip.id} type="button" onClick={() => selectQueuedClip(clip)} className={`group relative min-w-28 rounded-lg border px-2.5 py-2 text-left ${selectedClipId === clip.id ? 'border-primary bg-white ring-1 ring-primary' : 'border-blue-100 bg-white/70'}`}><span className="block text-[9px] font-bold text-primary">{String(index + 2).padStart(2, '0')} · CLIP</span><span className="block truncate pr-4 text-[10px] font-medium" title={clip.file.name}>{clip.file.name}</span>{clip.reverse ? <span className="text-[9px] text-violet-600">Reversed</span> : null}<span onClick={event => { event.stopPropagation(); removeMergeClip(clip.id); }} role="button" aria-label={`Remove ${clip.file.name}`} className="absolute right-1.5 top-1.5 rounded p-0.5 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-3 w-3" /></span></button>)}
          </div> : null}
          {file ? <div className="flex items-center justify-between text-[10px] text-slate-600"><span>Editing clip {selectedClipId === 'main' ? 1 : mergeClips.findIndex(clip => clip.id === selectedClipId) + 2} of {mergeClips.length + 1} · max 10</span><button type="button" onClick={toggleSelectedReverse} className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 font-semibold ${selectedReverse ? 'border-violet-300 bg-violet-50 text-violet-700' : 'border-blue-200 bg-white text-primary'}`}><RotateCcw className="h-3 w-3" /> {selectedReverse ? 'Undo reverse' : 'Reverse clip'}</button></div> : null}
        </div>
      </section>
      <TrimTimeline compact duration={duration} start={trimStart} end={trimEnd} disabled={!file} onChange={updateSelectedRange} onPreview={previewTrim} />
      <section className="rounded-2xl border border-border bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          <div><p className="mb-1.5 text-[11px] font-semibold">Canvas</p><div className="flex gap-1.5">{Object.keys(aspectClasses).map(value => <button key={value} onClick={() => setAspectRatio(value)} className={`rounded-lg border px-3 py-2 text-[11px] font-semibold ${aspectRatio === value ? 'border-primary bg-blue-50 text-primary' : 'border-border'}`}>{value}</button>)}</div></div>
          <label className="text-[11px] font-semibold">Quality<select value={quality} onChange={event => setQuality(event.target.value)} className="mt-1.5 block rounded-lg border border-border bg-white px-3 py-2 text-[11px]"><option value="720p">HD 720p</option><option value="1080p">Full HD 1080p</option><option value="1440p">2K cloud</option><option value="2160p">4K cloud</option></select></label>
          <div className="ml-auto flex flex-wrap gap-2"><button disabled={!file} onClick={saveProject} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-[11px] font-semibold disabled:opacity-50"><FolderCheck className="h-4 w-4" /> Save</button><button disabled={busy || !file} onClick={saveRender} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-[11px] font-semibold text-white disabled:opacity-50"><Save className="h-4 w-4" />{busy ? `${progress}%` : 'Render'}</button><button disabled={!renderedBlob} onClick={() => renderedBlob && downloadMedia(renderedBlob, `${file?.name.replace(/\.[^.]+$/, '') || 'video'}-edited.webm`)} className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-[11px] font-semibold text-white disabled:opacity-40"><Download className="h-4 w-4" /> Download</button><button disabled={!file} onClick={downloadRecipe} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-[11px] font-semibold disabled:opacity-50"><Download className="h-4 w-4" /> Recipe</button></div>
        </div>
      </section>
      </div>

      <div className="space-y-4">
      <aside className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
        <label className="block text-xs font-semibold">Visual filter<select value={filter} onChange={e => setFilter(e.target.value)} className="mt-1.5 w-full rounded-lg border border-border bg-white px-3 py-2 text-xs">{Object.keys(filterPresets).map(value => <option key={value} value={value}>{value[0].toUpperCase() + value.slice(1)}</option>)}</select></label>
        <div className="space-y-3 rounded-xl border border-border bg-slate-50 p-3"><p className="flex items-center gap-2 text-xs font-semibold"><SlidersHorizontal className="h-4 w-4 text-primary" /> Fine adjustments</p>{[['Brightness', brightness, setBrightness], ['Contrast', contrast, setContrast], ['Saturation', saturation, setSaturation]].map(([label, value, setter]: any) => <label key={label} className="block text-[11px] text-muted-foreground"><span className="flex justify-between"><span>{label}</span><span>{value}%</span></span><input type="range" min="50" max="150" value={value} onChange={event => setter(Number(event.target.value))} className="mt-1 w-full" /></label>)}</div>
        <label className="block text-xs font-semibold">Playback speed<select value={playbackRate} onChange={e => setPlaybackRate(Number(e.target.value))} className="mt-1.5 w-full rounded-lg border border-border bg-white px-3 py-2 text-xs"><option value="0.75">0.75×</option><option value="1">1×</option><option value="1.25">1.25×</option><option value="1.5">1.5×</option><option value="2">2×</option></select></label>
        <label className="block text-xs font-semibold"><span className="flex items-center gap-2"><Captions className="h-4 w-4 text-primary" /> Caption overlay</span><textarea rows={3} value={caption} onChange={e => setCaption(e.target.value)} placeholder="Add on-screen caption…" className="mt-1.5 w-full rounded-lg border border-border px-3 py-2 text-xs" /></label>
      </aside>
      <aside className="space-y-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="space-y-3 rounded-xl border border-blue-200 bg-blue-50/50 p-3"><p className="flex items-center gap-2 text-xs font-semibold"><Mic2 className="h-4 w-4 text-primary" /> AI voice-over</p><textarea rows={3} value={voiceText} onChange={event => setVoiceText(event.target.value)} placeholder="Enter voice-over script…" className="w-full rounded-lg border border-border bg-white px-3 py-2 text-xs" /><div className="grid grid-cols-3 gap-2"><select aria-label="Voice language" value={voiceLanguage} onChange={event => setVoiceLanguage(event.target.value)} className="rounded-lg border border-border bg-white p-2 text-[10px]"><option value="en-IN">English IN</option><option value="en-GB">English UK</option><option value="hi-IN">Hindi</option></select><select aria-label="Voice speed" value={voiceRate} onChange={event => setVoiceRate(Number(event.target.value))} className="rounded-lg border border-border bg-white p-2 text-[10px]"><option value="0.85">Calm</option><option value="1">Natural</option><option value="1.15">Energetic</option></select><select aria-label="Voice pitch" value={voicePitch} onChange={event => setVoicePitch(Number(event.target.value))} className="rounded-lg border border-border bg-white p-2 text-[10px]"><option value="0.85">Low</option><option value="1">Natural</option><option value="1.15">Bright</option></select></div><button onClick={previewVoice} className="w-full rounded-lg border border-primary bg-white px-3 py-2 text-xs font-semibold text-primary">Preview voice</button></div>
        <button onClick={() => setMuted(value => !value)} className="flex w-full items-center justify-between rounded-lg border border-border px-3 py-2 text-xs font-semibold"><span>{muted ? 'Audio muted' : 'Audio enabled'}</span>{muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4 text-primary" />}</button>
      </aside>
      </div>
    </div>
  </div>;
}
