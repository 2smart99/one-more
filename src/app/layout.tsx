import type { Metadata } from 'next';
import './globals.css';
import { BottomNav } from '@/components/layout/BottomNav';

export const metadata: Metadata = {
  title: 'One More',
  description: 'Telegram fitness tracker',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <script src="https://telegram.org/js/telegram-web-app.js" />
      </head>
      <body className="bg-background">
        <main className="pb-20 min-h-screen scroll-smooth-ios">
          {children}
        </main>
        <BottomNav />
      </body>
    </html>
  );
}
