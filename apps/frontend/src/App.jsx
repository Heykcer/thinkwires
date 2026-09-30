import { useTheme } from './useTheme.js';
import './App.css';

/**
 * Design System Showcase
 *
 * This component demonstrates that every design token —
 * colors, typography, spacing, border-radii, elevation,
 * buttons, chips, inputs, cards, and light/dark mode —
 * is correctly integrated and functional.
 */
function App() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="showcase-page">
      {/* ────── Glassmorphic Header ────── */}
      <header className="showcase-header" id="showcase-header">
        <div className="logo">
          <div className="logo-icon">TW</div>
          <span className="logo-text">ThinkWires</span>
        </div>
        <button
          type="button"
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          id="theme-toggle-btn"
        >
          <span className="toggle-knob">{theme === 'light' ? '☀️' : '🌙'}</span>
        </button>
      </header>

      {/* ────── Hero Section ────── */}
      <section className="showcase-hero" id="hero-section">
        <div className="hero-content">
          <h1>
            <span className="gradient-text">Design System</span>
            <br />
            Ready to Build
          </h1>
          <p className="hero-subtitle">
            Every token, component, and interaction pattern is configured and
            proven. Start building with confidence.
          </p>
          <div className="hero-actions">
            <button
              type="button"
              className="btn btn-primary btn-pill"
              id="btn-get-started"
            >
              Get Started
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-pill"
              id="btn-docs"
            >
              View Documentation →
            </button>
          </div>
        </div>
      </section>

      {/* ────── Stats Row ────── */}
      <section className="stats-row" id="stats-section">
        <div className="stat-card card">
          <div>
            <span className="stat-number">98</span>
            <span className="stat-indicator">%</span>
          </div>
          <span className="stat-label">Placement Accuracy</span>
        </div>
        <div className="stat-card card">
          <div>
            <span className="stat-number">48</span>
            <span className="stat-indicator">hrs</span>
          </div>
          <span className="stat-label">Avg. Time to Interview</span>
        </div>
        <div className="stat-card card">
          <div>
            <span className="stat-number">2.4k</span>
            <span className="stat-indicator">+</span>
          </div>
          <span className="stat-label">Active Candidates</span>
        </div>
        <div className="stat-card card">
          <div>
            <span className="stat-number">180</span>
            <span className="stat-indicator">+</span>
          </div>
          <span className="stat-label">Enterprise Clients</span>
        </div>
      </section>

      {/* ────── Component Showcase ────── */}
      <div className="section-title" id="components-section">
        <h2>Component Library</h2>
        <p>Interactive components demonstrating the design system in action.</p>
      </div>

      <div className="component-grid">
        {/* Buttons */}
        <div className="showcase-card card" id="buttons-card">
          <h4>Buttons</h4>
          <p className="card-description">
            Primary CTAs, secondary outlines, ghost actions, and pill variants.
          </p>
          <div className="demo-area">
            <button
              type="button"
              className="btn btn-primary"
              id="demo-btn-primary"
            >
              Primary
            </button>
            <button
              type="button"
              className="btn btn-primary btn-pill"
              id="demo-btn-pill"
            >
              Pill CTA
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              id="demo-btn-secondary"
            >
              Secondary
            </button>
            <button type="button" className="btn btn-ghost" id="demo-btn-ghost">
              Ghost →
            </button>
          </div>
        </div>

        {/* Chips & Badges */}
        <div className="showcase-card card" id="chips-card">
          <h4>Chips &amp; Badges</h4>
          <p className="card-description">
            Status pills, tech category tags, and priority indicators.
          </p>
          <div className="demo-area">
            <span className="chip chip-success" id="chip-active">
              <span
                className="status-dot"
                style={{ marginRight: '6px' }}
              ></span>
              Active
            </span>
            <span className="chip chip-success" id="chip-verified">
              ✓ Verified
            </span>
            <span className="chip chip-tech" id="chip-react">
              React
            </span>
            <span className="chip chip-tech" id="chip-node">
              Node.js
            </span>
            <span className="chip chip-tech" id="chip-k8s">
              Kubernetes
            </span>
            <span className="chip chip-priority" id="chip-urgent">
              Urgent Hire
            </span>
          </div>
        </div>

        {/* Typography */}
        <div className="showcase-card card" id="typography-card">
          <h4>Typography Scale</h4>
          <p className="card-description">
            Plus Jakarta Sans across all weight and size tokens.
          </p>
          <div className="type-showcase">
            <div className="type-sample">
              <span className="type-label">Headline LG</span>
              <span className="text-headline-lg">Executive Talent</span>
            </div>
            <div className="type-sample">
              <span className="type-label">Headline MD</span>
              <span className="text-headline-md">Senior Engineers</span>
            </div>
            <div className="type-sample">
              <span className="type-label">Body XL</span>
              <span className="text-body-xl">Premium placement services</span>
            </div>
            <div className="type-sample">
              <span className="type-label">Body MD</span>
              <span className="text-body-md">
                Standard body text for content
              </span>
            </div>
            <div className="type-sample">
              <span className="type-label">Label SM</span>
              <span className="text-label-sm">CATEGORY · METADATA</span>
            </div>
          </div>
        </div>

        {/* Elevation */}
        <div className="showcase-card card" id="elevation-card">
          <h4>Elevation System</h4>
          <p className="card-description">
            4-tier shadow system from flat surfaces to modal overlays.
          </p>
          <div className="elevation-demo">
            <div className="elevation-box elevation-0">E0</div>
            <div className="elevation-box elevation-1">E1</div>
            <div className="elevation-box elevation-2">E2</div>
            <div className="elevation-box elevation-3">E3</div>
          </div>
        </div>

        {/* Color Palette */}
        <div className="showcase-card card" id="colors-card">
          <h4>Color Palette</h4>
          <p className="card-description">
            Core tokens across primary, secondary, tertiary, and surface tiers.
          </p>
          <div className="color-palette">
            <div
              className="color-swatch"
              style={{ background: 'var(--color-primary-container)' }}
            >
              <span style={{ color: '#fff' }}>Primary</span>
            </div>
            <div
              className="color-swatch"
              style={{ background: 'var(--color-cobalt-bright)' }}
            >
              <span style={{ color: '#fff' }}>Cobalt</span>
            </div>
            <div
              className="color-swatch"
              style={{ background: 'var(--color-navy-dark)' }}
            >
              <span style={{ color: '#94A3B8' }}>Navy</span>
            </div>
            <div
              className="color-swatch"
              style={{ background: 'var(--color-emerald-accent)' }}
            >
              <span style={{ color: '#fff' }}>Emerald</span>
            </div>
            <div
              className="color-swatch"
              style={{ background: 'var(--color-error)' }}
            >
              <span style={{ color: '#fff' }}>Error</span>
            </div>
            <div
              className="color-swatch"
              style={{ background: 'var(--color-surface-container)' }}
            >
              <span style={{ color: 'var(--color-on-surface-variant)' }}>
                Surface
              </span>
            </div>
          </div>
        </div>

        {/* Forms */}
        <div className="showcase-card card" id="forms-card">
          <h4>Form Inputs</h4>
          <p className="card-description">
            Styled inputs with focus rings and placeholder tokens.
          </p>
          <div className="input-demo">
            <input
              type="text"
              className="input"
              placeholder="Search roles, skills, or companies…"
              id="demo-search-input"
            />
            <input
              type="email"
              className="input"
              placeholder="your.email@company.com"
              id="demo-email-input"
            />
          </div>
        </div>

        {/* Spacing */}
        <div className="showcase-card card" id="spacing-card">
          <h4>Spacing Scale</h4>
          <p className="card-description">
            Consistent spacing tokens from xs (4px) to 2xl (64px).
          </p>
          <div className="spacing-demo">
            {[
              { label: 'XS', width: '16px' },
              { label: 'SM', width: '32px' },
              { label: 'MD', width: '64px' },
              { label: 'LG', width: '96px' },
              { label: 'XL', width: '160px' },
              { label: '2XL', width: '256px' },
            ].map(({ label, width }) => (
              <div className="spacing-bar" key={label}>
                <span className="bar-label">{label}</span>
                <div className="bar" style={{ width }} />
              </div>
            ))}
          </div>
        </div>

        {/* Glassmorphism */}
        <div className="showcase-card card" id="glass-card">
          <h4>Glassmorphism</h4>
          <p className="card-description">
            Frosted glass panels with backdrop blur and translucent borders.
          </p>
          <div
            className="glass"
            style={{
              padding: 'var(--space-lg)',
              borderRadius: 'var(--rounded-lg)',
              textAlign: 'center',
            }}
          >
            <p
              className="text-label-md"
              style={{ marginBottom: 'var(--space-sm)' }}
            >
              Glass Panel
            </p>
            <p
              className="text-body-sm"
              style={{ color: 'var(--color-on-surface-variant)' }}
            >
              Translucent surface with backdrop blur
            </p>
          </div>
        </div>
      </div>

      {/* ────── Full-Width Job Card Demo ────── */}
      <div className="section-title" id="job-card-section">
        <h2>Sample Job Card</h2>
        <p>
          A complete component proving the design system is production-ready.
        </p>
      </div>

      <div className="component-grid">
        <div className="showcase-card card job-card-demo" id="job-card">
          <div className="job-header">
            <div className="company-logo">TW</div>
            <div className="job-info">
              <div className="job-title">Senior Platform Engineer</div>
              <div className="job-company">
                ThinkWires Inc. · San Francisco, CA
              </div>
            </div>
            <div className="job-status">
              <span className="chip chip-success">
                <span
                  className="status-dot"
                  style={{ marginRight: '6px' }}
                ></span>
                Immediate Hire
              </span>
            </div>
          </div>
          <div className="job-meta">
            <span className="meta-item">📍 Remote / Hybrid</span>
            <span className="meta-item">💼 8+ Years</span>
            <span className="meta-item">💰 $220k – $280k</span>
            <span className="meta-item">📋 Full-Time</span>
          </div>
          <div className="job-tags">
            <span className="chip chip-tech">Kubernetes</span>
            <span className="chip chip-tech">Go</span>
            <span className="chip chip-tech">Terraform</span>
            <span className="chip chip-tech">AWS</span>
            <span className="chip chip-tech">gRPC</span>
          </div>
          <div className="job-actions">
            <button type="button" className="btn btn-primary" id="btn-apply">
              Apply Now
            </button>
            <span className="view-details">View Details →</span>
          </div>
        </div>

        <div className="showcase-card card job-card-demo" id="job-card-2">
          <div className="job-header">
            <div
              className="company-logo"
              style={{
                background:
                  'linear-gradient(135deg, var(--color-tertiary-container), var(--color-emerald-accent))',
              }}
            >
              AC
            </div>
            <div className="job-info">
              <div className="job-title">Staff Frontend Architect</div>
              <div className="job-company">Acme Corp · London, UK</div>
            </div>
            <div className="job-status">
              <span className="chip chip-priority">High Priority</span>
            </div>
          </div>
          <div className="job-meta">
            <span className="meta-item">📍 On-Site</span>
            <span className="meta-item">💼 10+ Years</span>
            <span className="meta-item">💰 £160k – £200k</span>
            <span className="meta-item">📋 Contract</span>
          </div>
          <div className="job-tags">
            <span className="chip chip-tech">React</span>
            <span className="chip chip-tech">TypeScript</span>
            <span className="chip chip-tech">Next.js</span>
            <span className="chip chip-tech">GraphQL</span>
            <span className="chip chip-tech">Design Systems</span>
          </div>
          <div className="job-actions">
            <button type="button" className="btn btn-primary" id="btn-apply-2">
              Apply Now
            </button>
            <span className="view-details">View Details →</span>
          </div>
        </div>
      </div>

      {/* ────── Footer ────── */}
      <footer className="showcase-footer" id="showcase-footer">
        <p>
          ThinkWires Design System v1.0 · Vanilla CSS + React · All tokens
          verified ✓
        </p>
      </footer>
    </div>
  );
}

export default App;
