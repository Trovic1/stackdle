'use client';

import './globals.css';
import { StacksProvider } from './context/StacksContext';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <title>Stackdle - Web3 Wordle</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
      </head>
      <body>
        <StacksProvider>
          {children}
        </StacksProvider>
      </body>
    </html>
  );
}
