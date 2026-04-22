import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Inter } from 'next/font/google';
import './globals.css';
import { APP_NAME, APP_TAGLINE } from '@/lib/constants';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: `${APP_NAME} | AI copilot for meme-token research`,
  description: APP_TAGLINE,
  metadataBase: new URL('https://memescope.local'),
  openGraph: {
    title: APP_NAME,
    description: APP_TAGLINE,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: APP_NAME,
    description: APP_TAGLINE,
  },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} min-h-screen bg-[#050816] text-slate-50 antialiased`}>
        {children}
      </body>
    </html>
  );
}
