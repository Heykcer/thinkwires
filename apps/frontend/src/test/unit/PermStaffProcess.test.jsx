import React from 'react';
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../test-utils';
import PermStaffProcess from '../../components/PermanentStaffingComponents/PermStaffProcess';

const mockProcessData = {
  eyebrow: 'Precision Methodology',
  heading: 'Structured 4-Step Recruitment Process',
  description:
    'From intake calibration to executive day one, our delivery roadmap is engineered for speed without compromising rigorous quality standards.',
  steps: [
    {
      step: '1',
      phase: 'Phase I: Days 1–3',
      title: 'Requirements Analysis & Competency Matrix',
      description:
        'Collaborative alignment with C-suite and technical leads. We construct a multi-dimensional scorecard defining technical non-negotiables, leadership style, and expected outcomes.',
      deliverable: 'Role Blueprint & Scorecard',
    },
    {
      step: '2',
      phase: 'Phase II: Days 4–10',
      title: 'Talent Sourcing & Passive Intelligence',
      description:
        'Executing deep market sweeps across target enterprise ecosystems. Discreet approach vectors initiate exploratory discussions with passive high-performing industry leaders.',
      deliverable: 'Initial Market Map of 25+ Candidates',
    },
    {
      step: '3',
      phase: 'Phase III: Days 11–18',
      title: 'Deep Screening & Leadership Assessment',
      description:
        'Multi-stage evaluations conducted by our domain practice heads. Only top candidates surpassing rigorous cultural and technical bars are submitted.',
      deliverable: 'Curated Dossier of 3–5 Finalists',
    },
    {
      step: '4',
      phase: 'Phase IV: Days 19–30+',
      title: 'Placement, Offer & Executive Onboarding',
      description:
        'Strategic compensation calibration, counter-offer mitigation, and background verification. Thinkwires facilitates transition through day 90 and beyond.',
      deliverable: 'Signed Mandate & Onboarding Plan',
    },
  ],
  metricsStrip: {
    retention: '98.2%',
    retentionLabel: 'Executive Retention at 12 Months',
    retentionDesc:
      'Our placements stay, scale teams, and deliver substantial shareholder value.',
    acceptance: '94.6%',
    acceptanceLabel: 'First-Offer Acceptance Rate',
  },
};

describe('PermStaffProcess Component', () => {
  it('renders section header, eyebrow, title, and description', () => {
    renderWithProviders(<PermStaffProcess data={mockProcessData} />);

    expect(screen.getByText('Precision Methodology')).toBeInTheDocument();
    expect(
      screen.getByText('Structured 4-Step Recruitment Process')
    ).toBeInTheDocument();
    expect(
      screen.getByText(/From intake calibration to executive day one/i)
    ).toBeInTheDocument();
  });

  it('renders all four process cards with uniform structure and content', () => {
    const { container } = renderWithProviders(
      <PermStaffProcess data={mockProcessData} />
    );

    const cards = container.querySelectorAll('.PermStaff-processCard');
    expect(cards).toHaveLength(4);

    // Verify step number badges (1, 2, 3, 4)
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();

    // Verify number circle color classes: 1-3 primary, 4 emerald
    const circles = container.querySelectorAll('.step-circle');
    expect(circles).toHaveLength(4);
    expect(circles[0]).toHaveClass('primary');
    expect(circles[1]).toHaveClass('primary');
    expect(circles[2]).toHaveClass('primary');
    expect(circles[3]).toHaveClass('emerald');

    // Verify phase labels
    expect(screen.getByText('Phase I: Days 1–3')).toBeInTheDocument();
    expect(screen.getByText('Phase II: Days 4–10')).toBeInTheDocument();
    expect(screen.getByText('Phase III: Days 11–18')).toBeInTheDocument();
    expect(screen.getByText('Phase IV: Days 19–30+')).toBeInTheDocument();

    // Verify headings
    expect(
      screen.getByRole('heading', {
        name: 'Requirements Analysis & Competency Matrix',
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        name: 'Talent Sourcing & Passive Intelligence',
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        name: 'Deep Screening & Leadership Assessment',
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        name: 'Placement, Offer & Executive Onboarding',
      })
    ).toBeInTheDocument();

    // Verify Deliverable boxes
    const deliverableBoxes = container.querySelectorAll('.step-deliverable');
    expect(deliverableBoxes).toHaveLength(4);

    expect(screen.getByText('Role Blueprint & Scorecard')).toBeInTheDocument();
    expect(
      screen.getByText('Initial Market Map of 25+ Candidates')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Curated Dossier of 3–5 Finalists')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Signed Mandate & Onboarding Plan')
    ).toBeInTheDocument();
  });

  it('renders process metric strip correctly', () => {
    renderWithProviders(<PermStaffProcess data={mockProcessData} />);

    expect(
      screen.getByText(/98.2% Executive Retention at 12 Months/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Our placements stay, scale teams, and deliver substantial shareholder value./i
      )
    ).toBeInTheDocument();
    expect(screen.getByText('94.6%')).toBeInTheDocument();
    expect(
      screen.getByText('First-Offer Acceptance Rate')
    ).toBeInTheDocument();
  });

  it('returns null when no data is provided', () => {
    const { container } = renderWithProviders(<PermStaffProcess data={null} />);
    expect(container.firstChild).toBeNull();
  });
});
