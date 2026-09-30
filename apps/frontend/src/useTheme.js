import { createContext, useContext } from 'react';

/**
 * ThemeContext — provides light/dark mode toggling across the app.
 */
export const ThemeContext = createContext({
  theme: 'light',
  toggleTheme: () => {},
});

/**
 * useTheme — hook to consume theme context in any component.
 *
 * @returns {{ theme: 'light'|'dark', toggleTheme: () => void }}
 */
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a <ThemeProvider>');
  }
  return context;
}
