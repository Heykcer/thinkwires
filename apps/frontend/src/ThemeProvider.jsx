import { useCallback, useEffect, useState } from 'react';
import { ThemeContext } from './useTheme.js';

/**
 * Determines the initial theme from localStorage or OS preference.
 */
function getInitialTheme() {
  if (typeof window === 'undefined') return 'light';

  const stored = localStorage.getItem('theme');
  if (stored === 'light' || stored === 'dark') return stored;

  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

/**
 * ThemeProvider — wrap your app with this to enable theme toggling.
 *
 * @example
 * ```jsx
 * <ThemeProvider>
 *   <App />
 * </ThemeProvider>
 * ```
 */
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme);

  // Sync the `data-theme` attribute on <html> whenever theme changes
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Listen for OS-level preference changes (only when no explicit choice is stored)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => {
      if (!localStorage.getItem('theme')) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export default ThemeProvider;
