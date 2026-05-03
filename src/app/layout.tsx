import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/shared/theme-provider';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});
const TITLE = 'Aurix';
const DESCRIPTION = 'Learn languages by speaking';
const BASE_URL = '';

export const metadata: Metadata = {
  metadataBase: BASE_URL ? new URL(BASE_URL) : undefined,
  title: TITLE,
  description: DESCRIPTION,
  keywords: '',
  authors: [
    {
      name: '',
      url: BASE_URL,
    },
  ],
  creator: '',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: BASE_URL,
    title: TITLE,
    description: DESCRIPTION,
    siteName: TITLE,
    images: [
      {
        url: `${BASE_URL}/og.jpg`,
        width: 1200,
        height: 630,
        alt: TITLE,
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    creator: '',
    images: [`${BASE_URL}/og.jpg`],
  },
  manifest: `${BASE_URL}/site.webmanifest`,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en' suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute='class'
          defaultTheme='system'
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
