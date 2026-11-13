export type Point = { x: number; y: number };
export type Camera = { zoom: number; pan: Point };
export function zoomAt(camera: Camera, value: number, anchor: Point): Camera {
  const zoom = Math.max(.6, Math.min(4, value)), ratio = zoom / camera.zoom;
  return { zoom, pan: { x: anchor.x - (anchor.x - camera.pan.x) * ratio, y: anchor.y - (anchor.y - camera.pan.y) * ratio } };
}
export const targets = [
  { name: 'Barnard’s Star', ra: 269.4521, dec: 4.6934, type: 'HIGH PROPER-MOTION STAR', description: 'A star on the move' },
  { name: 'Epsilon Indi B', ra: 330.8417, dec: -56.785, type: 'BROWN DWARF PAIR', description: 'A hidden pair of brown dwarfs' },
  { name: 'WISE 0855', ra: 133.79513, dec: -7.24515, type: 'COLD BROWN DWARF', description: 'Our cold cosmic neighbor' },
  { name: 'RW Aurigae', ra: 76.956, dec: 30.4014, type: 'VARIABLE STAR', description: 'Watch its brightness change' },
  { name: 'R Draconis', ra: 249.19, dec: 66.752, type: 'VARIABLE STAR', description: 'A variable star in Draco' },
];
export const dates = ['June 2025', 'December 2025', 'June 2026', 'December 2026', 'June 2027', 'December 2027'];
export function detectorBands(detector: number): number[] { return Array.from({ length: 17 }, (_, i) => (detector - 1) * 17 + i + 1); }
