'use client';
import { useEffect, useRef, useState } from 'react';
import { detectorBands } from '@/lib/sky';

export default function BandSelector({ onSelection }: { onSelection: (bands: number[]) => void }) {
  const [open, setOpen] = useState(false), [mode, setMode] = useState<'detector' | 'stack'>('detector');
  const [detector, setDetector] = useState(1), [selected, setSelected] = useState([1]);
  const [stack, setStack] = useState(102), [input, setInput] = useState('102'), [status, setStatus] = useState('');
  const ref = useRef<HTMLDivElement>(null), trigger = useRef<HTMLButtonElement>(null);
  const modeButton = useRef<HTMLButtonElement>(null);
  useEffect(() => { onSelection(mode === 'stack' ? Array.from({ length: stack }, (_, i) => i + 1) : selected); }, [mode, stack, selected, onSelection]);
  useEffect(() => {
    const outside = (event: PointerEvent) => { if (!ref.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener('pointerdown', outside); return () => document.removeEventListener('pointerdown', outside);
  }, []);
  useEffect(() => { if (open) modeButton.current?.focus({ preventScroll: true }); }, [open]);
  function close() { setOpen(false); trigger.current?.focus(); }
  function toggle(band: number) {
    if (selected.includes(band) && selected.length === 1) { setStatus('Keep at least one band selected.'); return; }
    setSelected(selected.includes(band) ? selected.filter(value => value !== band) : [...selected, band]); setStatus('');
  }
  function stackChange(value: string) {
    setInput(value); const count = Number(value);
    if (!Number.isInteger(count) || count < 1 || count > 102) { setStatus('Enter a whole number from 1 to 102.'); return; }
    setStack(count); setStatus('');
  }
  const all = detectorBands(detector).every(band => selected.includes(band));
  return <div ref={ref} className={`band-control${open ? ' is-open' : ''}`}>
    <button ref={trigger} id="bands-toggle" aria-expanded={open} aria-controls="bands-panel" aria-label="Choose infrared bands" onClick={() => setOpen(!open)}><span className="bands-toggle-icon" aria-hidden="true">▥</span><span className="bands-miniatures" aria-hidden="true"><i /><i /><i /></span><span className="bands-toggle-label">Bands <b id="bands-button-value">{mode === 'stack' ? `1–${stack}` : selected.length}</b></span><span className="bands-chevron">⌃</span></button>
    <div id="bands-panel" inert={!open} aria-hidden={!open} onKeyDown={event => { if (event.key === 'Escape') close(); }}>
      <div className="band-tray-heading"><div><span className="eyebrow">BUILD YOUR INFRARED VIEW</span><h2>Infrared bands <span>6 detectors · 17 bands each</span></h2></div><button id="bands-close" aria-label="Close band selection" onClick={close}>×</button></div>
      <div className="band-modes" aria-label="Band selection mode"><button ref={modeButton} aria-pressed={mode === 'detector'} onClick={() => setMode('detector')}>Select detector bands</button><button aria-pressed={mode === 'stack'} onClick={() => setMode('stack')}>Band stacking</button></div>
      <div hidden={mode !== 'detector'}><div className="detector-list" aria-label="Choose detector">{Array.from({ length: 6 }, (_, index) => index + 1).map(number => <button key={number} className={`detector-card band-preview-${number}`} aria-pressed={detector === number} onClick={() => setDetector(number)}><strong>Detector {number}</strong><small>Bands {(number - 1) * 17 + 1}–{number * 17}</small><span className="detector-selection-count">{detectorBands(number).filter(band => selected.includes(band)).length} selected</span></button>)}</div>
        <div className="detector-band-heading"><span>Detector {detector} · choose specific bands</span><button onClick={() => {
          const group = detectorBands(detector);
          if (all && selected.length === 17) { setStatus('Keep at least one band selected.'); return; }
          setSelected(all ? selected.filter(band => !group.includes(band)) : [...new Set([...selected, ...group])]); setStatus('');
        }}>{all ? 'Deselect detector' : 'Select detector'}</button></div>
        <div className="detector-band-grid">{detectorBands(detector).map((band, index) => <label key={band} className="individual-band"><input type="checkbox" checked={selected.includes(band)} onChange={() => toggle(band)} aria-label={`Detector ${detector}, local band ${index + 1}, global band ${band}`} /><span>{String(index + 1).padStart(2, '0')}</span><small>#{band}</small></label>)}</div>
      </div>
      <div hidden={mode !== 'stack'}><div className="stack-description"><strong>Stack bands 1 through {stack}</strong><span>Choose how many consecutive bands to combine.</span></div><div className="stack-controls"><input type="range" min="1" max="102" value={stack} aria-label="Number of stacked bands" onChange={event => stackChange(event.target.value)} /><label><input type="number" min="1" max="102" step="1" value={input} aria-label="Stack band count" aria-invalid={!!status && mode === 'stack'} onChange={event => stackChange(event.target.value)} onBlur={() => { setInput(String(stack)); setStatus(''); }} /> bands</label></div><div className="stack-limits"><span>1 band</span><span>102 bands</span></div></div>
      <div className="band-tray-footer"><p id="band-status" role="status">{status || (mode === 'stack' ? `Stacking bands 1–${stack} · ${stack} bands` : `${selected.length} individual bands selected across detectors`)}</p><span className="band-tray-note">Simulated preview · No calibrated imagery connected</span></div>
    </div>
  </div>;
}
