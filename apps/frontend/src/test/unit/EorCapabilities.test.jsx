/** @vitest-environment jsdom */
import React from 'react';
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import EorCapabilities from '../../components/EorComponents/EorCapabilities';
import { renderWithProviders } from '../test-utils';

const mockEorData = {
  eyebrow: 'CORE CAPABILITIES',
  heading: 'Comprehensive Global Employment Architecture',
  description: 'Enterprise EOR capabilities description.',
  capabilities: [
    {
      icon: 'verified_user',
      tag: 'Zero-Risk EOR Compliance',
      title: 'Simplified Regulatory Processes',
      description: 'Card 1 description.',
      bullets: ['Bullet 1'],
      footerLeft: 'SLA: 100% Audit Readiness',
      footerRight: 'Standard in all EOR Tiers',
    },
    {
      icon: 'card_membership',
      tag: 'Candidate Attraction Edge',
      title: 'Enterprise Employee Benefits',
      description: 'Card 2 description.',
      bullets: ['Bullet 1'],
      footerLeft: 'Retention Boost: +38% Contract Tenure',
      footerRight: 'Comprehensive Cover',
    },
    {
      icon: 'speed',
      tag: 'Velocity Focus',
      title: 'Rapid 5-Day Onboarding',
      description: 'Card 3 description.',
      bullets: ['Bullet 1'],
      footerLeft: 'Workflow: 100% Digital Document Vault',
      footerRight: 'Turnkey Setup',
    },
    {
      icon: 'calculate',
      tag: 'Precision Payroll',
      title: 'Tax Retention & Statutory Filings',
      description: 'Card 4 description.',
      bullets: ['Bullet 1'],
      footerLeft: 'Accuracy: 99.98% On-Time Processing',
      footerRight: 'Institutional Scale',
    },
  ],
};

describe('EorCapabilities Component - Card 2 Footer Spacing', () => {
  it('renders all four EOR capability cards', () => {
    renderWithProviders(<EorCapabilities data={mockEorData} />);

    expect(screen.getByText('Simplified Regulatory Processes')).toBeInTheDocument();
    expect(screen.getByText('Enterprise Employee Benefits')).toBeInTheDocument();
    expect(screen.getByText('Rapid 5-Day Onboarding')).toBeInTheDocument();
    expect(screen.getByText('Tax Retention & Statutory Filings')).toBeInTheDocument();
  });

  it('applies targeted spacing, alignment, and gap styling specifically to the second card footer', () => {
    const { container } = renderWithProviders(<EorCapabilities data={mockEorData} />);

    const footers = container.querySelectorAll('.Eor-cardFooter');
    expect(footers.length).toBe(4);

    // Card 1, 3, 4 should not have the second-card modifier
    expect(footers[0]).not.toHaveClass('Eor-cardFooter--second');
    expect(footers[2]).not.toHaveClass('Eor-cardFooter--second');
    expect(footers[3]).not.toHaveClass('Eor-cardFooter--second');

    // Card 2 must have the targeted modifier
    const secondCardFooter = footers[1];
    expect(secondCardFooter).toHaveClass('Eor-cardFooter--second');
    expect(secondCardFooter).toHaveStyle({ gap: '1rem' });

    // Left metric text
    const leftText = secondCardFooter.querySelector('.Eor-cardFooterLeft--second');
    expect(leftText).toBeInTheDocument();
    expect(leftText).toHaveTextContent('Retention Boost: +38% Contract Tenure');
    expect(leftText).toHaveStyle({ textAlign: 'left' });

    // Right highlight text
    const rightText = secondCardFooter.querySelector('.Eor-cardFooterRight--second');
    expect(rightText).toBeInTheDocument();
    expect(rightText).toHaveTextContent('Comprehensive Cover');
    expect(rightText).toHaveStyle({ textAlign: 'right' });
  });
});

