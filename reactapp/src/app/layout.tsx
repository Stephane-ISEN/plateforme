import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/darkmode/theme-provider';
import { UserProvider } from '@/components/user/UserContext';
import { LayoutProps } from '@/types';
import { PromptProvider } from '@/src/hooks/PromptContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AI Explorer by ManagIA',
  description: 'AI Explorer',
};

export default function RootLayout({ children }: LayoutProps) {
  return (
    <html lang="en">
      <head>
        <title>AI Explorer</title>
      </head>
      <body className={inter.className}>
        <ThemeProvider
          attribute={'class'}
          defaultTheme="light"
          enableSystem={true}
          disableTransitionOnChange
        >
          <UserProvider>
            <PromptProvider>
              {children}
            </PromptProvider>
          </UserProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
