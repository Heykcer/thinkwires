/** @vitest-environment jsdom */
import React from 'react';
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import GrowthTimeline from '../../components/AboutComponents/GrowthTimeline';
import { renderWithProviders } from '../test-utils';

describe('GrowthTimeline Component - Our Growth Evolution UI Redesign', () => {
  it('renders section header with eyebrow, title, and subtitle', () => {
    renderWithProviders(<GrowthTimeline />);

    expect(
      screen.getByRole('heading', { name: /Our Growth Evolution/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /From an agile aggregator in Sector 63, Noida to a cross-continental staffing architecture/i
      )
    ).toBeInTheDocument();
  });

  it('renders all four timeline cards (2022, 2023, 2024, 2025+) with distinct styling classes', () => {
    const { container } = renderWithProviders(<GrowthTimeline />);

    // Years
    expect(screen.getByText('2022')).toBeInTheDocument();
    expect(screen.getByText('2023')).toBeInTheDocument();
    expect(screen.getByText('2024')).toBeInTheDocument();
    expect(screen.getByText(/2025\+|2026\+/)).toBeInTheDocument();

    // Verify card elements for specific visual treatments
    const card2022 = container.querySelector('.GrowthTimeline-card--2022');
    const card2023 = container.querySelector('.GrowthTimeline-card--2023');
    const card2024 = container.querySelector('.GrowthTimeline-card--2024');
    const card2026 = container.querySelector('.GrowthTimeline-card--2026');

    expect(card2022).toBeInTheDocument();
    expect(card2023).toBeInTheDocument();
    expect(card2024).toBeInTheDocument();
    expect(card2026).toBeInTheDocument();

    // Badges / Tags inside each card
    expect(card2022.querySelector('.GrowthTimeline-tag')).toHaveTextContent(/Founding/i);
    expect(card2023.querySelector('.GrowthTimeline-tag')).toHaveTextContent(/Practice Alignment/i);
    expect(card2024.querySelector('.GrowthTimeline-tag')).toHaveTextContent(/Cross-Border/i);
    expect(card2026.querySelector('.GrowthTimeline-tag')).toHaveTextContent(/FUTURE HORIZONS/i);

    // Titles
    expect(card2022.querySelector('.GrowthTimeline-cardTitle')).toHaveTextContent(
      'Foundation & Model Inception'
    );
    expect(card2023.querySelector('.GrowthTimeline-cardTitle')).toHaveTextContent(
      'Growth & Practice Alignment'
    );
    expect(card2024.querySelector('.GrowthTimeline-cardTitle')).toHaveTextContent(
      'Cross-Border Expansion'
    );
    expect(card2026.querySelector('.GrowthTimeline-cardTitle')).toHaveTextContent(
      'AI-Powered Delivery & Telemetry Vetting'
    );

    // 2024 card has the decorative globe watermark
    expect(
      card2024.querySelector('.GrowthTimeline-globeWatermark')
    ).toBeInTheDocument();

    // 2026+ standout card has ambient glow and dark theme class
    expect(card2026).toHaveClass('GrowthTimeline-card--dark');
    expect(
      card2026.querySelector('.GrowthTimeline-ambientGlow')
    ).toBeInTheDocument();
  });

  it('renders custom incoming data if provided while preserving 4-card structure', () => {
    const customData = {
      eyebrow: 'COMPANY JOURNEY',
      heading: 'Custom Growth Roadmap',
      description: 'Custom description text',
      milestones: [
        {
          id: 'm-1',
          year: '2022',
          tag: 'Genesis',
          title: 'Custom Inception',
          description: 'Custom 2022 description.',
        },
      ],
    };

    renderWithProviders(<GrowthTimeline data={customData} />);

    expect(
      screen.getByRole('heading', { name: /Custom Growth Roadmap/i })
    ).toBeInTheDocument();
    expect(screen.getByText('Custom Inception')).toBeInTheDocument();
    expect(screen.getByText('Genesis')).toBeInTheDocument();
  });
});
