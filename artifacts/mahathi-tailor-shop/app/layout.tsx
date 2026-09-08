import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Mahathi Tailor Shop',
  description:
    'Shop Indian occasionwear, everyday pieces, Aari work, and made-to-measure tailoring from Mahathi.',
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}