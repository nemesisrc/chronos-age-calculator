import type {Metadata} from 'next';
import {Plus_Jakarta_Sans, DM_Sans, JetBrains_Mono} from 'next/font/google';
import './globals.css';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-display',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-sans',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'Chronos Age & Milestone Calculator',
  description:
    'Precision chronological age calculator, milestone tracker, and date comparison studio powered by a FastAPI backend.',
  openGraph: {
    title: 'Chronos Age & Milestone Calculator',
    description:
      'Precision chronological age calculator, milestone tracker, and date comparison studio powered by a FastAPI backend.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Chronos Age & Milestone Calculator',
    description:
      'Precision chronological age calculator, milestone tracker, and date comparison studio powered by a FastAPI backend.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html
      lang="en"
      className={`${plusJakarta.variable} ${dmSans.variable} ${jetbrainsMono.variable}`}
    >
      <body
        suppressHydrationWarning
        className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased selection:bg-blue-600 selection:text-white font-sans transition-colors duration-150"
      >
        {children}
      </body>
    </html>
  );
}
