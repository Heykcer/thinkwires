/**
 * ThinkWires Design System — Central Theme Configuration
 *
 * This file exports all design tokens as a JavaScript object,
 * making them available for use in JS-driven styling logic,
 * inline styles, and theme-aware components.
 *
 * CSS custom properties are the primary styling mechanism;
 * this file mirrors those tokens for programmatic access.
 */

const theme = {
  colors: {
    // ─── Primary ───────────────────────────────────────────
    primary: '#0037B0',
    'primary-container': '#1D4ED8',
    'on-primary': '#FFFFFF',
    'on-primary-container': '#CAD3FF',
    'inverse-primary': '#B7C4FF',
    'primary-fixed': '#DCE1FF',
    'primary-fixed-dim': '#B7C4FF',
    'on-primary-fixed': '#001551',
    'on-primary-fixed-variant': '#0039B5',

    // ─── Cobalt accents ────────────────────────────────────
    'cobalt-bright': '#2563EB',
    'cobalt-glow': '#3B82F6',

    // ─── Secondary ─────────────────────────────────────────
    secondary: '#49607E',
    'secondary-container': '#C4DCFF',
    'on-secondary': '#FFFFFF',
    'on-secondary-container': '#49617F',
    'secondary-fixed': '#D2E4FF',
    'secondary-fixed-dim': '#B0C8EB',
    'on-secondary-fixed': '#001C37',
    'on-secondary-fixed-variant': '#314865',

    // ─── Tertiary / Emerald ────────────────────────────────
    tertiary: '#004F35',
    'tertiary-container': '#006A48',
    'on-tertiary': '#FFFFFF',
    'on-tertiary-container': '#60EEB1',
    'tertiary-fixed': '#6FFBBE',
    'tertiary-fixed-dim': '#4EDEA3',
    'on-tertiary-fixed': '#002113',
    'on-tertiary-fixed-variant': '#005236',
    'emerald-accent': '#22C55E',

    // ─── Error ─────────────────────────────────────────────
    error: '#BA1A1A',
    'error-container': '#FFDAD6',
    'on-error': '#FFFFFF',
    'on-error-container': '#93000A',

    // ─── Surfaces ──────────────────────────────────────────
    surface: '#FAF8FF',
    'surface-dim': '#D9D9E5',
    'surface-bright': '#FAF8FF',
    'surface-container-lowest': '#FFFFFF',
    'surface-container-low': '#F3F2FE',
    'surface-container': '#EDEDF9',
    'surface-container-high': '#E8E7F3',
    'surface-container-highest': '#E2E1ED',
    'on-surface': '#1A1B23',
    'on-surface-variant': '#434655',
    'inverse-surface': '#2E3039',
    'inverse-on-surface': '#F0F0FB',
    'surface-tint': '#2151DA',
    'surface-variant': '#E2E1ED',

    // ─── Outline ───────────────────────────────────────────
    outline: '#747686',
    'outline-variant': '#C4C5D7',

    // ─── Extended palette ──────────────────────────────────
    'navy-dark': '#0F172A',
    'slate-surface': '#F8FAFC',
    'card-stroke': '#E2E8F0',
    background: '#FAF8FF',
    'on-background': '#1A1B23',
  },

  typography: {
    fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",

    'display-hero': {
      fontSize: '56px',
      fontWeight: 800,
      lineHeight: '64px',
      letterSpacing: '-0.02em',
    },
    'display-hero-mobile': {
      fontSize: '36px',
      fontWeight: 800,
      lineHeight: '44px',
      letterSpacing: '-0.01em',
    },
    'headline-xl': {
      fontSize: '40px',
      fontWeight: 700,
      lineHeight: '48px',
      letterSpacing: '-0.02em',
    },
    'headline-xl-mobile': {
      fontSize: '28px',
      fontWeight: 700,
      lineHeight: '36px',
      letterSpacing: '-0.01em',
    },
    'headline-lg': {
      fontSize: '30px',
      fontWeight: 700,
      lineHeight: '38px',
      letterSpacing: '-0.015em',
    },
    'headline-md': {
      fontSize: '22px',
      fontWeight: 600,
      lineHeight: '30px',
    },
    'headline-sm': {
      fontSize: '18px',
      fontWeight: 600,
      lineHeight: '26px',
    },
    'body-xl': {
      fontSize: '18px',
      fontWeight: 400,
      lineHeight: '28px',
    },
    'body-md': {
      fontSize: '16px',
      fontWeight: 400,
      lineHeight: '24px',
    },
    'body-sm': {
      fontSize: '14px',
      fontWeight: 400,
      lineHeight: '20px',
    },
    'label-md': {
      fontSize: '14px',
      fontWeight: 600,
      lineHeight: '18px',
      letterSpacing: '0.01em',
    },
    'label-sm': {
      fontSize: '12px',
      fontWeight: 600,
      lineHeight: '16px',
      letterSpacing: '0.02em',
    },
    'stat-counter': {
      fontSize: '44px',
      fontWeight: 800,
      lineHeight: '52px',
      letterSpacing: '-0.02em',
    },
  },

  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2.5rem',
    '2xl': '4rem',
    gutter: '1.5rem',
    'gutter-desktop': '2rem',
    margin: '1.5rem',
    'margin-desktop': '5rem',
  },

  rounded: {
    sm: '0.25rem',
    DEFAULT: '0.5rem',
    md: '0.75rem',
    lg: '1rem',
    xl: '1.5rem',
    full: '9999px',
  },

  elevation: {
    0: 'none',
    1: '0 1px 3px 0 rgba(15, 23, 42, 0.05), 0 1px 2px -1px rgba(15, 23, 42, 0.05)',
    2: '0 12px 24px -6px rgba(15, 23, 42, 0.08), 0 4px 8px -2px rgba(37, 99, 235, 0.06)',
    3: '0 25px 50px -12px rgba(10, 37, 64, 0.25)',
  },

  breakpoints: {
    mobile: '768px',
    tablet: '1280px',
    desktop: '1280px',
  },

  layout: {
    maxWidth: '1240px',
    columns: { mobile: 4, tablet: 8, desktop: 12 },
  },
};

export default theme;
