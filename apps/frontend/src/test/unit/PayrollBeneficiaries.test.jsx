import React from 'react';
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../test-utils';
import PayrollBeneficiaries from '../../components/PayrollComponents/PayrollBeneficiaries';

const mockBeneficiariesData = {
  eyebrow: 'Architected For Scale',
  heading: 'Who Benefits From Thinkwires Payroll Outsourcing?',
  description:
    'From fast-moving venture startups to multi-entity foreign subsidiaries, our payroll model dynamically flexes around headcount and regulatory jurisdictions.',
  segments: [
    {
      step: '01',
      icon: 'rocket_launch',
      title: 'Startups & Fast-Growing Scaleups',
      description:
        'Eliminate the need to hire internal HR administrators or purchase expensive payroll licenses. Focus engineering capital directly on core product iterations.',
      points: [
        'Agile month-to-month onboarding',
        'Direct integration with employee offer letters',
        'Zero setup penalty for shifting headcount',
      ],
    },
    {
      step: '02',
      icon: 'domain',
      title: 'Large MNCs & Global Enterprises',
      description:
        'Institutional-grade reconciliation across multi-city branches, diverse collective wage bands, and statutory audit-ready balance sheets for thousands of personnel.',
      points: [
        'Dedicated on-shore compliance manager',
        'Comprehensive annual statutory audits',
        'Multi-level approval role matrices',
      ],
    },
    {
      step: '03',
      icon: 'hub',
      title: 'Recruitment Agencies & Staffing Subcontractors',
      description:
        'Seamless third-party payroll fulfillment for deployed IT and functional contractors. We act as your invisible backend engine with white-labeled salary slips.',
      points: [
        'White-label automated pay slips',
        'Contingent worker labor compliance',
        'Weekly or bi-weekly disbursement runs',
      ],
    },
    {
      step: '04',
      icon: 'public',
      title: 'Cross-Border GCCs & Remote Tech Pods',
      description:
        'Enabling North American and European enterprises to seamlessly operate Global Capability Centers (GCCs) in India without establishing separate internal payroll departments.',
      points: [
        'FX-compliant foreign remittances',
        'Double taxation treaty adherence',
        'Cross-timezone enterprise SLA support',
      ],
    },
  ],
};

describe('PayrollBeneficiaries Component', () => {
  it('renders section header, eyebrow, title, and description', () => {
    renderWithProviders(<PayrollBeneficiaries data={mockBeneficiariesData} />);

    expect(screen.getByText('Architected For Scale')).toBeInTheDocument();
    expect(
      screen.getByText('Who Benefits From Thinkwires Payroll Outsourcing?')
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /From fast-moving venture startups to multi-entity foreign subsidiaries/i
      )
    ).toBeInTheDocument();
  });

  it('renders all four beneficiary cards with equal structure and content', () => {
    const { container } = renderWithProviders(
      <PayrollBeneficiaries data={mockBeneficiariesData} />
    );

    const cards = container.querySelectorAll('.Payroll-segmentCard');
    expect(cards).toHaveLength(4);

    // Verify numbered step indicators
    expect(screen.getByText('01')).toBeInTheDocument();
    expect(screen.getByText('02')).toBeInTheDocument();
    expect(screen.getByText('03')).toBeInTheDocument();
    expect(screen.getByText('04')).toBeInTheDocument();

    // Verify icons
    expect(screen.getByText('rocket_launch')).toBeInTheDocument();
    expect(screen.getByText('domain')).toBeInTheDocument();
    expect(screen.getByText('hub')).toBeInTheDocument();
    expect(screen.getByText('public')).toBeInTheDocument();

    // Verify headings
    expect(
      screen.getByRole('heading', {
        name: 'Startups & Fast-Growing Scaleups',
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        name: 'Large MNCs & Global Enterprises',
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        name: 'Recruitment Agencies & Staffing Subcontractors',
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        name: 'Cross-Border GCCs & Remote Tech Pods',
      })
    ).toBeInTheDocument();

    // Verify feature lists and bullets
    const lists = container.querySelectorAll('.Payroll-segmentList');
    expect(lists).toHaveLength(4);

    lists.forEach((list) => {
      const items = list.querySelectorAll('.Payroll-segmentListItem');
      expect(items).toHaveLength(3);
      items.forEach((item) => {
        expect(item.querySelector('.Payroll-bulletDot')).toBeInTheDocument();
        expect(item.querySelector('.Payroll-bulletText')).toBeInTheDocument();
      });
    });

    // Check specific bullet items from each card
    expect(
      screen.getByText('Agile month-to-month onboarding')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Dedicated on-shore compliance manager')
    ).toBeInTheDocument();
    expect(
      screen.getByText('White-label automated pay slips')
    ).toBeInTheDocument();
    expect(
      screen.getByText('FX-compliant foreign remittances')
    ).toBeInTheDocument();
  });

  it('returns null when no data is provided', () => {
    const { container } = renderWithProviders(
      <PayrollBeneficiaries data={null} />
    );
    expect(container.firstChild).toBeNull();
  });
});
