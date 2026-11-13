'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { sampleDataset, combineImages, imageOperation } from '@/lib/observations';
import { dates } from '@/lib/sky';
export default function ImageMath({ frame, bands }: { frame: number; bands: number[] }) {
 const [open,setOpen] = useState(false);
 const trigger = useRef<HTMLButtonElement>(null), closeButton = useRef<HTMLButtonElement>(null);
 useEffect(() => { if (open) closeButton.current?.focus({preventScroll:true}); }, [open]);
 function close() { setOpen(false); trigger.current?.focus({preventScroll:true}); }
 const [mode,setMode] = useState('off'), [reference,setReference] = useState(0);
 const canvas = useRef<HTMLCanvasElement>(null);
 const data = useMemo(() => mode === 'off' ? null : sampleDataset(),[mode]);
 const result = useMemo(() => {
  if (!data) return null;
  const at = (epoch: number) => combineImages(data.observations.slice(epoch*102,(epoch+1)*102).filter(o => bands.includes(o.band)));
  const a = at(frame), b = at(reference);
  return a && b ? imageOperation(a,b,mode === 'add' ? 'add':'subtract') : null;
 },[data,frame,reference,bands,mode]);
 useEffect(() => {
  if (!result || !canvas.current) return;
  const ctx = canvas.current.getContext('2d'); if (!ctx) return;
  canvas.current.width=result.width;canvas.current.height=result.height;
  const pixels=ctx.createImageData(result.width,result.height), max=Math.max(...result.pixels.map(Math.abs),.001);
  result.pixels.forEach((v,i) => {const n=Math.round(Math.abs(v)/max*255);pixels.data.set(v<0?[n,n*.35,n*.15,255]:[n*.5,n*.8,n,255],i*4);});ctx.putImageData(pixels,0,0);
 },[result]);
 return <><button ref={trigger} className="image-math-toggle" aria-label="Open advanced options" aria-expanded={open} aria-controls="image-math-sidebar" onClick={()=>setOpen(true)}><span>Advanced options</span></button><button className={`image-math-backdrop${open?' is-open':''}`} aria-label="Close advanced options sidebar" tabIndex={-1} onClick={close} inert={!open} /><aside id="image-math-sidebar" className={`image-math${open?' is-open':''}`} aria-label="Advanced options" aria-hidden={!open} inert={!open} onKeyDown={e=>{if(e.key==='Escape')close();}}><header><div><span className="eyebrow">SKY EXPLORER</span><h2>Advanced options</h2></div><button ref={closeButton} aria-label="Close advanced options" onClick={close}>Close</button></header><p className="image-math-description">Compare observations to reveal changes over time.</p><label>Image math<select aria-label="Image operation" value={mode} onChange={e=>setMode(e.target.value)}><option value="off">Off</option><option value="add">Add frames</option><option value="subtract">Subtract frames</option></select></label>{mode!=='off' && <><label>Reference<select aria-label="Reference frame" value={reference} onChange={e=>setReference(+e.target.value)}>{dates.map((date,i)=><option key={date} value={i}>{date}</option>)}</select></label><figure><canvas ref={canvas} aria-label="Processed sample image"/><figcaption>{dates[frame]} {mode==='add'?'+':'−'} {dates[reference]}<br/>Synthetic pixels · {bands.length} selected bands<br/>Blue: positive · Orange: negative</figcaption></figure></>}<p className="image-math-note">Choose bands with the Bands control and change the current observation using the timeline.</p></aside></>;
}
