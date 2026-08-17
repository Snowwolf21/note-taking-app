import type { Metadata } from 'next';
import { Inter, Lora, Fira_Code } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const lora = Lora({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
});

const firaCode = Fira_Code({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Inkwell - Note Taking Web App',
  description: 'Full-stack accessible note-taking application with dark mode, customizable font themes, tags, instant search, and full keyboard navigation.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${lora.variable} ${firaCode.variable}`}>
      <body className="antialiased min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] font-[var(--font-family-active)] transition-colors duration-200">
        {children}
      </body>
    </html>
  );
}
