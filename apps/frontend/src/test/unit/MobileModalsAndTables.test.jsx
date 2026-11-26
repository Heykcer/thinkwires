import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '../test-utils';
import QuickApplyModal from '../../components/common/QuickApplyModal';
import ScreeningAssessmentModal from '../../components/common/ScreeningAssessmentModal';
import RequisitionsView from '../../admin/RequisitionsView';
import EmployeesView from '../../admin/EmployeesView';
import CandidatesView from '../../admin/CandidatesView';
import { adminApi, setAdminSession } from '../../admin/adminService';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useOutletContext: () => ({
      showToast: vi.fn(),
      activeRole: 'superadmin',
    }),
  };
});

describe('Mobile Modals and Admin Tables (Issue #118)', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
    setAdminSession('dummy-token', {
      id: 'admin-1',
      name: 'Super Admin',
      role: 'superadmin',
    });
  });

  describe('QuickApplyModal Mobile Structure', () => {
    it('renders with modal card and form elements supporting sub-480px overflow guards', () => {
      const mockJob = {
        id: 'job-101',
        title: 'Full Stack Engineer',
        department: 'Engineering',
        location: 'Remote',
        employmentType: 'Full-time',
      };

      const { container } = renderWithProviders(
        <QuickApplyModal
          isOpen={true}
          jobData={mockJob}
          onClose={vi.fn()}
        />
      );

      const overlay = container.querySelector('.QuickApplyModal-overlay');
      const card = container.querySelector('.QuickApplyModal-card');
      const header = container.querySelector('.QuickApplyModal-header');
      const form = container.querySelector('.QuickApplyModal-form');

      expect(overlay).toBeInTheDocument();
      expect(card).toBeInTheDocument();
      expect(header).toBeInTheDocument();
      expect(form).toBeInTheDocument();
      expect(screen.getByText(/Quick Apply: Full Stack Engineer/i)).toBeInTheDocument();
    });
  });

  describe('ScreeningAssessmentModal Mobile Structure', () => {
    it('renders with semantic class names supporting sub-480px styling', () => {
      const mockAssessment = {
        test_id: 'test_1',
        job_title: 'Cloud Architect',
        timeLimitMinutes: 15,
        questions: [
          {
            id: 'q1',
            question: 'What is high availability?',
            options: ['Redundancy across AZs', 'Single node', 'No backups'],
            type: 'mcq',
          },
        ],
      };

      const { container } = render(
        <ScreeningAssessmentModal
          isOpen={true}
          applicationId="app_99"
          initialAssessment={mockAssessment}
          onClose={vi.fn()}
        />
      );

      const overlay = container.querySelector('.ScreeningAssessmentModal-overlay');
      const card = container.querySelector('.ScreeningAssessmentModal-card');
      const header = container.querySelector('.ScreeningAssessmentModal-header');
      const body = container.querySelector('.ScreeningAssessmentModal-body');
      const footer = container.querySelector('.ScreeningAssessmentModal-footer');

      expect(overlay).toBeInTheDocument();
      expect(card).toBeInTheDocument();
      expect(header).toBeInTheDocument();
      expect(body).toBeInTheDocument();
      expect(footer).toBeInTheDocument();
      expect(screen.getByText('Cloud Architect')).toBeInTheDocument();
    });
  });

  describe('Admin Tables data-label attributes for Mobile Card Layout', () => {
    it('renders RequisitionsView table rows with data-label attributes on each cell', async () => {
      const mockRequisitions = [
        {
          id: 'req_1',
          title: 'Principal AI Architect',
          client: 'Acme Corp',
          requiredSkills: ['Python', 'PyTorch'],
          status: 'Open',
          budget: '$180k',
          workMode: 'Remote',
          deploymentUrgency: 'immediate',
        },
      ];

      vi.spyOn(adminApi, 'getRequisitions').mockResolvedValue({
        jobs: mockRequisitions,
      });

      const { container } = renderWithProviders(
        <RequisitionsView />
      );

      const rows = await screen.findAllByText('Principal AI Architect');
      expect(rows.length).toBeGreaterThan(0);

      const table = container.querySelector('.tw-table');
      expect(table).toBeInTheDocument();

      const cells = table.querySelectorAll('tbody tr td');
      const labels = Array.from(cells).map((td) => td.getAttribute('data-label'));

      expect(labels).toContain('Target Role');
      expect(labels).toContain('Client & Contact');
      expect(labels).toContain('Required Tech Stack');
      expect(labels).toContain('Urgency & SLA');
      expect(labels).toContain('Budget Envelope');
      expect(labels).toContain('Status');
      expect(labels).toContain('Actions');
    });

    it('renders EmployeesView table rows with data-label attributes on each cell', async () => {
      const mockEmployees = [
        {
          id: 'emp_1',
          name: 'Jane Doe',
          email: 'jane@thinkwires.com',
          designation: 'Senior Frontend Engineer',
          role: 'employee',
          technicalSkills: ['React', 'TypeScript'],
          availability: 'Immediate',
          deploymentStatus: 'Available',
          billingRate: 8500,
        },
      ];

      vi.spyOn(adminApi, 'getEmployees').mockResolvedValue({
        employees: mockEmployees,
      });

      const { container } = renderWithProviders(
        <EmployeesView />
      );

      const nameEl = await screen.findByText('Jane Doe');
      expect(nameEl).toBeInTheDocument();

      const table = container.querySelector('.tw-table');
      expect(table).toBeInTheDocument();

      const cells = table.querySelectorAll('tbody tr td');
      const labels = Array.from(cells).map((td) => td.getAttribute('data-label'));

      expect(labels).toContain('Employee & System Role');
      expect(labels).toContain('Designation & Exp');
      expect(labels).toContain('Portal Role');
      expect(labels).toContain('Technical Skills');
      expect(labels).toContain('Availability');
      expect(labels).toContain('Deployment');
      expect(labels).toContain('Billing Rate');
      expect(labels).toContain('Actions');
    });

    it('renders CandidatesView table rows with data-label attributes on each cell', async () => {
      const mockCandidates = [
        {
          id: 'cand_1',
          name: 'John Smith',
          email: 'john@example.com',
          jobTitle: 'Backend Engineer',
          technicalSkills: ['Node.js', 'PostgreSQL'],
          expectedSalary: '$140k',
          status: 'Screening',
        },
      ];

      vi.spyOn(adminApi, 'getCandidates').mockResolvedValue({
        candidates: mockCandidates,
      });
      vi.spyOn(adminApi, 'getApplicationPipeline').mockResolvedValue({
        applications: mockCandidates,
      });

      const { container } = renderWithProviders(
        <CandidatesView />
      );

      // Switch to list/table view mode
      const listViewBtn = screen.getByRole('button', { name: /List View/i });
      fireEvent.click(listViewBtn);

      const candName = await screen.findByText('John Smith');
      expect(candName).toBeInTheDocument();

      const table = container.querySelector('.tw-table');
      expect(table).toBeInTheDocument();

      const cells = table.querySelectorAll('tbody tr td');
      const labels = Array.from(cells).map((td) => td.getAttribute('data-label'));

      expect(labels).toContain('Candidate');
      expect(labels).toContain('Current Role & Exp');
      expect(labels).toContain('Applied For');
      expect(labels).toContain('Skills');
      expect(labels).toContain('Comp Expectation');
      expect(labels).toContain('Stage');
      expect(labels).toContain('Actions');
    });

    it('renders Candidates Data tab table rows with data-label attributes', async () => {
      const mockDirectory = [
        {
          id: 'cand_dir_1',
          name: 'Jane Doe',
          email: 'jane@example.com',
          currentRole: 'Staff Engineer',
          technicalSkills: ['React', 'TypeScript'],
          workMode: 'On-Bench',
          vettingScore: 88,
          activeApplicationCount: 1,
          applicationCount: 2,
        },
      ];

      vi.spyOn(adminApi, 'getApplicationPipeline').mockResolvedValue({
        applications: [],
      });
      vi.spyOn(adminApi, 'getCandidates').mockResolvedValue({
        candidates: mockDirectory,
      });

      const { container } = renderWithProviders(<CandidatesView />);

      const candidatesTab = screen.getByRole('tab', { name: /Candidates Data/i });
      fireEvent.click(candidatesTab);

      const candName = await screen.findByText('Jane Doe');
      expect(candName).toBeInTheDocument();

      const cells = container.querySelectorAll('.tw-table tbody tr td');
      const labels = Array.from(cells).map((td) => td.getAttribute('data-label'));

      expect(labels).toContain('Candidate');
      expect(labels).toContain('Current Role & Exp');
      expect(labels).toContain('Skills');
      expect(labels).toContain('Work Mode & Notice');
      expect(labels).toContain('Vetting Score');
      expect(labels).toContain('Applications');
      expect(labels).toContain('Actions');
    });
  });
});
