import type { Metadata } from 'next';
import './globals.css';
import QueryProvider from '@/components/common/QueryProvider';

export const metadata: Metadata = {
  title: 'MangaSystemPlatform - Professional Editorial & Workflow Platform',
  description: 'Manage manga series, tasks, assignments, editorial review processes, and files.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 antialiased font-sans">
        <QueryProvider>
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
