export type LocalRenderOptions = {
  sourceUrl: string; start: number; end: number; aspect: string; filter: string;
  caption: string; muted: boolean; playbackRate: number; quality: string; reverse?: boolean;
};

export type MergeClip = { sourceUrl: string; start?: number; end?: number; reverse?: boolean };

const dimensions: Record<string, Record<string, [number, number]>> = {
  '720p': { '16:9': [1280, 720], '9:16': [720, 1280], '1:1': [720, 720], '4:5': [720, 900] },
  '1080p': { '16:9': [1920, 1080], '9:16': [1080, 1920], '1:1': [1080, 1080], '4:5': [1080, 1350] },
  '1440p': { '16:9': [2560, 1440], '9:16': [1440, 2560], '1:1': [1440, 1440], '4:5': [1440, 1800] },
  '2160p': { '16:9': [3840, 2160], '9:16': [2160, 3840], '1:1': [2160, 2160], '4:5': [2160, 2700] },
};

const renderBitrate = (quality: string) => ({ '720p': 5_000_000, '1080p': 10_000_000, '1440p': 18_000_000, '2160p': 32_000_000 }[quality] || 10_000_000);

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
  const recorder = new MediaRecorder(canvasStream, { mimeType, videoBitsPerSecond: renderBitrate(options.quality) });
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

export async function mergeVideoClipsLocally(options: LocalRenderOptions, clips: MergeClip[], onProgress: (value: number) => void) {
  if (!('MediaRecorder' in window)) throw new Error('This browser does not support local video rendering. Use current Chrome or Edge.');
  const sources = [{ sourceUrl: options.sourceUrl, start: options.start, end: options.end, reverse: options.reverse }, ...clips];
  const videos = await Promise.all(sources.map(source => new Promise<HTMLVideoElement>((resolve, reject) => {
    const video = document.createElement('video'); video.src = source.sourceUrl; video.preload = 'auto'; video.playsInline = true;
    video.onloadedmetadata = () => resolve(video); video.onerror = () => reject(new Error('A queued clip could not be decoded.'));
  })));
  const ranges = videos.map((video, index) => ({ start: Math.max(0, sources[index].start || 0), end: Math.min(video.duration, sources[index].end || video.duration) }));
  const total = ranges.reduce((sum, range) => sum + Math.max(.1, range.end - range.start), 0);
  const canvas = document.createElement('canvas'); const preset = dimensions[options.quality] || dimensions['1080p']; [canvas.width, canvas.height] = preset[options.aspect] || preset['16:9'];
  const context = canvas.getContext('2d'); if (!context) throw new Error('Canvas renderer unavailable.');
  const stream = canvas.captureStream(30);
  const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  const audioContext = !options.muted && AudioContextClass ? new AudioContextClass() : null;
  if (audioContext) {
    await audioContext.resume(); const destination = audioContext.createMediaStreamDestination();
    videos.forEach(video => audioContext.createMediaElementSource(video).connect(destination));
    destination.stream.getAudioTracks().forEach(track => stream.addTrack(track));
  }
  const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus') ? 'video/webm;codecs=vp9,opus' : 'video/webm';
  const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: renderBitrate(options.quality) });
  const chunks: Blob[] = []; recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
  const result = new Promise<Blob>((resolve, reject) => { recorder.onerror = () => reject(new Error('Clip merge failed.')); recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType })); });
  recorder.start(500); let completed = 0;
  const drawFrame = (video: HTMLVideoElement) => {
    const sourceRatio = video.videoWidth / video.videoHeight; const targetRatio = canvas.width / canvas.height;
    let sx=0,sy=0,sw=video.videoWidth,sh=video.videoHeight;
    if(sourceRatio>targetRatio){sw=video.videoHeight*targetRatio;sx=(video.videoWidth-sw)/2;}else{sh=video.videoWidth/targetRatio;sy=(video.videoHeight-sh)/2;}
    context.filter=options.filter;context.drawImage(video,sx,sy,sw,sh,0,0,canvas.width,canvas.height);context.filter='none';
    if(options.caption){context.font=`700 ${Math.max(28,canvas.width/28)}px Arial`;context.textAlign='center';context.fillStyle='rgba(0,0,0,.72)';context.fillRect(canvas.width*.08,canvas.height*.82,canvas.width*.84,canvas.height*.09);context.fillStyle='#fff';context.fillText(options.caption.slice(0,100),canvas.width/2,canvas.height*.88);}
  };
  for (let index = 0; index < videos.length; index += 1) {
    const video = videos[index]; const range = ranges[index]; video.currentTime = range.start;
    await new Promise<void>(resolve => { video.onseeked = () => resolve(); });
    if (sources[index].reverse) {
      const step = Math.max(1 / 30, options.playbackRate / 30);
      for (let time = range.end; time >= range.start; time -= step) {
        video.currentTime = time;
        await new Promise<void>(resolve => { video.onseeked = () => resolve(); });
        drawFrame(video);
        completed += step;
        onProgress(Math.min(99, Math.round((completed / total) * 100)));
        await new Promise<void>(resolve => window.setTimeout(resolve, 1000 / 30));
      }
      continue;
    }
    video.playbackRate = options.playbackRate; await video.play();
    await new Promise<void>(resolve => {
      const frame = () => {
        drawFrame(video);
        onProgress(Math.round(((completed + Math.max(0, video.currentTime-range.start))/total)*100));
        if(!video.ended && video.currentTime<range.end)requestAnimationFrame(frame);else{video.pause();completed+=range.end-range.start;resolve();}
      }; requestAnimationFrame(frame);
    });
  }
  recorder.stop(); const blob=await result; await audioContext?.close(); onProgress(100); return blob;
}

export function downloadMedia(blob: Blob, filename = 'sabd-studio-render.webm') {
  const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = filename; link.click(); window.setTimeout(() => URL.revokeObjectURL(url), 2000);
}
