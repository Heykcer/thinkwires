import React from 'react';
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../test-utils';
import PermStaffPillars from '../../components/PermanentStaffingComponents/PermStaffPillars';

const mockPillarsData = {
  eyebrow: 'Strategic Architecture',
  heading: 'Four Pillars of Institutional Search',
  description:
    'Permanent staffing is an institutional asset allocation decision. Our search architecture removes asymmetric information and locks down elite leadership with unmatched retention longevity.',
  slaBadge: 'Institutional Executive SLA Enforced',
  items: [
    {
      step: 'PILLAR // 01',
      icon: 'travel_explore',
      title: 'Comprehensive Talent Search',
      description:
        'Multi-channel direct sourcing and exhaustive market intelligence mapping across Tier-1 global product engineering companies and regional GCCs. We tap confidential passive candidate pools unavailable through generic job portals.',
      points: [
        'Passive candidate mapping across Fortune 500 tech nodes',
        'Deep intelligence dossiers with compensation benchmarks',
        'Pre-vetted engineering leadership availability pipeline',
      ],
      accent: 'primary',
    },
    {
      step: 'PILLAR // 02',
      icon: 'psychology',
      title: 'Rigorous Multi-Tier Assessment',
      description:
        'Every profile passes high-order scrutiny before reaching executive committee review. We conduct deep architectural problem-solving audits, distributed systems stress tests, and leadership emotional intelligence appraisals.',
      points: [
        'Senior Peer-Level Architecture & Code Reviews',
        'Hogan-aligned behavioral leadership psychometrics',
        '360° confidential supervisory and peer references',
      ],
      accent: 'cobalt',
    },
    {
      step: 'PILLAR // 03',
      icon: 'shield',
      title: 'Executive Search Services',
      description:
        'High-stakes executive mandates carried out under ironclad non-disclosure agreements. We manage delicate board interactions, succession transitions, and cross-border executive relocations with complete operational discretion.',
      points: [
        'Confidential C-level & VP mandate representation',
        'Board-level competency & governance alignment',
        'Executive compensation packaging & LTI structuring',
      ],
      accent: 'emerald',
    },
    {
      step: 'PILLAR // 04',
      icon: 'handshake',
      title: 'Long-Term Partnership & Retention',
      description:
        'Placement day is the starting line. Our 90-day replacement guarantee is paired with structured day-30, day-60, and day-90 stakeholder alignment reviews ensuring organizational assimilation and peak productivity.',
      points: [
        'Contractual 90-Day no-cost replacement guarantee',
        'First 100 days executive onboarding integration',
        'Ongoing organizational retention health check-ins',
      ],
      accent: 'primary',
    },
  ],
};

describe('PermStaffPillars Component', () => {
  it('renders section header, eyebrow, title, and SLA badge', () => {
    renderWithProviders(<PermStaffPillars data={mockPillarsData} />);

    expect(screen.getByText('Strategic Architecture')).toBeInTheDocument();
    expect(
      screen.getByText('Four Pillars of Institutional Search')
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Permanent staffing is an institutional asset allocation decision/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText('Institutional Executive SLA Enforced')
    ).toBeInTheDocument();
  });

  it('renders all four pillar cards with aligned structure and content', () => {
    const { container } = renderWithProviders(
      <PermStaffPillars data={mockPillarsData} />
    );

    const cards = container.querySelectorAll('.PermStaff-pillarCard');
    expect(cards).toHaveLength(4);

    // Verify pillar step tags
    expect(screen.getByText('PILLAR // 01')).toBeInTheDocument();
    expect(screen.getByText('PILLAR // 02')).toBeInTheDocument();
    expect(screen.getByText('PILLAR // 03')).toBeInTheDocument();
    expect(screen.getByText('PILLAR // 04')).toBeInTheDocument();

    // Verify pillar titles
    expect(
      screen.getByRole('heading', { name: 'Comprehensive Talent Search' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Rigorous Multi-Tier Assessment' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Executive Search Services' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Long-Term Partnership & Retention' })
    ).toBeInTheDocument();

    // Verify feature points lists
    const pointsLists = container.querySelectorAll('.pillar-points');
    expect(pointsLists).toHaveLength(4);

    // Each card should have 3 bullet points with checkmark icons
    pointsLists.forEach((list) => {
      const items = list.querySelectorAll('li');
      expect(items).toHaveLength(3);
      items.forEach((item) => {
        const icon = item.querySelector('.material-symbols-outlined');
        expect(icon).toBeInTheDocument();
        expect(icon).toHaveTextContent('check_circle');
      });
    });

    // Check specific bullet items from each card
    expect(
      screen.getByText('Passive candidate mapping across Fortune 500 tech nodes')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Senior Peer-Level Architecture & Code Reviews')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Confidential C-level & VP mandate representation')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Contractual 90-Day no-cost replacement guarantee')
    ).toBeInTheDocument();
  });

  it('renders correct accent color classes on icon boxes', () => {
    const { container } = renderWithProviders(
      <PermStaffPillars data={mockPillarsData} />
    );

    const iconBoxes = container.querySelectorAll('.pillar-icon-box');
    expect(iconBoxes).toHaveLength(4);

    expect(iconBoxes[0]).toHaveClass('primary');
    expect(iconBoxes[1]).toHaveClass('cobalt');
    expect(iconBoxes[2]).toHaveClass('emerald');
    expect(iconBoxes[3]).toHaveClass('primary');
  });

  it('returns null when no data is provided', () => {
    const { container } = renderWithProviders(<PermStaffPillars data={null} />);
    expect(container.firstChild).toBeNull();
  });
});
