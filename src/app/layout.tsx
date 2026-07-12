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
        <link rel="icon" type="image/png" href="/logo.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
        <meta name="talentapp:project_verification" content="d4589335f5666b3416bc068be43db5bd1b27aa59864e99f8079fdce56069a4e77a7a7a38f81c5fab578ce69128178fca01cc50b133d2d7f4343ec9a38e0f973c" />
      </head>
      <body>
        <StacksProvider>
          {children}
        </StacksProvider>
      </body>
    </html>
  );
}
