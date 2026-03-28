import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';

const outfit = Outfit({ subsets: ['latin'], weight: ['100','200','300','400','500','600','700','800','900'] });

export const metadata: Metadata = {
  title: 'Examiz',
  description: 'Examiz Test Platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={outfit.className}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
