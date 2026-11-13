export type Observation = {
  id: string; date: string; telescope: string; band: number; wavelength: number;
  width: number; height: number; pixels: number[]; variance: number | null;
  zodi: number | null; psf: number | null; quality: string; flags: string[];
  wcsWave: string | null;
};
export type CatalogSource = { mission: 'Gaia' | 'WISE'; name: string; ra: number; dec: number };
export type Dataset = { provenance: string; ra: number; dec: number; fov: number; observations: Observation[]; sources: CatalogSource[] };
export function sampleDataset(ra = 269.4521, dec = 4.6934, fov = 5): Dataset {
  const observations: Observation[] = [];
  for (let epoch = 0; epoch < 6; epoch++) for (let band = 1; band <= 102; band++) {
    const pixels = Array.from({ length: 1024 }, (_, i) => {
      const x = i % 32, y = Math.floor(i / 32);
      return .03 + Math.exp(-((x - 12 - epoch) ** 2 + (y - 17 + epoch * .4) ** 2) / 5) * (1 + Math.sin(band / 12) * .4) + .6 * Math.exp(-((x - 23) ** 2 + (y - 8) ** 2) / 3);
    });
    observations.push({ id: `sample-${epoch}-${band}`, date: `${2025 + Math.floor(epoch / 2)}-${epoch % 2 ? '12' : '06'}-01`, telescope: 'Synthetic SPHEREx example', band, wavelength: Number((.75 + (band - 1) * 4.25 / 101).toFixed(4)), width: 32, height: 32, pixels, variance: .002, zodi: .03, psf: 2.1, quality: 'Synthetic example', flags: ['SIMULATED'], wcsWave: 'Illustrative linear band axis; not a calibrated WCS' });
  }
  return { provenance: 'Synthetic sample; arbitrary intensity and illustrative wavelengths. Not scientific data.', ra, dec, fov, observations, sources: [{ mission: 'Gaia', name: 'Example Gaia source', ra, dec }, { mission: 'WISE', name: 'Example WISE source', ra: (ra + fov / 240) % 360, dec: Math.min(90, dec + fov / 240) }] };
}
export function validateDataset(value: unknown): Dataset {
  const d = value as Dataset;
  if (!d || typeof d.provenance !== 'string' || !d.provenance.trim() || !Number.isFinite(d.ra) || d.ra < 0 || d.ra >= 360 || !Number.isFinite(d.dec) || Math.abs(d.dec) > 90 || !Number.isFinite(d.fov) || d.fov <= 0 || d.fov > 180 || !Array.isArray(d.observations) || !d.observations.length || d.observations.length > 612) throw Error('Invalid dataset header or observation count (1–612).');
  let total = 0;
  const keys = new Set<string>();
  for (const o of d.observations) {
    if (!o || typeof o.id !== 'string' || typeof o.telescope !== 'string' || typeof o.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(o.date) || !Number.isFinite(Date.parse(o.date)) || !Number.isInteger(o.band) || o.band < 1 || o.band > 102 || !Number.isFinite(o.wavelength) || o.wavelength <= 0 || !Number.isInteger(o.width) || !Number.isInteger(o.height) || o.width < 1 || o.height < 1 || o.width > 256 || o.height > 256 || !Array.isArray(o.pixels) || o.pixels.length !== o.width * o.height || o.pixels.some(v => !Number.isFinite(v)) || typeof o.quality !== 'string' || !Array.isArray(o.flags) || o.flags.some(v => typeof v !== 'string')) throw Error('Invalid observation: check image dimensions, pixels, band, date, and metadata.');
    for (const v of [o.variance, o.zodi, o.psf]) if (v !== null && !Number.isFinite(v)) throw Error('Metadata values must be finite numbers or null.');
    if (o.wcsWave !== null && typeof o.wcsWave !== 'string') throw Error('WCS-wave must be text or null.');
    const key = `${o.date}:${o.band}`; if (keys.has(key)) throw Error('Duplicate date/band observation.'); keys.add(key);
    total += o.pixels.length; if (total > 1000000) throw Error('Dataset exceeds one million pixels.');
  }
  if (!Array.isArray(d.sources) || d.sources.length > 10000 || d.sources.some(s => !s || !['Gaia', 'WISE'].includes(s.mission) || typeof s.name !== 'string' || !Number.isFinite(s.ra) || s.ra < 0 || s.ra >= 360 || !Number.isFinite(s.dec) || Math.abs(s.dec) > 90)) throw Error('Invalid catalog sources.');
  return d;
}
export function combineImages(images: Observation[]): Observation | null {
  if (!images.length) return null;
  const first = images[0];
  if (images.some(o => o.width !== first.width || o.height !== first.height)) throw Error('Images must have matching dimensions and already be aligned.');
  return { ...first, pixels: first.pixels.map((_, i) => images.reduce((sum, o) => sum + o.pixels[i], 0)) };
}
export function imageOperation(a: Observation, b: Observation, mode: 'add' | 'subtract'): Observation {
  if (a.width !== b.width || a.height !== b.height) throw Error('Images must have matching dimensions and already be aligned.');
  return { ...a, pixels: a.pixels.map((v, i) => mode === 'add' ? v + b.pixels[i] : v - b.pixels[i]) };
}
