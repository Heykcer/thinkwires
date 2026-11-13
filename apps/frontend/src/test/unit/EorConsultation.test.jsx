/** @vitest-environment jsdom */
import React from 'react';
import { describe, it, expect } from 'vitest';
import { screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import EorConsultation from '../../components/EorComponents/EorConsultation';
import { renderWithProviders } from '../test-utils';

const mockData = {
  eyebrow: 'FAST-TRACK EVALUATION',
  heading: 'Ready to Simplify Contract & Global Hiring?',
  description: 'Speak with our senior cross-border EOR advisors.',
  benefits: ['Guaranteed 5-Hour SLA Business Response'],
  hq: 'Corporate Headquarters: Sector 62, Noida',
};

describe('EorConsultation Component - Target Geographies Dropdown', () => {
  it('renders Target Geographies custom trigger and balanced arrow', () => {
    const { container } = renderWithProviders(<EorConsultation data={mockData} />);

    const trigger = screen.getByRole('button', { name: /Target Geographies/i });
    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveClass('Eor-customSelectTrigger');
    expect(trigger).toHaveTextContent('India (Local & Offshore Tech Squads)');

    const arrow = container.querySelector('.Payroll-selectArrow.Eor-dropdownArrow');
    expect(arrow).toBeInTheDocument();
  });

  it('opens modern custom options menu on trigger click and allows selecting options', () => {
    const { container } = renderWithProviders(<EorConsultation data={mockData} />);

    const trigger = screen.getByRole('button', { name: /Target Geographies/i });
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();

    // Click trigger to open menu
    fireEvent.click(trigger);

    const menu = screen.getByRole('listbox');
    expect(menu).toBeInTheDocument();
    expect(menu).toHaveClass('Eor-customSelectMenu');

    // All options rendered with proper labels inside the menu
    expect(within(menu).getByText('United States (Multi-State Compliance)')).toBeInTheDocument();
    expect(within(menu).getByText('Canada (Provincial EOR)')).toBeInTheDocument();
    expect(within(menu).getByText('GCC / Middle East Expansion')).toBeInTheDocument();
    expect(within(menu).getByText('Multi-Country Cross Border')).toBeInTheDocument();

    // Select Canada
    const canadaOption = within(menu).getByText('Canada (Provincial EOR)');
    fireEvent.click(canadaOption);

    // Menu closes and trigger shows updated selection
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(trigger).toHaveTextContent('Canada (Provincial EOR)');

    // Hidden select is synced
    const hiddenSelect = container.querySelector('select#targetGeo');
    expect(hiddenSelect.value).toBe('canada');
  });
});
