'use client';
import { useEffect, useRef, useState } from 'react';
import type { Camera, Point } from '@/lib/sky';
import { createWebGLSky } from '@/lib/webgl-sky';

type Props = { camera: Camera; frame: number; selected: number; bandCount: number; infrared: boolean; grid: boolean; name: string; objectType: string; onZoom: (value: number, anchor: Point) => void; onPan: (pan: Point) => void; onResize: (size: Point) => void };
let seed = 8239;
function random() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
const stars = Array.from({ length: 2300 }, () => ({ x: random(), y: random(), r: random(), brightness: random(), tint: random() }));

export default function SkyCanvas({ camera, frame, selected, bandCount, infrared, grid, name, objectType, onZoom, onPan, onResize }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const gpuCanvas = useRef<HTMLCanvasElement>(null);
  const renderer = useRef<ReturnType<typeof createWebGLSky>>(null);
  const [gpu, setGpu] = useState(false);
  const drag = useRef<Point | null>(null);
  const [size, setSize] = useState({ width: 1, height: 1 });
  const { zoom, pan } = camera;
  useEffect(() => {
    const canvas = gpuCanvas.current!;
    const initialize = () => { renderer.current?.dispose(); renderer.current = createWebGLSky(canvas); setGpu(!!renderer.current); };
    const lost = (event: Event) => { event.preventDefault(); renderer.current = null; setGpu(false); };
    initialize(); canvas.addEventListener('webglcontextlost', lost); canvas.addEventListener('webglcontextrestored', initialize);
    return () => { canvas.removeEventListener('webglcontextlost', lost); canvas.removeEventListener('webglcontextrestored', initialize); renderer.current?.dispose(); renderer.current = null; };
  }, []);
  useEffect(() => {
    const canvas = ref.current!;
    const observer = new ResizeObserver(() => {
      const bounds = canvas.getBoundingClientRect();
      setSize({ width: bounds.width, height: bounds.height });
      onResize({ x: bounds.width, y: bounds.height });
    });
    observer.observe(canvas); return () => observer.disconnect();
  }, [onResize]);
  useEffect(() => {
    const canvas = ref.current!;
    const ratio = Math.min(devicePixelRatio || 1, 2);
    if (renderer.current) {
      renderer.current.draw({ width: size.width, height: size.height, ratio, camera, frame, selected, bandCount, infrared, grid });
      return;
    }
    canvas.width = size.width * ratio; canvas.height = size.height * ratio;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.clearRect(0, 0, size.width, size.height);
  ctx.fillStyle = '#050a14'; ctx.fillRect(0, 0, size.width, size.height);
  // Soft, procedural dust clouds keep the map independent of external image services.
  for (let i = 0; i < 8; i++) {
    const x = size.width * (.12 + i * .13) * zoom + pan.x;
    const y = size.height * (.65 - i * .065) * zoom + pan.y;
    const glow = ctx.createRadialGradient(x, y, 0, x, y, size.width * .38 * zoom);
    glow.addColorStop(0, infrared ? 'rgba(74,51,93,.10)' : 'rgba(27,65,95,.10)');
    glow.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = glow;
    ctx.fillRect(0, 0, size.width, size.height);
  }
  if (grid) {
    ctx.strokeStyle = '#739ac00e'; ctx.lineWidth = 1;
    const step = 145 * zoom;
    for (let x = ((pan.x % step) + step) % step; x < size.width; x += step) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, size.height); ctx.stroke(); }
    for (let y = ((pan.y % step) + step) % step; y < size.height; y += step) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(size.width, y); ctx.stroke(); }
  }
  const showStars = true;
  if (showStars) stars.forEach((star) => {
    const tileWidth = size.width * zoom, tileHeight = size.height * zoom;
    if (!tileWidth || !tileHeight) return;
    const baseX = ((star.x * tileWidth + pan.x) % tileWidth + tileWidth) % tileWidth;
    const baseY = ((star.y * tileHeight + pan.y) % tileHeight + tileHeight) % tileHeight;
    for (let x = baseX - tileWidth; x < size.width + 15; x += tileWidth) {
    for (let y = baseY - tileHeight; y < size.height + 15; y += tileHeight) {
    const r = (.25 + star.r ** 6 * 1.9) * Math.sqrt(zoom);
    const color = infrared && star.tint > .85 ? '243,181,146' : star.tint < .2 ? '159,192,239' : '218,223,239';
    if (star.r > .94) {
      const halo = ctx.createRadialGradient(x, y, 0, x, y, r * 7);
      halo.addColorStop(0, `rgba(${color},.22)`); halo.addColorStop(1, `rgba(${color},0)`);
      ctx.fillStyle = halo; ctx.fillRect(x - r * 7, y - r * 7, r * 14, r * 14);
    }
    ctx.fillStyle = `rgba(${color},${(.15 + star.brightness * .8) * (infrared ? .4 + .6 * Math.sqrt(bandCount / 102) : 1)})`;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }
    }
  });
  const x = (size.width * .49 + 21 + frame * 7) * zoom + pan.x;
  const y = (size.height * .39 + 27 - frame * 3) * zoom + pan.y;
  if (showStars) {
    {
      ctx.setLineDash([3, 6]); ctx.strokeStyle = '#82b4dd80'; ctx.beginPath();
      ctx.moveTo(x - 48 * zoom, y + 20 * zoom); ctx.lineTo(x + 44 * zoom, y - 19 * zoom); ctx.stroke(); ctx.setLineDash([]);
    }
    const r = selected > 2 ? 5 + Math.sin(frame * 1.4) * 2.5 : 5;
    const glow = ctx.createRadialGradient(x, y, 0, x, y, 44);
    glow.addColorStop(0, '#fff3dfee'); glow.addColorStop(.1, '#e5b5a8bb'); glow.addColorStop(.3, '#ab6d6c55'); glow.addColorStop(1, '#ad5f6400');
    ctx.fillStyle = glow; ctx.fillRect(x - 44, y - 44, 88, 88);
    ctx.fillStyle = '#fff7e9'; ctx.beginPath(); ctx.arc(x, y, r / 2, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#f1d6c47a'; ctx.beginPath(); ctx.moveTo(x - 14, y); ctx.lineTo(x + 14, y); ctx.moveTo(x, y - 14); ctx.lineTo(x, y + 14); ctx.stroke();
  }
  
  }, [camera, frame, selected, bandCount, infrared, grid, size, zoom, pan, gpu]);
  useEffect(() => {
    const canvas = ref.current!;
    const wheel = (event: WheelEvent) => {
      event.preventDefault(); const bounds = canvas.getBoundingClientRect();
      onZoom(zoom * Math.exp(-Math.max(-100, Math.min(100, event.deltaY)) * .002), { x: event.clientX - bounds.left, y: event.clientY - bounds.top });
    };
    canvas.addEventListener('wheel', wheel, { passive: false });
    return () => canvas.removeEventListener('wheel', wheel);
  }, [zoom, onZoom]);
  const x = (size.width * .49 + 21 + frame * 7) * zoom + pan.x;
  const y = (size.height * .39 + 27 - frame * 3) * zoom + pan.y;
  return <><canvas ref={gpuCanvas} className="webgl-sky" aria-hidden="true" style={{ visibility: gpu ? 'visible' : 'hidden' }} /><canvas ref={ref} id="sky-canvas" style={{ opacity: gpu ? 0 : 1 }} aria-label="Simulated sky. Drag to pan, scroll to zoom." onPointerDown={event => { drag.current = { x: event.clientX - pan.x, y: event.clientY - pan.y }; event.currentTarget.setPointerCapture(event.pointerId); }} onPointerMove={event => { if (drag.current) onPan({ x: event.clientX - drag.current.x, y: event.clientY - drag.current.y }); }} onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }} /><div id="object-label" className="object-label" style={{ left: x - 21, top: y - 27 }}><span className="crosshair" /><div><span className="object-type">{objectType}</span><strong>{name}</strong><small>Follow the star. See the difference.</small></div></div></>;
}
