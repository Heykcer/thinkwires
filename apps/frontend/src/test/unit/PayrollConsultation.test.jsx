/** @vitest-environment jsdom */
import React from 'react';
import { describe, it, expect } from 'vitest';
import { screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import PayrollConsultation from '../../components/PayrollComponents/PayrollConsultation';
import { renderWithProviders } from '../test-utils';

const mockData = {
  eyebrow: 'Enterprise Consultation',
  heading: 'Get Started with Thinkwires HR Today!',
  description:
    'Avoid payroll errors, compliance risks, and time-consuming internal administration.',
  hqDetails: {
    title: 'Direct Corporate Headquarters',
    campus: 'Noida Corporate Campus',
    address: 'Plot No. 20, Block H-1/A, Sector 63, Noida, Uttar Pradesh 201301',
    desk: 'Direct Operations & HR Desk',
    email: 'hr@thinkwires.com',
    window: 'Operations Window',
    hours: '09:00 AM – 19:00 PM IST (Mon-Sat)',
    regions: ['United States', 'Canada Hub', 'India Central'],
  },
};

describe('PayrollConsultation Component', () => {
  it('renders form headings, fields, and custom select triggers with initial values', () => {
    const { container } = renderWithProviders(
      <PayrollConsultation data={mockData} />
    );

    expect(
      screen.getByText('Get Started with Thinkwires HR Today!')
    ).toBeInTheDocument();

    const sizeTrigger = container.querySelector('#employeeSize-trigger');
    expect(sizeTrigger).toBeInTheDocument();
    expect(sizeTrigger).toHaveClass('Payroll-customSelectTrigger');
    expect(sizeTrigger).toHaveTextContent('Select employee size');

    const serviceTrigger = container.querySelector('#serviceReq-trigger');
    expect(serviceTrigger).toBeInTheDocument();
    expect(serviceTrigger).toHaveClass('Payroll-customSelectTrigger');
    expect(serviceTrigger).toHaveTextContent('Payroll Outsourcing');
  });

  it('opens employee size dropdown and updates selection', () => {
    const { container } = renderWithProviders(
      <PayrollConsultation data={mockData} />
    );

    const sizeTrigger = container.querySelector('#employeeSize-trigger');
    expect(container.querySelector('#employeeSize-menu')).not.toBeInTheDocument();

    // Click trigger to open
    fireEvent.click(sizeTrigger);

    const menu = container.querySelector('#employeeSize-menu');
    expect(menu).toBeInTheDocument();
    expect(menu).toHaveClass('Payroll-customSelectMenu');

    // Select '51-200 employees'
    const opt = within(menu).getByText('51-200 employees');
    fireEvent.click(opt);

    // Menu closes and trigger updates
    expect(container.querySelector('#employeeSize-menu')).not.toBeInTheDocument();
    expect(sizeTrigger).toHaveTextContent('51-200 employees');

    // Hidden select stays in sync
    const hiddenSelect = container.querySelector('#employeeSize');
    expect(hiddenSelect.value).toBe('51-200');
  });

  it('opens service required dropdown and updates selection', () => {
    const { container } = renderWithProviders(
      <PayrollConsultation data={mockData} />
    );

    const serviceTrigger = container.querySelector('#serviceReq-trigger');
    expect(container.querySelector('#serviceReq-menu')).not.toBeInTheDocument();

    fireEvent.click(serviceTrigger);

    const menu = container.querySelector('#serviceReq-menu');
    expect(menu).toBeInTheDocument();

    // Select 'Employer of Record (EOR)'
    const opt = within(menu).getByText('Employer of Record (EOR)');
    fireEvent.click(opt);

    expect(container.querySelector('#serviceReq-menu')).not.toBeInTheDocument();
    expect(serviceTrigger).toHaveTextContent('Employer of Record (EOR)');

    const hiddenSelect = container.querySelector('#serviceReq');
    expect(hiddenSelect.value).toBe('Employer of Record');
  });

  it('closes dropdowns on click outside', () => {
    const { container } = renderWithProviders(
      <PayrollConsultation data={mockData} />
    );

    const sizeTrigger = container.querySelector('#employeeSize-trigger');
    fireEvent.click(sizeTrigger);
    expect(container.querySelector('#employeeSize-menu')).toBeInTheDocument();

    fireEvent.mouseDown(document.body);
    expect(container.querySelector('#employeeSize-menu')).not.toBeInTheDocument();
  });
});
