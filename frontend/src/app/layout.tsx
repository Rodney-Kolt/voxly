import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from './providers';

// viewport and themeColor must be exported separately in Next.js 14+
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#6366f1',
};

export const metadata: Metadata = {
  title: {
    default: 'Voxly — Share Your Opinion',
    template: '%s | Voxly',
  },
  description:
    'The modern social opinion polling platform. Vote, debate, and discover what people really think.',
  keywords: ['polls', 'opinion', 'voting', 'social', 'trending'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
