import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono, Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/providers/theme-provider';
import ReactQueryProvider from '@/providers/react-query-provider';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AppleSplashScreens } from '@/components/pwa/apple-splash-screens';
import { OfflineIndicator } from '@/components/pwa/offline-indicator';
import { PWAComponents } from '@/components/pwa/pwa-components';
import { SwProvider } from '@/components/pwa/sw-provider';
import { ErrorBoundary } from '@/components/error-boundary';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
});

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

const supabaseOrigin = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin
  : null;

export const metadata: Metadata = {
  title: {
    default: 'CatatZ — Pencatatan Keuangan Pribadi',
    template: '%s | CatatZ',
  },
  description:
    'Aplikasi pencatatan keuangan pribadi yang cepat, intuitif, dan cerdas. Catat pemasukan, pengeluaran, transfer, hutang, dan rekap keuangan Anda.',
  keywords: ['keuangan pribadi', 'pencatatan keuangan', 'budgeting', 'catatan hutang'],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'CatatZ',
  },
  icons: {
    icon: [
      { url: '/icons/icon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180' }],
    shortcut: '/icons/icon-192x192.png',
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'apple-mobile-web-app-title': 'CatatZ',
    'application-name': 'CatatZ',
    'msapplication-TileColor': '#0052ff',
    'msapplication-TileImage': '/icons/icon-144x144.png',
    'theme-color': '#0052ff',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  // App-like zoom locking can improve mobile feel, but it reduces accessibility.
  // Enable only after product review:
  // maximumScale: 1,
  // userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        {supabaseOrigin ? <link rel="preconnect" href={supabaseOrigin} /> : null}
        <link rel="dns-prefetch" href="https://generativelanguage.googleapis.com" />
        {/* Apple startup images require explicit link tags. */}
        <AppleSplashScreens />
      </head>
      <body className={`${inter.variable} ${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ReactQueryProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <SwProvider>
              <TooltipProvider>
                <ErrorBoundary>{children}</ErrorBoundary>
                <OfflineIndicator />
                <PWAComponents />
                <Toaster richColors position="top-right" />
              </TooltipProvider>
            </SwProvider>
          </ThemeProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
