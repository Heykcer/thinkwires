import React from 'react';
import { describe, it, expect } from 'vitest';
import { screen, fireEvent, within } from '@testing-library/react';
import { renderWithProviders } from '../test-utils';
import LifeAtThinkwires from '../../components/JobsComponents/LifeAtThinkwires';

describe('LifeAtThinkwires Component (Comprehensive Culture & Experience Tests)', () => {
  it('renders Hero Section with real team mosaic, headline, description, CTAs, and trust metrics', () => {
    const { container } = renderWithProviders(<LifeAtThinkwires />);

    // Section anchor & container
    const section = container.querySelector('#life-at-thinkwires');
    expect(section).toBeInTheDocument();

    // Main heading
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent(/Great People\.\s*Shared Vision\.\s*Bigger Possibilities\./i);

    // Description
    expect(
      screen.getByText(/Discover the people, collaboration, and experiences that make Thinkwires more than just a workplace\./i)
    ).toBeInTheDocument();

    // CTA buttons
    const meetTeamBtn = screen.getByRole('link', { name: /Meet Our Team/i });
    expect(meetTeamBtn).toBeInTheDocument();
    expect(meetTeamBtn).toHaveAttribute('href', '#team-showcase');

    const exploreCultureBtn = screen.getByRole('link', { name: /Explore Our Culture/i });
    expect(exploreCultureBtn).toBeInTheDocument();
    expect(exploreCultureBtn).toHaveAttribute('href', '#culture-experience');

    // Trust strip
    expect(screen.getByText('500+')).toBeInTheDocument();
    expect(screen.getByText(/Global Corridors/i)).toBeInTheDocument();
    expect(screen.getAllByText('98%').length).toBeGreaterThan(0);
  });

  it('renders Meet Our Team section with authentic employee profiles and interactive department filters', () => {
    renderWithProviders(<LifeAtThinkwires />);

    expect(screen.getByRole('heading', { name: /Meet Our Team/i })).toBeInTheDocument();

    // Filter tabs
    const allTab = screen.getByRole('tab', { name: /All Team/i });
    const leadershipTab = screen.getByRole('tab', { name: /Leadership/i });
    const engineeringTab = screen.getByRole('tab', { name: /Engineering/i });

    expect(allTab).toBeInTheDocument();
    expect(leadershipTab).toBeInTheDocument();
    expect(engineeringTab).toBeInTheDocument();

    // Check authentic employee cards are rendered
    expect(screen.getByText('Ananya Mehta')).toBeInTheDocument();
    expect(screen.getByText('Chief Executive Officer (CEO)')).toBeInTheDocument();

    expect(screen.getByText('Anju Balyan')).toBeInTheDocument();
    expect(screen.getByText('Co-Founder & Associate Executive Director')).toBeInTheDocument();

    expect(screen.getByText('Arjun Verma')).toBeInTheDocument();
    expect(screen.getByText('Meera Iyer')).toBeInTheDocument();
    expect(screen.getByText('Naziya Husain')).toBeInTheDocument();

    // Filter interaction: click Engineering
    fireEvent.click(engineeringTab);
    expect(screen.getByText('Vikramaditya Rao')).toBeInTheDocument();
    expect(screen.getByText('Devendra Singh')).toBeInTheDocument();
    expect(screen.queryByText('Chief Executive Officer (CEO)')).toBeNull();

    // Click back to All Team
    fireEvent.click(allTab);
    expect(screen.getByText('Ananya Mehta')).toBeInTheDocument();
  });

  it('opens interactive Team Profile Modal on card click and closes with Escape key', () => {
    renderWithProviders(<LifeAtThinkwires />);

    // Click on Ananya Mehta's card
    const ananyaCard = screen.getByRole('button', {
      name: /View profile for Ananya Mehta, Chief Executive Officer \(CEO\)/i,
    });
    fireEvent.click(ananyaCard);

    // Modal opens
    const dialog = screen.getByRole('dialog', { name: /Ananya Mehta/i });
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByText(/Dedicated to building teams that drive real business velocity\./i)).toBeInTheDocument();
    expect(within(dialog).getByText('Executive Search')).toBeInTheDocument();

    // Close via close button
    const closeBtn = screen.getByLabelText(/Close profile modal/i);
    expect(closeBtn).toBeInTheDocument();
    fireEvent.click(closeBtn);
    expect(screen.queryByRole('dialog')).toBeNull();

    // Reopen and close via Escape key
    fireEvent.click(ananyaCard);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('renders Our Culture in Action and Employee Experience sections', () => {
    renderWithProviders(<LifeAtThinkwires />);

    // Culture Themes
    expect(screen.getByRole('heading', { name: /Our Culture in Action/i })).toBeInTheDocument();
    expect(screen.getByText('Collaboration')).toBeInTheDocument();
    expect(screen.getByText('Technology & Innovation')).toBeInTheDocument();
    expect(screen.getByText('Continuous Learning')).toBeInTheDocument();
    expect(screen.getByText('Global Perspectives')).toBeInTheDocument();
    expect(screen.getByText('Community & CSR')).toBeInTheDocument();

    // Workplace Environment / Experience
    expect(
      screen.getByRole('heading', { name: /Designed for Growth, Autonomy & Purpose/i })
    ).toBeInTheDocument();
    expect(screen.getByText('Collaborative Working Environment')).toBeInTheDocument();
    expect(screen.getByText('Technical Exposure & Modern Tooling')).toBeInTheDocument();
    expect(screen.getByText('Continuous Learning & Career Mobility')).toBeInTheDocument();
  });

  it('renders Employee Benefits & Well-Being section with all 6 authentic benefit cards', () => {
    renderWithProviders(<LifeAtThinkwires />);

    expect(screen.getByRole('heading', { name: /Employee Benefits & Well-Being/i })).toBeInTheDocument();
    expect(screen.getByText('Comprehensive Health & Wellness')).toBeInTheDocument();
    expect(screen.getByText('Global Client Footprint')).toBeInTheDocument();
    expect(screen.getByText('Continuous Tech Upskilling')).toBeInTheDocument();
    expect(screen.getByText('Work-Life Agility')).toBeInTheDocument();
    expect(screen.getByText('Transparent Career Pathing')).toBeInTheDocument();
    expect(screen.getByText('Impact & Social Purpose')).toBeInTheDocument();
  });

  it('renders Career Blogs & Tips section with accurate articles from the old website', () => {
    renderWithProviders(<LifeAtThinkwires />);

    expect(screen.getByRole('heading', { name: /Career Blogs & Insights/i })).toBeInTheDocument();

    // 1. Wellness article
    expect(
      screen.getByText(/Supporting Employee Wellness and Work-Life Balance in Distributed Teams/i)
    ).toBeInTheDocument();

    // 2. Campus drive article
    expect(
      screen.getByText(/From Classroom to Career: Empowering 250\+ Next-Gen Tech Graduates/i)
    ).toBeInTheDocument();

    // 3. CSR article
    expect(
      screen.getByText(/CSR & Environmental Sustainability: Our Roadmap to 1,000 Planted Trees/i)
    ).toBeInTheDocument();

    // 4. Interview advice article
    expect(
      screen.getByText(/Mastering Technical Architecture Reviews: Career Tips for Cloud & DevOps Engineers/i)
    ).toBeInTheDocument();

    // Link to all articles
    const viewAllBtn = screen.getByRole('link', { name: /View All Articles/i });
    expect(viewAllBtn).toBeInTheDocument();
    expect(viewAllBtn).toHaveAttribute('href', '/blog');
  });

  it('renders Photo Gallery with Lightbox modal and navigation controls', () => {
    const { container } = renderWithProviders(<LifeAtThinkwires />);

    expect(screen.getByRole('heading', { name: /Life at Thinkwires Gallery/i })).toBeInTheDocument();

    const galleryCards = container.querySelectorAll('.TW-GalleryCard-root');
    expect(galleryCards.length).toBeGreaterThanOrEqual(5);

    // Open first photo
    fireEvent.click(galleryCards[0]);

    const lightbox = screen.getByRole('dialog', { name: /Engineering Team Hub & Daily Standup/i });
    expect(lightbox).toBeInTheDocument();
    expect(within(lightbox).getByText(/Photo 1 of/i)).toBeInTheDocument();

    // Navigate next
    const nextBtn = screen.getByLabelText(/Next photo/i);
    fireEvent.click(nextBtn);
    expect(within(lightbox).getByText(/Photo 2 of/i)).toBeInTheDocument();

    // Arrow keys
    fireEvent.keyDown(window, { key: 'ArrowLeft', code: 'ArrowLeft' });
    expect(within(lightbox).getByText(/Photo 1 of/i)).toBeInTheDocument();

    // Close lightbox
    fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('renders Closing CTA with functional Explore Careers & Contact navigation', () => {
    renderWithProviders(<LifeAtThinkwires />);

    expect(
      screen.getByRole('heading', { name: /Your Next Chapter Starts Here\./i })
    ).toBeInTheDocument();

    const jobsBtn = screen.getByRole('link', { name: /Explore Open Positions/i });
    expect(jobsBtn).toBeInTheDocument();
    expect(jobsBtn).toHaveAttribute('href', '/jobs');

    const contactBtn = screen.getByRole('link', { name: /Contact Our Team/i });
    expect(contactBtn).toBeInTheDocument();
    expect(contactBtn).toHaveAttribute('href', '/contact');
  });
});
