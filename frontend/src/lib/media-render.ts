export type LocalRenderOptions = {
  sourceUrl: string; start: number; end: number; aspect: string; filter: string;
  caption: string; muted: boolean; playbackRate: number; quality: string;
};

const dimensions: Record<string, Record<string, [number, number]>> = {
  '720p': { '16:9': [1280, 720], '9:16': [720, 1280], '1:1': [720, 720], '4:5': [720, 900] },
  '1080p': { '16:9': [1920, 1080], '9:16': [1080, 1920], '1:1': [1080, 1080], '4:5': [1080, 1350] },
};

export async function renderVideoLocally(options: LocalRenderOptions, onProgress: (value: number) => void) {
  if (!('MediaRecorder' in window)) throw new Error('This browser does not support local video rendering. Use current Chrome or Edge.');
  const video = document.createElement('video'); video.src = options.sourceUrl; video.muted = false; video.preload = 'auto'; video.playsInline = true;
  await new Promise<void>((resolve, reject) => { video.onloadedmetadata = () => resolve(); video.onerror = () => reject(new Error('The selected video could not be decoded.')); });
  video.currentTime = options.start;
  await new Promise<void>(resolve => { video.onseeked = () => resolve(); });
  const canvas = document.createElement('canvas'); const preset = dimensions[options.quality] || dimensions['1080p']; [canvas.width, canvas.height] = preset[options.aspect] || preset['16:9'];
  const context = canvas.getContext('2d'); if (!context) throw new Error('Canvas renderer unavailable.');
  const canvasStream = canvas.captureStream(30);
  const sourceStream = (video as HTMLVideoElement & { captureStream?: () => MediaStream }).captureStream?.();
  if (!options.muted) sourceStream?.getAudioTracks().forEach(track => canvasStream.addTrack(track));
  const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus') ? 'video/webm;codecs=vp9,opus' : 'video/webm';
  const recorder = new MediaRecorder(canvasStream, { mimeType, videoBitsPerSecond: options.quality === '720p' ? 5_000_000 : 10_000_000 });
  const chunks: Blob[] = []; recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
  const result = new Promise<Blob>((resolve, reject) => { recorder.onerror = () => reject(new Error('Local render failed.')); recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType })); });
  recorder.start(500); video.playbackRate = options.playbackRate; await video.play();
  const renderFrame = () => {
    const sourceRatio = video.videoWidth / video.videoHeight; const targetRatio = canvas.width / canvas.height;
    let sx = 0, sy = 0, sw = video.videoWidth, sh = video.videoHeight;
    if (sourceRatio > targetRatio) { sw = video.videoHeight * targetRatio; sx = (video.videoWidth - sw) / 2; } else { sh = video.videoWidth / targetRatio; sy = (video.videoHeight - sh) / 2; }
    context.filter = options.filter; context.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height); context.filter = 'none';
    if (options.caption) { context.font = `700 ${Math.max(28, canvas.width / 28)}px Arial`; context.textAlign = 'center'; const width = Math.min(canvas.width * .86, context.measureText(options.caption).width + 50); context.fillStyle = 'rgba(0,0,0,.72)'; context.fillRect((canvas.width - width) / 2, canvas.height * .82, width, canvas.height * .09); context.fillStyle = '#fff'; context.fillText(options.caption.slice(0, 100), canvas.width / 2, canvas.height * .88); }
    const progress = Math.min(1, (video.currentTime - options.start) / Math.max(.1, options.end - options.start)); onProgress(Math.round(progress * 100));
    if (!video.ended && video.currentTime < options.end) requestAnimationFrame(renderFrame); else { video.pause(); recorder.stop(); }
  };
  requestAnimationFrame(renderFrame);
  return result;
}

export function downloadMedia(blob: Blob, filename = 'sabd-studio-render.webm') {
  const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = filename; link.click(); window.setTimeout(() => URL.revokeObjectURL(url), 2000);
}
