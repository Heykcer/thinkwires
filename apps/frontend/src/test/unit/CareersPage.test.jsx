import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent, within, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../test-utils';

import CareersHero from '../../components/JobsComponents/CareersHero';
import CareersOpportunities from '../../components/JobsComponents/CareersOpportunities';
import CareersBlogsSection from '../../components/JobsComponents/CareersBlogsSection';
import CareersBenefitsSection from '../../components/JobsComponents/CareersBenefitsSection';
import CareersClosingCTA from '../../components/JobsComponents/CareersClosingCTA';
import JobPage from '../../pages/JobPage';

import { OFFICIAL_CAREER_BLOGS, OFFICIAL_BENEFITS } from '../../data/careersData';

describe('ThinkWires Careers Page Redesign & Components', () => {
  describe('CareersHero', () => {
    it('renders hero headline, dynamic open roles count, and dual CTAs', () => {
      renderWithProviders(<CareersHero totalJobsCount={14} />);

      expect(screen.getByText(/Architect Your Future on a/i)).toBeInTheDocument();
      expect(screen.getByText(/Global Engineering/i)).toBeInTheDocument();
      expect(screen.getByText('14+')).toBeInTheDocument();
      expect(screen.getByText(/Live Verified Openings/i)).toBeInTheDocument();

      const exploreJobsBtn = screen.getByRole('link', { name: /Explore Open Roles/i });
      expect(exploreJobsBtn).toHaveAttribute('href', '#career-opportunities');

      const lifeBtn = screen.getByRole('link', { name: /Life at ThinkWires/i });
      expect(lifeBtn).toHaveAttribute('href', '#life-at-thinkwires');
    });
  });

  describe('CareersOpportunities', () => {
    const mockJobs = [
      {
        id: '1',
        title: 'Senior SAP FICO Consultant',
        department: 'SAP & Enterprise',
        location: 'Bangalore, India',
        experience: '5-8 Years',
        jobMode: 'Permanent',
        description: 'Leading SAP S/4HANA enterprise financial migration.',
        skills: ['SAP FICO', 'S/4HANA'],
      },
      {
        id: '2',
        title: 'Principal Cloud Architect',
        department: 'Cloud & DevOps',
        location: 'Noida, India',
        experience: '8-12 Years',
        jobMode: 'Hybrid',
        description: 'Design multi-region AWS and Azure cloud architectures.',
        skills: ['AWS', 'Kubernetes'],
      },
      {
        id: '3',
        title: 'Staff AI Engineer',
        department: 'AI & Data Engineering',
        location: 'Remote (US/IND)',
        experience: '5-8 Years',
        jobMode: 'Work From Home',
        description: 'Deploy LLM fine-tuning pipelines and inference graphs.',
        skills: ['Python', 'PyTorch'],
      },
    ];

    it('renders search input, filter dropdowns, and filters jobs dynamically', () => {
      const handleApply = vi.fn();
      const handleViewSpec = vi.fn();

      renderWithProviders(
        <CareersOpportunities
          jobsList={mockJobs}
          onApplyClick={handleApply}
          onViewSpecClick={handleViewSpec}
        />
      );

      // Section title
      expect(screen.getByRole('heading', { name: /Career Opportunities/i })).toBeInTheDocument();

      // Search input filtering
      const searchInput = screen.getByPlaceholderText(/Search by job title, skill/i);
      fireEvent.change(searchInput, { target: { value: 'SAP' } });
      expect(screen.getByText('Senior SAP FICO Consultant')).toBeInTheDocument();
      expect(screen.queryByText('Principal Cloud Architect')).toBeNull();

      // Clear search
      fireEvent.change(searchInput, { target: { value: '' } });
      expect(screen.getByText('Senior SAP FICO Consultant')).toBeInTheDocument();
      expect(screen.getByText('Principal Cloud Architect')).toBeInTheDocument();

      // Location filter dropdown
      const locationSelect = screen.getByLabelText(/Filter by location/i);
      fireEvent.change(locationSelect, { target: { value: 'Noida' } });
      expect(screen.queryByText('Senior SAP FICO Consultant')).toBeNull();
      expect(screen.getByText('Principal Cloud Architect')).toBeInTheDocument();
    });
  });

  describe('CareersBlogsSection', () => {
    it('renders all 6 official career articles and opens interactive article modal', () => {
      renderWithProviders(<CareersBlogsSection />);

      expect(screen.getByRole('heading', { name: /Career Blogs & Tips/i })).toBeInTheDocument();

      // Verify all 6 official articles are present
      OFFICIAL_CAREER_BLOGS.forEach((article) => {
        expect(screen.getByText(article.title)).toBeInTheDocument();
      });

      // Click on the first article
      const firstArticle = screen.getByRole('button', {
        name: new RegExp(`Read article: ${OFFICIAL_CAREER_BLOGS[0].title}`, 'i'),
      });
      fireEvent.click(firstArticle);

      // Modal opens
      const modal = screen.getByRole('dialog', {
        name: new RegExp(OFFICIAL_CAREER_BLOGS[0].title, 'i'),
      });
      expect(modal).toBeInTheDocument();
      expect(within(modal).getByText(new RegExp(`Published on ${OFFICIAL_CAREER_BLOGS[0].date}`, 'i'))).toBeInTheDocument();

      // Close modal
      const closeBtn = screen.getByLabelText(/Close article modal/i);
      fireEvent.click(closeBtn);
      expect(screen.queryByRole('dialog')).toBeNull();
    });
  });

  describe('CareersBenefitsSection', () => {
    it('renders all 8 official company benefits cards', () => {
      renderWithProviders(<CareersBenefitsSection />);

      expect(screen.getByRole('heading', { name: /Benefits & Career Growth/i })).toBeInTheDocument();

      // Verify all 8 official benefits
      OFFICIAL_BENEFITS.forEach((benefit) => {
        expect(screen.getByText(benefit.title)).toBeInTheDocument();
        expect(screen.getByText(benefit.description)).toBeInTheDocument();
      });
    });
  });

  describe('CareersClosingCTA', () => {
    it('renders high-conversion CTA with actions', () => {
      const handleDropResume = vi.fn();
      renderWithProviders(<CareersClosingCTA onDropResumeClick={handleDropResume} />);

      expect(screen.getByText(/Your Next Chapter Starts Here/i)).toBeInTheDocument();

      const browseJobsBtn = screen.getByRole('link', { name: /Explore Open Positions/i });
      expect(browseJobsBtn).toHaveAttribute('href', '#career-opportunities');

      const talentBenchBtn = screen.getByRole('button', { name: /Drop Your CV \/ Join Bench/i });
      fireEvent.click(talentBenchBtn);
      expect(handleDropResume).toHaveBeenCalledTimes(1);
    });
  });

  describe('JobPage Root Integration', () => {
    it('renders full redesigned Careers experience with Navbar and Hero', async () => {
      renderWithProviders(<JobPage />);

      expect(screen.getByText(/Architect Your Future on a/i)).toBeInTheDocument();
      await waitFor(() => {
        expect(screen.getByText(/THINKWIRES GLOBAL TALENT CLOUD • CAREERS/i)).toBeInTheDocument();
      });
    });
  });
});
