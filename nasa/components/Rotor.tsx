'use client';
import { useId, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { svgNumber } from '@/lib/rotor';

type Props = { id: string; label: string; value: number; min: number; max: number; step: number; labels: string[]; children: ReactNode; onChange: (value: number) => void; onGrab?: () => void };
export default function Rotor({ id, label, value, min, max, step, labels, children, onChange, onGrab }: Props) {
  const clip = useId().replaceAll(':', '');
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef<{ pointer: number; angle: number; value: number } | null>(null);
  const [live, setLive] = useState<number | null>(null);
  const angle = 60 - ((live ?? value) - min) / (max - min) * 120;
  function commit(raw: number) { onChange(Math.max(min, Math.min(max, min + Math.round((raw - min) / step) * step))); }
  function pointerAngle(clientX: number, clientY: number) {
    const matrix = ref.current!.querySelector('svg')!.getScreenCTM()!;
    const point = new DOMPoint(clientX, clientY).matrixTransform(matrix.inverse());
    return Math.atan2(point.x - 180, 180 - point.y) * 180 / Math.PI;
  }
  function end() { drag.current = null; setLive(null); }
  return <div ref={ref} id={id} className={`half-dial${live !== null ? ' is-turning' : ''}`} role="slider" tabIndex={0} aria-label={label} aria-valuemin={min} aria-valuemax={max} aria-valuenow={value} aria-valuetext={`${label}: ${value}`} style={{ '--ring-angle': `${svgNumber(angle)}deg` } as CSSProperties}
    onPointerDown={event => {
      if (drag.current || (event.pointerType === 'mouse' && event.button !== 0)) return;
      event.preventDefault(); event.stopPropagation();
      const matrix = new DOMMatrixReadOnly(getComputedStyle(ref.current!.querySelector('.lens-ring')!).transform);
      const rotation = Math.atan2(matrix.b, matrix.a) * 180 / Math.PI;
      const current = Math.max(min, Math.min(max, min + (60 - rotation) / 120 * (max - min)));
      drag.current = { pointer: event.pointerId, angle: pointerAngle(event.clientX, event.clientY), value: current };
      setLive(current); onGrab?.(); event.currentTarget.focus(); event.currentTarget.setPointerCapture(event.pointerId);
    }} onPointerMove={event => {
      const current = drag.current; if (!current || current.pointer !== event.pointerId) return;
      const next = pointerAngle(event.clientX, event.clientY), delta = ((next - current.angle + 540) % 360) - 180;
      current.angle = next; current.value = Math.max(min, Math.min(max, current.value - delta / 120 * (max - min)));
      setLive(current.value); commit(current.value);
    }} onPointerUp={end} onPointerCancel={end} onLostPointerCapture={end}
    onKeyDown={event => {
      const direction = ({ ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 } as Record<string, number>)[event.key];
      if (direction || event.key === 'Home' || event.key === 'End') { event.preventDefault(); commit(event.key === 'Home' ? min : event.key === 'End' ? max : value + direction * step); }
    }} onWheel={event => { event.stopPropagation(); commit(value + (event.deltaY < 0 ? step : -step)); }}>
    <svg viewBox="0 0 360 200" aria-hidden="true"><defs><clipPath id={clip}><path d="M180 180 L0 76 L0 0 L360 0 L360 76 Z" /></clipPath></defs><g clipPath={`url(#${clip})`}><g className="lens-ring"><circle cx="180" cy="180" r="155" fill="none" stroke="currentColor" opacity=".2" />{Array.from({ length: 150 }, (_, i) => {
      const degrees = -60 + i * 2.4, a = degrees * Math.PI / 180, major = i % 10 === 0;
      const inner = major ? 132 : i % 5 === 0 ? 140 : 146, x = 180 + Math.sin(a) * 110, y = 180 - Math.cos(a) * 110;
      return <g key={i}><line x1={svgNumber(180 + Math.sin(a) * inner)} y1={svgNumber(180 - Math.cos(a) * inner)} x2={svgNumber(180 + Math.sin(a) * 155)} y2={svgNumber(180 - Math.cos(a) * 155)} stroke="currentColor" strokeWidth={major ? 2 : 1} opacity={major ? 1 : .55} />{major && i <= 50 && (id === 'zoom-knob' ? <text className="zoom-scale-label" x={svgNumber(x)} y={svgNumber(y)} textAnchor="middle" dominantBaseline="middle">{labels[i / 10]}</text> : <text transform={`translate(${svgNumber(x)} ${svgNumber(y)}) rotate(${svgNumber(degrees)})`} textAnchor="middle" dominantBaseline="middle">{labels[i / 10]}</text>)}</g>;
    })}</g></g><path className="dial-hit-area" d="M45.77 102.5 A155 155 0 0 1 314.23 102.5" fill="none" stroke="transparent" strokeWidth="74" /><g className="half-indicator"><line x1="180" y1="9" x2="180" y2="51" stroke="currentColor" strokeWidth="3" /><path d="M175 7 L185 7 L180 14 Z" fill="currentColor" /></g></svg><span className="half-readout">{children}</span>
  </div>;
}
