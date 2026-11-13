import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = { title: 'SPHEREx · Sky Explorer', description: 'Explore a simulated SPHEREx sky with interactive time, zoom, and band controls.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
