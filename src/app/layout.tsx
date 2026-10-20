import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/Providers';

export const metadata: Metadata = {
  title: 'Fabric — Your self-organizing workspace & AI second brain',
  description: 'Unify notes, canvases, PDFs, voice notes, images, videos, and connected apps with Rue AI.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#F8F8F7] text-[#191918] antialiased selection:bg-[#45BAF9]/20">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
