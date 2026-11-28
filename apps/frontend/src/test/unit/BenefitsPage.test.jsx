import React from 'react';
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../test-utils';
import BenefitsPage from '../../pages/BenefitsPage';

describe('BenefitsPage Component', () => {
  it('renders Hero, all 7 Benefits, 4 Culture Pillars, and 4 Testimonials', () => {
    renderWithProviders(<BenefitsPage />);

    // Hero
    expect(
      screen.getByRole('heading', { level: 1, name: /Benefits Working with Thinkwires/i })
    ).toBeInTheDocument();

    // 7 Benefits from DOCX
    expect(screen.getByText('Reliable & Timely Compensation')).toBeInTheDocument();
    expect(screen.getByText('Work-Life Harmony')).toBeInTheDocument();
    expect(screen.getByText('Learning & Professional Growth')).toBeInTheDocument();
    expect(screen.getByText('Statutory & Employee Benefits')).toBeInTheDocument();
    expect(screen.getByText('Career Opportunities & Flexibility')).toBeInTheDocument();
    expect(screen.getByText('Career Guidance & Development')).toBeInTheDocument();
    expect(screen.getByText('Global Career Exposure')).toBeInTheDocument();

    // 4 Employee-Centric Culture Pillars from DOCX
    expect(
      screen.getByRole('heading', { name: /How Thinkwires Creates an Employee-Centric Culture/i })
    ).toBeInTheDocument();
    expect(screen.getByText('Encourage Diverse Perspectives')).toBeInTheDocument();
    expect(screen.getByText('Invest in Continuous Professional Development')).toBeInTheDocument();
    expect(screen.getByText('Celebrate Contributions and Achievements')).toBeInTheDocument();
    expect(screen.getByText('Listen, Learn, and Act on Employee Feedback')).toBeInTheDocument();

    // 4 Testimonials from DOCX
    expect(screen.getByRole('heading', { name: /Employee Testimonials/i })).toBeInTheDocument();
    expect(screen.getByText('Sanjana Choudry')).toBeInTheDocument();
    expect(screen.getByText('Vishal Kumar')).toBeInTheDocument();
    expect(screen.getByText('Manju Sinha')).toBeInTheDocument();
    expect(screen.getByText('Amit Choudhary')).toBeInTheDocument();
  });
});
