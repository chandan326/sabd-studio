import './globals.css';
import type { Metadata } from 'next';
import Providers from './providers';

export const metadata: Metadata = {
  metadataBase: new URL('https://sabd-studio.vercel.app'),
  title: {
    default: 'Sabd Studio — AI Creator Workflow Platform',
    template: '%s | Sabd Studio',
  },
  description: 'Automate your creator workflow from raw text, transcript, or media to YouTube, Instagram, LinkedIn, Twitter, Blog, and Shorts assets.',
  keywords: ['AI content creation', 'video editor', 'shorts generator', 'creator workflow', 'SEO analyzer', 'Sabd Studio'],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    url: '/',
    siteName: 'Sabd Studio',
    title: 'Sabd Studio — AI Creator Workflow Platform',
    description: 'Create, edit, optimize, and publish multi-platform content from one professional workspace.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sabd Studio — AI Creator Workflow Platform',
    description: 'Create, edit, optimize, and publish multi-platform content from one professional workspace.',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
