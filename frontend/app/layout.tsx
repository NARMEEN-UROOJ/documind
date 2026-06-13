import type { Metadata } from 'next';
import { Inter }         from 'next/font/google';
import { Toaster }       from 'react-hot-toast';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title:       'DocuMind',
  description: 'Agentic RAG — multi-document intelligence platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Prevent theme flash before React hydrates */}
        <script dangerouslySetInnerHTML={{ __html:
          `(function(){var t=localStorage.getItem('theme');
           document.documentElement.classList.toggle('dark',t!=='light');})()`
        }} />
         <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css" />
      </head>
      <body className={inter.variable} style={{ fontFamily: 'var(--font-inter), sans-serif' }}>
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: 'var(--bg-card)',
              color:      'var(--text)',
              border:     '1px solid var(--border)',
              fontSize:   13,
            },
          }}
        />
      </body>
    </html>
  );
}