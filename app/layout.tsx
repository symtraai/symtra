import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SYMTRA — 911 Operator Training Simulator',
  description: 'Real-time 911 dispatch training powered by MiniMax M.25 and VAPI',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
