import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Press! - Golf Event Games',
  description:
    'A production-minded web-first PWA for golf events with betting-style games using Alligator Teeth fun currency.',
  keywords: ['golf', 'games', 'match play', 'nassau', 'skins', 'press'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
