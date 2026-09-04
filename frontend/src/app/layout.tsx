import './globals.css';
import type { Metadata } from 'next';
import Providers from './providers';

export const metadata: Metadata = {
  title: 'CreatorFlow AI — From One Idea to an Entire Content Pipeline',
  description: 'Automate your creator workflow from raw text, transcript, or media to YouTube, Instagram, LinkedIn, Twitter, Blog, and Shorts assets.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
