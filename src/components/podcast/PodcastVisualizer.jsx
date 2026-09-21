import React, { useEffect, useRef, useState } from "react";
import { Headphones } from "lucide-react";

const AXIOM_SRC = "https://s3.k8s.maayanlab.cloud/axiom-podcasts/axiom.png";
const TRINITY_SRC = "https://s3.k8s.maayanlab.cloud/axiom-podcasts/trinity.png";

const graphs = new WeakMap();

function attachAnalyser(audio) {
  const existing = graphs.get(audio);
  if (existing) return existing;

  const AudioCtx = window.AudioContext || window["webkitAudioContext"];
  if (!AudioCtx) return null;

  try {
    const ctx = new AudioCtx();
    const source = ctx.createMediaElementSource(audio);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.8;
    source.connect(analyser);
    analyser.connect(ctx.destination);
    const graph = {
      ctx,
      analyser,
      time: new Uint8Array(analyser.fftSize),
      freq: new Uint8Array(analyser.frequencyBinCount),
    };
    graphs.set(audio, graph);
    return graph;
  } catch (err) {
    console.warn("Audio visualizer unavailable:", err);
    return null;
  }
}

function rmsFromTimeDomain(data) {
  let sum = 0;
  for (let i = 0; i < data.length; i += 1) {
    const v = (data[i] - 128) / 128;
    sum += v * v;
  }
  return Math.sqrt(sum / data.length);
}

function drawWavyRing(ctx, cx, cy, radius, freq, startBin, binSpan, color, lineWidth, volume) {
  const steps = 96;
  ctx.beginPath();
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const angle = t * Math.PI * 2;
    const bin = Math.min(
      freq.length - 1,
      startBin + (Math.floor(t * binSpan) % Math.max(binSpan, 1)),
    );
    const amp = ((freq[bin] || 0) / 255) * (0.45 + volume * 1.15);
    const r = radius + amp * radius * 0.38;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
}

export default function PodcastVisualizer({ audioEl, backgroundUrl, title }) {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const levelRef = useRef(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const audio = audioEl;
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!audio || !canvas || !wrap) return undefined;

    const graph = attachAnalyser(audio);
    const ctx2d = canvas.getContext("2d");
    let frame = 0;
    let stopped = false;

    const resize = () => {
      const { width, height } = wrap.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    };

    const syncPlaying = () => setPlaying(!audio.paused && !audio.ended);
    const resume = () => {
      if (graph?.ctx && graph.ctx.state !== "running") {
        graph.ctx.resume().catch(() => {});
      }
    };

    const draw = () => {
      if (stopped) return;
      frame = requestAnimationFrame(draw);

      const w = canvas.width;
      const h = canvas.height;
      ctx2d.clearRect(0, 0, w, h);

      let volume = 0;
      const isPlaying = !audio.paused && !audio.ended;
      if (isPlaying) resume();
      if (graph && isPlaying) {
        graph.analyser.getByteTimeDomainData(graph.time);
        graph.analyser.getByteFrequencyData(graph.freq);
        volume = Math.min(1, rmsFromTimeDomain(graph.time) * 5.8);
      } else if (isPlaying) {
        volume = 0.35 + Math.sin(audio.currentTime * 6) * 0.1;
      } else {
        volume = 0.12 + Math.sin(performance.now() / 900) * 0.04;
      }

      levelRef.current += (volume - levelRef.current) * 0.28;
      const level = levelRef.current;
      const cx = w / 2;
      const cy = h / 2;
      const minSide = Math.min(w, h);
      const freq = graph?.freq;
      const ringCount = 5;

      for (let i = 1; i <= ringCount; i += 1) {
        const t = i / ringCount;
        const radius = minSide * (0.1 + t * 0.17) + level * minSide * 0.14 * t;
        const alpha = isPlaying
          ? (0.9 - t * 0.4) * (0.4 + level * 0.85)
          : 0.22 - t * 0.06;
        const color = i % 2 === 0
          ? `rgba(0, 85, 255, ${Math.max(alpha, 0.12)})`
          : `rgba(0, 194, 160, ${Math.max(alpha, 0.12)})`;
        const lineWidth = (2.2 + level * 5) * (canvas.width / Math.max(wrap.clientWidth, 1));

        if (freq && isPlaying && volume > 0.02) {
          const start = Math.floor((i - 1) * (freq.length / 8));
          drawWavyRing(ctx2d, cx, cy, radius, freq, start, 24, color, lineWidth, level);
        } else {
          ctx2d.beginPath();
          ctx2d.arc(cx, cy, radius, 0, Math.PI * 2);
          ctx2d.strokeStyle = color;
          ctx2d.lineWidth = lineWidth;
          ctx2d.stroke();
        }
      }
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(wrap);
    audio.addEventListener("play", resume);
    audio.addEventListener("playing", syncPlaying);
    audio.addEventListener("pause", syncPlaying);
    audio.addEventListener("ended", syncPlaying);
    syncPlaying();
    draw();

    return () => {
      stopped = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      audio.removeEventListener("play", resume);
      audio.removeEventListener("playing", syncPlaying);
      audio.removeEventListener("pause", syncPlaying);
      audio.removeEventListener("ended", syncPlaying);
    };
  }, [audioEl]);

  async function togglePlayback() {
    const audio = audioEl;
    if (!audio) return;
    const graph = graphs.get(audio);
    if (graph?.ctx && graph.ctx.state !== "running") {
      await graph.ctx.resume().catch(() => {});
    }
    if (audio.paused) await audio.play();
    else audio.pause();
  }

  return (
    <div
      ref={wrapRef}
      className="relative overflow-hidden rounded-xl aspect-[16/9] bg-graphite"
    >
      {backgroundUrl ? (
        <img
          src={backgroundUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-r from-graphite/80 via-graphite/45 to-graphite/80" />
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" aria-hidden="true" />

      <div className="absolute inset-0 flex items-center justify-between px-3 sm:px-8 pointer-events-none">
        <div
          className="flex flex-col items-center gap-2 max-w-[32%]"
          style={{ transform: "perspective(900px) rotateY(16deg)" }}
        >
          <img
            src={AXIOM_SRC}
            alt="Axiom"
            className="h-24 sm:h-36 md:h-44 w-auto object-contain rounded-2xl shadow-2xl"
          />
          <span className="font-mono text-[10px] tracking-widest uppercase text-cobalt">Axiom</span>
        </div>
        <div
          className="flex flex-col items-center gap-2 max-w-[32%]"
          style={{ transform: "perspective(900px) rotateY(-16deg)" }}
        >
          <img
            src={TRINITY_SRC}
            alt="Trinity"
            className="h-24 sm:h-36 md:h-44 w-auto object-contain rounded-2xl shadow-2xl"
          />
          <span className="font-mono text-[10px] tracking-widest uppercase text-mint">Trinity</span>
        </div>
      </div>

      <button
        type="button"
        onClick={togglePlayback}
        className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-cobalt flex items-center justify-center text-white shadow-lg focus:outline-none focus:ring-2 focus:ring-white/70"
        aria-label={playing ? "Pause episode" : "Play episode"}
        style={{ transform: playing ? "translate(-50%, -50%) scale(1.06)" : "translate(-50%, -50%)" }}
      >
        <Headphones className="w-6 h-6 sm:w-7 sm:h-7" />
      </button>

      {title ? (
        <p className="sr-only">{title}</p>
      ) : null}
    </div>
  );
}
