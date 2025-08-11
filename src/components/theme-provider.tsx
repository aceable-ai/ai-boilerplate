'use client';

import type { ThemeProviderProps } from 'next-themes';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type { ReactNode } from 'react';

interface MyThemeProviderProps extends ThemeProviderProps {
  children: ReactNode;
}

export function MyThemeProvider({ children, ...props }: MyThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
