/** @vitest-environment jsdom */
import React from 'react';
import { describe, it, expect } from 'vitest';
import { screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import PermStaffConsultation from '../../components/PermanentStaffingComponents/PermStaffConsultation';
import { renderWithProviders } from '../test-utils';

const mockData = {
  eyebrow: 'Confidential Mandate Desk',
  heading: 'Initiate Executive Search Mandate',
  description:
    'Connect directly with our senior talent acquisition partners. We will formulate a preliminary market intelligence brief and talent acquisition roadmap within 24 business hours.',
  hotline: 'hr@thinkwires.com',
  hotlineAvailability: 'Available 09:00 AM – 19:00 PM IST • Mon – Fri',
  hubs: [
    {
      title: 'Noida HQ Operations',
      address: 'Tower B, Sector 62, Electronic City, Noida, UP 201309',
    },
    {
      title: 'North American Delivery Hub',
      address: 'San Francisco • Toronto Delivery Center',
    },
  ],
  confidentialityNote:
    'All client inquiries are bound by mutual NDA terms upon initial transmission. No information is disclosed without explicit board-level approval.',
};

describe('PermStaffConsultation Component', () => {
  it('renders the dark hotline card with vertically stacked items and correct information', () => {
    const { container } = renderWithProviders(
      <PermStaffConsultation data={mockData} />
    );

    const hotlineCard = container.querySelector('.hotline-card');
    expect(hotlineCard).toBeInTheDocument();

    const hlTop = hotlineCard.querySelector('.hl-top');
    expect(hlTop).toBeInTheDocument();
    expect(hlTop).toHaveTextContent('Executive Mandate Inquiries');
    expect(hlTop.querySelector('.material-symbols-outlined')).toHaveTextContent(
      'mail'
    );

    const hlPhone = hotlineCard.querySelector('.hl-phone');
    expect(hlPhone).toBeInTheDocument();
    expect(hlPhone).toHaveTextContent('hr@thinkwires.com');
    expect(hlPhone).toHaveAttribute('href', 'mailto:hr@thinkwires.com');

    const hlNote = hotlineCard.querySelector('.hl-note');
    expect(hlNote).toBeInTheDocument();
    expect(hlNote).toHaveTextContent(
      'Available 09:00 AM – 19:00 PM IST • Mon – Fri'
    );
  });

  it('renders Mandate Hierarchy and Target Timeline custom select triggers with default values', () => {
    const { container } = renderWithProviders(
      <PermStaffConsultation data={mockData} />
    );

    const hierarchyTrigger = container.querySelector(
      '#mandateHierarchy-trigger'
    );
    expect(hierarchyTrigger).toBeInTheDocument();
    expect(hierarchyTrigger).toHaveClass('PermStaff-customSelectTrigger');
    expect(hierarchyTrigger).toHaveTextContent('C-Suite (CTO / CIO / CDO)');

    const timelineTrigger = container.querySelector('#targetTimeline-trigger');
    expect(timelineTrigger).toBeInTheDocument();
    expect(timelineTrigger).toHaveClass('PermStaff-customSelectTrigger');
    expect(timelineTrigger).toHaveTextContent('Immediate (Under 30 Days)');

    const arrows = container.querySelectorAll('.PermStaff-selectArrow');
    expect(arrows.length).toBe(2);
    arrows.forEach((arrow) => {
      expect(arrow).toHaveTextContent('expand_more');
      expect(arrow).not.toHaveClass('is-open');
    });
  });

  it('opens Mandate Hierarchy dropdown menu on click and selects an option', () => {
    const { container } = renderWithProviders(
      <PermStaffConsultation data={mockData} />
    );

    const hierarchyTrigger = container.querySelector(
      '#mandateHierarchy-trigger'
    );
    expect(
      container.querySelector('#mandateHierarchy-menu')
    ).not.toBeInTheDocument();

    // Click trigger to open menu
    fireEvent.click(hierarchyTrigger);

    const menu = container.querySelector('#mandateHierarchy-menu');
    expect(menu).toBeInTheDocument();
    expect(menu).toHaveClass('PermStaff-customSelectMenu');

    // Arrow icon should now have is-open class (rotated)
    const arrow = hierarchyTrigger.querySelector('.PermStaff-selectArrow');
    expect(arrow).toHaveClass('is-open');

    // Select 'Vice President / Head of Engineering'
    const vpOption = within(menu).getByText(
      'Vice President / Head of Engineering'
    );
    fireEvent.click(vpOption);

    // Menu should close, arrow reset, trigger update
    expect(
      container.querySelector('#mandateHierarchy-menu')
    ).not.toBeInTheDocument();
    expect(arrow).not.toHaveClass('is-open');
    expect(hierarchyTrigger).toHaveTextContent(
      'Vice President / Head of Engineering'
    );

    // Hidden select stays in sync
    const hiddenSelect = container.querySelector('#mandateHierarchy');
    expect(hiddenSelect.value).toBe('Vice President / Head of Engineering');
  });

  it('opens Target Timeline dropdown menu on click and selects an option', () => {
    const { container } = renderWithProviders(
      <PermStaffConsultation data={mockData} />
    );

    const timelineTrigger = container.querySelector('#targetTimeline-trigger');
    expect(
      container.querySelector('#targetTimeline-menu')
    ).not.toBeInTheDocument();

    // Click trigger to open menu
    fireEvent.click(timelineTrigger);

    const menu = container.querySelector('#targetTimeline-menu');
    expect(menu).toBeInTheDocument();
    expect(menu).toHaveClass('PermStaff-customSelectMenu');

    const arrow = timelineTrigger.querySelector('.PermStaff-selectArrow');
    expect(arrow).toHaveClass('is-open');

    // Select 'GCC Buildout (Quarterly Intake)'
    const gccOption = within(menu).getByText(
      'GCC Buildout (Quarterly Intake)'
    );
    fireEvent.click(gccOption);

    // Menu closes and trigger value updates
    expect(
      container.querySelector('#targetTimeline-menu')
    ).not.toBeInTheDocument();
    expect(arrow).not.toHaveClass('is-open');
    expect(timelineTrigger).toHaveTextContent(
      'GCC Buildout (Quarterly Intake)'
    );

    const hiddenSelect = container.querySelector('#targetTimeline');
    expect(hiddenSelect.value).toBe('GCC Buildout (Quarterly Intake)');
  });

  it('closes dropdown when clicking outside', () => {
    const { container } = renderWithProviders(
      <PermStaffConsultation data={mockData} />
    );

    const hierarchyTrigger = container.querySelector(
      '#mandateHierarchy-trigger'
    );
    fireEvent.click(hierarchyTrigger);
    expect(
      container.querySelector('#mandateHierarchy-menu')
    ).toBeInTheDocument();

    // Click outside
    fireEvent.mouseDown(document.body);
    expect(
      container.querySelector('#mandateHierarchy-menu')
    ).not.toBeInTheDocument();
  });

  it('supports keyboard navigation with Escape to close menu', () => {
    const { container } = renderWithProviders(
      <PermStaffConsultation data={mockData} />
    );

    const hierarchyTrigger = container.querySelector(
      '#mandateHierarchy-trigger'
    );

    // Open via ArrowDown
    fireEvent.keyDown(hierarchyTrigger, { key: 'ArrowDown' });
    expect(
      container.querySelector('#mandateHierarchy-menu')
    ).toBeInTheDocument();

    // Close via Escape
    fireEvent.keyDown(hierarchyTrigger, { key: 'Escape' });
    expect(
      container.querySelector('#mandateHierarchy-menu')
    ).not.toBeInTheDocument();
  });
});

