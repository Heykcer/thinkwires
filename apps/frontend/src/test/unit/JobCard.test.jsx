import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '../test-utils';
import JobCard from '../../components/JobsComponents/JobCard';

const mockJobHot = {
  id: 14,
  category: 'CLOUD & CYBERSECURITY • CONTRACT',
  industry: 'Information Technology & Cloud',
  badge: 'Urgent Requirement',
  badgeColor: 'blue',
  logo: 'AWS',
  title: 'Principal Cloud Security & DevSecOps Engineer',
  company: 'FinTech Defense Core',
  location: 'Remote (US/IND)',
  experience: '10+ Years',
  salary: '₹35 - 50 LPA',
  joining: '< 15 Days',
  jobMode: 'Contract',
  workMode: 'Work From Office',
  noticePeriod: 'On Notice Period',
  description: 'Design zero-trust cloud infrastructure, Kubernetes security mesh, automated CI/CD security gating, and compliance frameworks.',
  skills: ['AWS Security', 'Kubernetes', 'Terraform', 'Zero Trust', 'DevSecOps'],
  department: 'Cloud & DevOps',
  postedDate: '2026-10-13T00:00:00.000Z',
  priority: 2,
};

const mockJobImmediate = {
  id: 15,
  category: 'DISTRIBUTED SYSTEMS • HYBRID',
  industry: 'Financial Services & FinTech',
  badge: 'Immediate Joining',
  badgeColor: 'purple',
  logo: 'ACH',
  title: 'Senior Full Stack Engineer – Distributed Go & Kafka',
  company: 'Enterprise Client (Confidential)',
  location: 'Hyderabad',
  experience: '5 - 8 Years',
  salary: '₹28 - 40 LPA',
  jobMode: 'Contract to Hire',
  workMode: 'Hybrid',
  noticePeriod: '< 30 Days',
  description: 'Build high-concurrency event-driven microservices handling 50k+ transactions per second.',
  skills: ['Golang', 'Apache Kafka', 'gRPC', 'PostgreSQL', 'Docker'],
  postedDate: '2026-10-13T00:00:00.000Z',
};

describe('JobCard Component - Alignment & Layout Verification', () => {
  it('renders industry badge directly taken from admin dashboard job.industry', () => {
    const { container } = renderWithProviders(
      <JobCard job={{ ...mockJobHot, industry: 'Healthcare & MedTech' }} />
    );

    const industryPill = container.querySelector('.JobCard-industryPill');
    expect(industryPill).toBeInTheDocument();
    expect(industryPill).toHaveTextContent('Healthcare & MedTech');
    expect(industryPill).toHaveAttribute('href', '/industries/healthcare-life-sciences');
  });

  it('renders 2-row header eliminating badge collisions and truncation', () => {
    const { container } = renderWithProviders(<JobCard job={mockJobHot} />);

    // Row 1: Category on left, Status badge on right
    const headerTop = container.querySelector('.JobCard-headerTop');
    expect(headerTop).toBeInTheDocument();
    expect(headerTop).toHaveTextContent('Tech & Cloud');
    expect(screen.getByText('Urgent Requirement')).toBeInTheDocument();

    // Row 2: Sub-category on left, Mode badge on right
    const headerSub = container.querySelector('.JobCard-headerSub');
    expect(headerSub).toBeInTheDocument();
    expect(headerSub).toHaveTextContent('CLOUD & CYBERSECURITY');
    expect(screen.getByText('Contract')).toBeInTheDocument();
  });

  it('handles Contract to Hire and Immediate Joining without clipping', () => {
    const { container } = renderWithProviders(<JobCard job={mockJobImmediate} />);

    // Status badge: Immediate Joining
    const statusBadge = container.querySelector('.JobCard-badge--status');
    expect(statusBadge).toHaveTextContent('Immediate Joining');

    // Mode badge: Contract to Hire
    const modeBadge = container.querySelector('.JobCard-badge--mode');
    expect(modeBadge).toHaveTextContent('Contract to Hire');

    // Pulse dot is present in status badge
    expect(container.querySelector('.Openings-pulseDot')).toBeInTheDocument();
  });

  it('renders company logo initials, company name, and job title', () => {
    renderWithProviders(<JobCard job={mockJobHot} />);

    expect(screen.getByText('AWS')).toBeInTheDocument();
    expect(screen.getByText('FinTech Defense Core')).toBeInTheDocument();
    expect(screen.getByText('Principal Cloud Security & DevSecOps Engineer')).toBeInTheDocument();
  });

  it('renders job details in 2-column grid with labels above values', () => {
    const { container } = renderWithProviders(<JobCard job={mockJobHot} />);

    expect(screen.getByText('Location & Mode')).toBeInTheDocument();
    expect(screen.getByText('Remote (US/IND) (Work From Office)')).toBeInTheDocument();

    expect(screen.getByText('Experience & Type')).toBeInTheDocument();
    expect(screen.getByText('10+ Years • Contract')).toBeInTheDocument();

    expect(screen.getByText('Budget Range')).toBeInTheDocument();
    expect(screen.getByText('₹35 - 50 LPA')).toBeInTheDocument();

    expect(screen.getByText('Notice Period')).toBeInTheDocument();
    expect(screen.getByText('Notice: On Notice Period')).toBeInTheDocument();

    // Verify 2-row details structure
    const detailsRows = container.querySelectorAll('.JobCard-detailsRow');
    expect(detailsRows.length).toBe(2);
  });

  it('renders skill tags properly formatted as pills', () => {
    renderWithProviders(<JobCard job={mockJobHot} />);

    expect(screen.getByText('AWS Security')).toBeInTheDocument();
    expect(screen.getByText('Kubernetes')).toBeInTheDocument();
    expect(screen.getByText('Terraform')).toBeInTheDocument();
    expect(screen.getByText('Zero Trust')).toBeInTheDocument();
    expect(screen.getByText('DevSecOps')).toBeInTheDocument();
  });

  it('renders secondary actions: Download JD and WhatsApp', () => {
    renderWithProviders(<JobCard job={mockJobHot} />);

    expect(screen.getByRole('button', { name: /Download Job Description/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Share.*on WhatsApp/i })).toBeInTheDocument();
  });

  it('renders aligned footer with full posted date, View Job Spec, and Apply button', () => {
    const handleApply = vi.fn();
    const handleViewSpec = vi.fn();

    renderWithProviders(
      <JobCard
        job={mockJobHot}
        onApplyClick={handleApply}
        onViewSpecClick={handleViewSpec}
      />
    );

    // Full posted date is visible (never truncated to "Post...")
    expect(screen.getByText(/Posted: Oct 13, 2026/i)).toBeInTheDocument();

    // Action buttons
    const viewSpecBtn = screen.getByRole('button', { name: /View Job Spec/i });
    expect(viewSpecBtn).toBeInTheDocument();
    fireEvent.click(viewSpecBtn);
    expect(handleViewSpec).toHaveBeenCalledWith(mockJobHot);

    const applyBtn = screen.getByRole('button', { name: /Apply Now/i });
    expect(applyBtn).toBeInTheDocument();
    fireEvent.click(applyBtn);
    expect(handleApply).toHaveBeenCalledWith(mockJobHot);
  });

  it('renders Quick Apply and TW logo on Home page variant when logo is not specified', () => {
    const handleApply = vi.fn();
    const mockHomeJob = { ...mockJobHot, logo: undefined };

    renderWithProviders(
      <JobCard
        job={mockHomeJob}
        isHome={true}
        onApplyClick={handleApply}
      />
    );

    expect(screen.getByRole('button', { name: /Quick Apply/i })).toBeInTheDocument();
    expect(screen.getByText('TW')).toBeInTheDocument();
  });
});
