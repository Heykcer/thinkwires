# ThinkWires Design System

## Brand & Style

This design system establishes an elite, high-trust digital environment tailored for global enterprise talent acquisition leaders, CTOs, and high-impact engineering candidates. The brand tone balances executive authority with modern software engineering agility: institutional confidence, velocity, and technical excellence.

The aesthetic fuses **Corporate Modern** with **Elevated Glassmorphic Accents**:

- Deep, prestige architectural foundations anchored by midnight slate and deep maritime blue.
- Precision cobalt blue signaling intelligence, stability, and digital clarity.
- Energetic tech emerald green accents celebrating global network velocity, successful placements, and live talent status.
- Crisp white content surfaces floating over hyper-subtle radial blue glows, micro-dot matrix patterns, and hairline gradient borders (1px border treatments with translucent highlights).
- Clean interactive state transitions featuring micro-elevation, directional glow lines, and executive-tier typographic hierarchy that eliminates visual noise and builds instant enterprise credibility.

---

## Colors

The color palette translates enterprise scale and high-level engineering precision into functional chromatic tiers:

| Token                    | Hex       | Usage                                                 |
| ------------------------ | --------- | ----------------------------------------------------- |
| `primary`                | `#0037B0` | Core brand primary                                    |
| `primary-container`      | `#1D4ED8` | Primary CTAs, active selection rings, verified badges |
| `on-primary`             | `#FFFFFF` | Text/icons on primary surfaces                        |
| `on-primary-container`   | `#CAD3FF` | Text on primary containers                            |
| `inverse-primary`        | `#B7C4FF` | Primary in dark contexts                              |
| `cobalt-bright`          | `#2563EB` | Hover states, active UI elements                      |
| `cobalt-glow`            | `#3B82F6` | Glows, focus rings                                    |
| `secondary`              | `#49607E` | Secondary actions                                     |
| `secondary-container`    | `#C4DCFF` | Secondary containers                                  |
| `on-secondary`           | `#FFFFFF` | Text on secondary                                     |
| `tertiary`               | `#004F35` | Success, availability                                 |
| `tertiary-container`     | `#006A48` | Tertiary containers                                   |
| `on-tertiary`            | `#FFFFFF` | Text on tertiary                                      |
| `emerald-accent`         | `#22C55E` | Live status, success metrics                          |
| `error`                  | `#BA1A1A` | Error states                                          |
| `error-container`        | `#FFDAD6` | Error containers                                      |
| `on-error`               | `#FFFFFF` | Text on error                                         |
| `surface`                | `#FAF8FF` | Default page surface                                  |
| `surface-dim`            | `#D9D9E5` | Dimmed surface                                        |
| `surface-container`      | `#EDEDF9` | Card containers                                       |
| `surface-container-high` | `#E8E7F3` | Elevated containers                                   |
| `on-surface`             | `#1A1B23` | Primary text                                          |
| `on-surface-variant`     | `#434655` | Secondary text                                        |
| `outline`                | `#747686` | Borders, dividers                                     |
| `outline-variant`        | `#C4C5D7` | Subtle borders                                        |
| `navy-dark`              | `#0F172A` | Deep structural base, hero footers                    |
| `slate-surface`          | `#F8FAFC` | Neutral surface tint                                  |
| `card-stroke`            | `#E2E8F0` | Card borders                                          |

---

## Typography

Font: **Plus Jakarta Sans** (Google Fonts)

| Token                 | Size | Weight | Line Height | Letter Spacing |
| --------------------- | ---- | ------ | ----------- | -------------- |
| `display-hero`        | 56px | 800    | 64px        | -0.02em        |
| `display-hero-mobile` | 36px | 800    | 44px        | -0.01em        |
| `headline-xl`         | 40px | 700    | 48px        | -0.02em        |
| `headline-xl-mobile`  | 28px | 700    | 36px        | -0.01em        |
| `headline-lg`         | 30px | 700    | 38px        | -0.015em       |
| `headline-md`         | 22px | 600    | 30px        | —              |
| `headline-sm`         | 18px | 600    | 26px        | —              |
| `body-xl`             | 18px | 400    | 28px        | —              |
| `body-md`             | 16px | 400    | 24px        | —              |
| `body-sm`             | 14px | 400    | 20px        | —              |
| `label-md`            | 14px | 600    | 18px        | 0.01em         |
| `label-sm`            | 12px | 600    | 16px        | 0.02em         |
| `stat-counter`        | 44px | 800    | 52px        | -0.02em        |

---

## Spacing & Border Radii

### Border Radii

| Token          | Value   |
| -------------- | ------- |
| `rounded-sm`   | 0.25rem |
| `rounded`      | 0.5rem  |
| `rounded-md`   | 0.75rem |
| `rounded-lg`   | 1rem    |
| `rounded-xl`   | 1.5rem  |
| `rounded-full` | 9999px  |

### Spacing

| Token            | Value   |
| ---------------- | ------- |
| `space-xs`       | 0.25rem |
| `space-sm`       | 0.5rem  |
| `space-md`       | 1rem    |
| `space-lg`       | 1.5rem  |
| `space-xl`       | 2.5rem  |
| `space-2xl`      | 4rem    |
| `gutter`         | 1.5rem  |
| `gutter-desktop` | 2rem    |
| `margin`         | 1.5rem  |
| `margin-desktop` | 5rem    |

---

## Elevation & Depth

| Level                      | Box Shadow                                                                  |
| -------------------------- | --------------------------------------------------------------------------- |
| Base (Elevation 0)         | None — flat surface with 1px solid `card-stroke`                            |
| Card Default (Elevation 1) | `0 1px 3px 0 rgba(15,23,42,0.05), 0 1px 2px -1px rgba(15,23,42,0.05)`       |
| Card Hover (Elevation 2)   | `0 12px 24px -6px rgba(15,23,42,0.08), 0 4px 8px -2px rgba(37,99,235,0.06)` |
| Modal (Elevation 3)        | `0 25px 50px -12px rgba(10,37,64,0.25)`                                     |
| Glassmorphic Header        | `background: rgba(255,255,255,0.85); backdrop-filter: blur(12px)`           |

---

## Shapes

| Element                      | Radius                        |
| ---------------------------- | ----------------------------- |
| Inputs, secondary containers | 0.5rem (8px)                  |
| Job cards, feature modules   | 1rem (16px)                   |
| Buttons                      | 0.5rem (8px) or pill (9999px) |
| Badges, chips                | 9999px (pill)                 |
| Avatar/icon badges           | 0.75rem (12px)                |

---

## Layout Grid

| Breakpoint          | Columns | Gutter | Margin  | Max Width |
| ------------------- | ------- | ------ | ------- | --------- |
| Desktop (≥1280px)   | 12      | 2rem   | 5rem    | 1240px    |
| Tablet (768–1279px) | 8       | 1.5rem | 2rem    | —         |
| Mobile (<768px)     | 4       | 1rem   | 1.25rem | —         |
