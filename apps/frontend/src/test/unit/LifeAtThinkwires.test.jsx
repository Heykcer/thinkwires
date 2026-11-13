import React from 'react';
import { describe, it, expect } from 'vitest';
import { screen, fireEvent, within } from '@testing-library/react';
import { renderWithProviders } from '../test-utils';
import LifeAtThinkwires from '../../components/JobsComponents/LifeAtThinkwires';

describe('LifeAtThinkwires Component (Unit Tests)', () => {
  it('renders Culture Hero introduction with heading, subtitle, description, and CTAs', () => {
    const { container } = renderWithProviders(<LifeAtThinkwires />);

    // Section anchor & container
    const section = container.querySelector('#life-at-thinkwires');
    expect(section).toBeInTheDocument();
    expect(section).toHaveClass('TW-Life-section');

    // Main heading
    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toHaveTextContent(/Life at\s+Thinkwires/i);

    // Subtitle & description
    expect(
      screen.getByText(/More Than Work\. A Culture of Innovation, Collaboration and Growth\./i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Life at Thinkwires reflects the people, teams and experiences behind our work\./i
      )
    ).toBeInTheDocument();

    // CTA buttons
    const exploreBtn = screen.getByRole('link', { name: /Explore Our Culture/i });
    expect(exploreBtn).toBeInTheDocument();
    expect(exploreBtn).toHaveAttribute('href', '#culture-highlights');

    const viewRolesBtn = screen.getByRole('link', { name: /View Open Positions/i });
    expect(viewRolesBtn).toBeInTheDocument();
  });

  it('renders all four distinct culture pillars with titles, subtitles, and badges', () => {
    renderWithProviders(<LifeAtThinkwires />);

    // 1. Collaboration
    expect(screen.getByText('Collaboration')).toBeInTheDocument();
    expect(screen.getByText('Connected Pods')).toBeInTheDocument();

    // 2. Technology & Innovation
    expect(screen.getByText('Technology & Innovation')).toBeInTheDocument();
    expect(screen.getByText('Modern Tech Stack')).toBeInTheDocument();

    // 3. Global Perspectives
    expect(screen.getByText('Global Perspectives')).toBeInTheDocument();
    expect(screen.getByText('Cross-Border Impact')).toBeInTheDocument();

    // 4. Growth & Learning
    expect(screen.getByText('Growth & Learning')).toBeInTheDocument();
    expect(screen.getByText('Skill Mastery')).toBeInTheDocument();
  });

  it('renders Workplace Experience section with editorial cards', () => {
    renderWithProviders(<LifeAtThinkwires />);

    expect(
      screen.getByText(/Where Engineering Meets People-First Culture/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Cross-Functional Problem Solving/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Modern Engineering & Transparency/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Purposeful Social Commitment/i)
    ).toBeInTheDocument();
  });

  it('renders Visual Culture Gallery and opens photo in Lightbox on click', () => {
    const { container } = renderWithProviders(<LifeAtThinkwires />);

    const galleryHeader = screen.getByText('Visual Culture Gallery');
    expect(galleryHeader).toBeInTheDocument();

    // Verify all 5 gallery items are present
    const galleryItems = container.querySelectorAll('.TW-Life-galleryItem');
    expect(galleryItems.length).toBe(5);

    // Click on the first photo to open lightbox
    fireEvent.click(galleryItems[0]);

    // Lightbox modal should appear
    const lightbox = screen.getByRole('dialog');
    expect(lightbox).toBeInTheDocument();
    expect(within(lightbox).getByText('Cross-Functional Architecture Review')).toBeInTheDocument();
    expect(within(lightbox).getByText('Engineering & Collaboration')).toBeInTheDocument();

    // Close lightbox via close button
    const closeBtn = screen.getByLabelText(/Close lightbox/i);
    expect(closeBtn).toBeInTheDocument();
    fireEvent.click(closeBtn);

    // Lightbox should disappear
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('closes Lightbox on Escape key press', () => {
    const { container } = renderWithProviders(<LifeAtThinkwires />);

    const galleryItems = container.querySelectorAll('.TW-Life-galleryItem');
    fireEvent.click(galleryItems[1]);

    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Press Escape
    fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });

    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('renders Closing CTA with career opportunity navigation', () => {
    renderWithProviders(<LifeAtThinkwires />);

    expect(screen.getByText('Be Part of Our Journey')).toBeInTheDocument();
    expect(
      screen.getByText(
        /Discover opportunities to grow, collaborate and contribute to the future of technology with Thinkwires\./i
      )
    ).toBeInTheDocument();

    const applyCta = screen.getByRole('link', {
      name: /Explore Career Opportunities/i,
    });
    expect(applyCta).toBeInTheDocument();
    expect(applyCta).toHaveAttribute('href', '/jobs');

    const articlesCta = screen.getByRole('link', {
      name: /Read Technology Articles/i,
    });
    expect(articlesCta).toBeInTheDocument();
    expect(articlesCta).toHaveAttribute('href', '/blog');
  });
});

