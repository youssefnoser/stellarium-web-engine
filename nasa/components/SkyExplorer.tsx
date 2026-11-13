'use client';
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { dates, targets, zoomAt, type Camera, type Point } from '@/lib/sky';
import BandSelector from './BandSelector';
import Rotor from './Rotor';
import SkyCanvas from './SkyCanvas';
import ImageMath from './ImageMath';

export default function SkyExplorer() {
  const [searchOpen, setSearchOpen] = useState(false), [query, setQuery] = useState(''), [message, setMessage] = useState('');
  const [recent, setRecent] = useState<{ ra: number; dec: number }[]>([]);
  useEffect(() => { try { const stored = JSON.parse(localStorage.getItem('sky-search-history') ?? '[]'); if (Array.isArray(stored)) setRecent(stored.filter(p => p && Number.isFinite(p.ra) && p.ra >= 0 && p.ra < 360 && Number.isFinite(p.dec) && Math.abs(p.dec) <= 90).slice(0, 8)); } catch {} }, []);
  const [selected, setSelected] = useState(0);
  const [coordinates, setCoordinates] = useState({ ra: 269.4521, dec: 4.6934 });
  const [camera, setCamera] = useState<Camera>({ zoom: 1, pan: { x: 0, y: 0 } });
  const [size, setSize] = useState<Point>({ x: 1, y: 1 });
  const [frame, setFrame] = useState(0), [playing, setPlaying] = useState(false), [speed, setSpeed] = useState(1), [loop, setLoop] = useState(true);
  const [infrared, setInfrared] = useState(true), [grid, setGrid] = useState(true), [bands, setBands] = useState<number[]>([1]);
  const searchDock = useRef<HTMLDivElement>(null), searchInput = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const outside = (event: PointerEvent) => { if (!searchDock.current?.contains(event.target as Node)) setSearchOpen(false); };
    document.addEventListener('pointerdown', outside); return () => document.removeEventListener('pointerdown', outside);
  }, []);
  useEffect(() => {
    const params = new URLSearchParams(location.search), a = params.get('ra'), d = params.get('dec');
    const fov = Number(params.get('fov')), epoch = Number(params.get('frame'));
    if (params.has('fov') && Number.isFinite(fov) && fov > 0) setCamera({ zoom: Math.max(.6, Math.min(4, 5 / fov)), pan: { x: 0, y: 0 } });
    if (params.has('frame') && Number.isInteger(epoch) && epoch >= 0 && epoch <= 5) setFrame(epoch);
    if (a !== null && d !== null && a.trim() && d.trim() && Number.isFinite(+a) && Number.isFinite(+d) && +a >= 0 && +a < 360 && +d >= -90 && +d <= 90) {
      setCoordinates({ ra: +a, dec: +d });
      setSelected(targets.findIndex(target => Math.abs(target.ra - +a) < .001 && Math.abs(target.dec - +d) < .001));
    }
  }, []);
  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => setFrame(current => {
      if (current === 5 && !loop) return current;
      return (current + 1) % 6;
    }), 600 / speed);
    return () => clearInterval(timer);
  }, [playing, loop, speed]);
  useEffect(() => { if (playing && frame === 5 && !loop) setPlaying(false); }, [frame, loop, playing]);
  const onZoom = useCallback((value: number, anchor?: Point) => setCamera(current => zoomAt(current, value, anchor ?? { x: size.x / 2, y: size.y / 2 })), [size]);
  const onPan = useCallback((pan: Point) => setCamera(current => ({ ...current, pan })), []);
  const onResize = useCallback((next: Point) => setSize(next), []);
  const onBands = useCallback((next: number[]) => setBands(next), []);
  function updateCoordinates(a: number, d: number) {
    setRecent(current => { const next = [{ ra: a, dec: d }, ...current.filter(p => p.ra !== a || p.dec !== d)].slice(0, 8); try { localStorage.setItem('sky-search-history', JSON.stringify(next)); } catch {} return next; });
    setCoordinates({ ra: a, dec: d });
    const url = new URL(location.href); url.searchParams.set('ra', String(a)); url.searchParams.set('dec', String(d)); history.replaceState(null, '', url);
    setCamera({ zoom: 1, pan: { x: 0, y: 0 } }); setFrame(0); setPlaying(false);
  }
  function chooseTarget(index: number) {
    const target = targets[index]; setSelected(index); updateCoordinates(target.ra, target.dec); setQuery(''); setMessage(`Exploring ${target.name} - simulated observations`); setSearchOpen(false);
  }
  function search(event: FormEvent) {
    event.preventDefault(); const normalize = (value: string) => value.toLowerCase().replace(/[’']/g, '').trim();
    const text = query.trim();
    if (!text) { setMessage('Enter an object name or RA, Dec in degrees.'); return; }
    const pair = text.match(/^([+-]?(?:\d+(?:\.\d*)?|\.\d+))\s*\u00b0?\s*(?:,\s*|\s+)([+-]?(?:\d+(?:\.\d*)?|\.\d+))\s*\u00b0?$/);
    if (pair) {
      const a = Number(pair[1]), d = Number(pair[2]);
      if (a < 0 || a >= 360 || d < -90 || d > 90) {
        setMessage('RA must be 0 to less than 360 degrees; Dec must be -90 to 90 degrees.'); return;
      }
      updateCoordinates(a, d);
      setSelected(targets.findIndex(item => Math.abs(item.ra - a) < .001 && Math.abs(item.dec - d) < .001));
      setMessage(`Exploring ${a} degrees, ${d} degrees`); setSearchOpen(false); return;
    }
    const index = targets.findIndex(target => normalize(target.name).includes(normalize(query)));
    if (index >= 0) chooseTarget(index); else setMessage('Try Barnard’s Star, Epsilon Indi B, WISE 0855, RW Aurigae, or R Draconis.');
  }
  const target = targets[selected];
  const readout = coordinates;
  return <main>
    <div className="search-dock" ref={searchDock} onKeyDown={event => { if (event.key === 'Escape') { setSearchOpen(false); searchInput.current?.focus(); } }}>
      <form onSubmit={search}><input ref={searchInput} aria-label="Search celestial objects" aria-expanded={searchOpen} aria-controls="sky-search-options" placeholder="Search the sky…" value={query} onFocus={() => setSearchOpen(true)} onChange={event => { setQuery(event.target.value); setSearchOpen(true); }} /></form>
      <div id="sky-search-options" className="search-options" hidden={!searchOpen}>
        <div className="search-options-heading"><span className="eyebrow">EXPLORE THE SKY</span></div>
        <div className="search-targets">{targets.filter(item => !query.trim() || item.name.toLowerCase().replace(/[’']/g, '').includes(query.toLowerCase().replace(/[’']/g, '').trim())).map(item => <button key={item.name} type="button" onClick={() => chooseTarget(targets.indexOf(item))}><span>✦</span><span><strong>{item.name}</strong><small>{item.description}</small></span><span>↗</span></button>)}</div>
        {!!recent.length && <div className="search-history"><span className="eyebrow">RECENT LOCATIONS</span><button onClick={() => { setRecent([]); try { localStorage.removeItem('sky-search-history'); } catch {} }}>Clear history</button>{recent.map(p => <button key={`${p.ra}:${p.dec}`} onClick={() => { updateCoordinates(p.ra, p.dec); setSelected(targets.findIndex(t => t.ra === p.ra && t.dec === p.dec)); setSearchOpen(false); }}>{p.ra.toFixed(4)}, {p.dec.toFixed(4)}</button>)}</div>}
        <p id="search-coordinate-hint" className="search-coordinate-hint">Search a name or enter coordinates in degrees, e.g. 269.4521, +4.6934</p>
      </div>
    </div>
    <section className="sky" aria-label="Interactive simulated sky map">
      <SkyCanvas camera={camera} frame={frame} selected={selected} bandCount={bands.length} infrared={infrared} grid={grid} name={target?.name ?? 'Your sky region'} objectType={target?.type ?? 'CUSTOM COORDINATES'} onZoom={onZoom} onPan={onPan} onResize={onResize} />
      <div className="map-top"><div className="map-title"><span className="live-dot" /> SKY VIEW <span className="badge">SIMULATED DATA</span></div><div className="view-switch"><button className={infrared ? 'selected' : ''} onClick={() => setInfrared(true)}>Infrared</button><button className={!infrared ? 'selected' : ''} onClick={() => setInfrared(false)}>Visible</button></div></div>
      <div className="map-coordinate">ICRS <span>{readout.ra.toFixed(4)}°, {readout.dec >= 0 ? '+' : ''}{readout.dec.toFixed(4)}°</span></div>
      <div className="map-tools"><button aria-label="Recenter map" onClick={() => { setCamera({ zoom: 1, pan: { x: 0, y: 0 } });  }}>⌖</button><button aria-label="Toggle coordinate grid" aria-pressed={grid} onClick={() => setGrid(!grid)}>▦</button></div>
      <BandSelector onSelection={onBands} />
      <ImageMath frame={frame} bands={bands} />
      <div className="map-bottom"><span>{(5 / camera.zoom).toFixed(1)} arcmin</span><span>Illustrative star field / Not for scientific analysis</span></div>
      <section className="timeline rotary-console" aria-label="Sky controls">
        <div className="knob-section zoom-section"><Rotor id="zoom-knob" label="Zoom" value={camera.zoom} min={.6} max={4} step={.1} labels={['0.6×', '1.3×', '2.0×', '2.6×', '3.3×', '4.0×']} onChange={onZoom}><span>{camera.zoom.toFixed(1)}×</span><small>ZOOM</small></Rotor></div>
        <><div className="knob-section time-section half-section"><Rotor id="time-knob" label="Observation frame" value={frame} min={0} max={5} step={1} labels={['JUN 25', 'DEC 25', 'JUN 26', 'DEC 26', 'JUN 27', 'DEC 27']} onChange={setFrame} onGrab={() => setPlaying(false)}><span>{dates[frame]}</span><small>FRAME {String(frame + 1).padStart(2, '0')} / 06</small></Rotor></div>
        <div className="knob-section speed-section half-section"><Rotor id="speed-knob" label="Playback speed" value={speed} min={.5} max={3} step={.5} labels={['0.5×', '1×', '1.5×', '2×', '2.5×', '3×']} onChange={setSpeed}><span>{speed}×</span><small>PLAYBACK SPEED</small></Rotor></div>
        <div className="playback-panel"><div className="playback-buttons"><button aria-label="Previous frame" onClick={() => { setPlaying(false); setFrame(Math.max(0, frame - 1)); }}>◀</button><button className="play" aria-label={playing ? 'Pause observations' : 'Play observations'} onClick={() => { if (!playing && frame === 5) setFrame(0); setPlaying(!playing); }}>{playing ? 'Ⅱ' : '▶'}</button><button aria-label="Next frame" onClick={() => { setPlaying(false); setFrame(Math.min(5, frame + 1)); }}>▶</button><button className={`loop${loop ? ' active' : ''}`} aria-label="Loop playback" aria-pressed={loop} onClick={() => setLoop(!loop)}>↻</button></div></div>
        </>
      </section>
    </section>
    <div className="search-feedback" role="status" hidden={searchOpen}>{message}</div>
  </main>;
}
