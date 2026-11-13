import assert from 'node:assert/strict';
import { detectorBands, zoomAt, type Camera } from '../lib/sky.ts';
import { svgNumber } from '../lib/rotor.ts';

for (const anchor of [{ x: 0, y: 0 }, { x: 220, y: 310 }, { x: 1000, y: 800 }]) {
  let camera: Camera = { zoom: 1, pan: { x: 120, y: -45 } };
  const world = { x: (anchor.x - camera.pan.x) / camera.zoom, y: (anchor.y - camera.pan.y) / camera.zoom };
  for (const value of [2.5, .6, 4, 1, 10, .1]) {
    camera = zoomAt(camera, value, anchor);
    assert(Math.hypot(world.x * camera.zoom + camera.pan.x - anchor.x, world.y * camera.zoom + camera.pan.y - anchor.y) < 1e-9);
    assert(camera.zoom >= .6 && camera.zoom <= 4);
  }
}
const all = Array.from({ length: 6 }, (_, i) => detectorBands(i + 1)).flat();
assert.deepEqual(all, Array.from({ length: 102 }, (_, i) => i + 1));
assert.equal(new Set(all).size, 102);
assert.equal(detectorBands(6)[16], 102);
console.log('PASS: cursor-anchored zoom and six complete, non-overlapping 17-band detector groups.');
// Exact differing server/client values reported in the hydration overlay.
for (const [server, client] of [
  [75.95972443316481, 75.95972443316482],
  [64.81255205100389, 64.8125520510039],
  [65.58075523042739, 65.5807552304274],
  [58.52751411449482, 58.52751411449485],
  [36.04457858770627, 36.0445785877063],
  [27.170614254071722, 27.17061425407175],
]) assert.equal(svgNumber(server), svgNumber(client));
console.log('PASS: reported server/browser rotor coordinates serialize identically.');
