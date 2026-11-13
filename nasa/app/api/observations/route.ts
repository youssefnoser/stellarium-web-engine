import { sampleDataset } from '@/lib/observations';
export function GET(request: Request) {
  const p = new URL(request.url).searchParams;
  const ra = Number(p.get('ra') ?? 269.4521), dec = Number(p.get('dec') ?? 4.6934), fov = Number(p.get('fov') ?? 5);
  if (!Number.isFinite(ra) || ra < 0 || ra >= 360 || !Number.isFinite(dec) || Math.abs(dec) > 90 || !Number.isFinite(fov) || fov <= 0 || fov > 180) return Response.json({ error: 'Invalid ra, dec or fov (arcmin).' }, { status: 400 });
  return Response.json(sampleDataset(ra, dec, fov));
}
