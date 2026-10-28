import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import CandidateEvaluationModal from '../../admin/CandidateEvaluationModal';
import { adminApi } from '../../admin/adminService';

vi.mock('../../admin/adminService', () => ({
  adminApi: {
    getCandidateDossier: vi.fn(),
    reEvaluateCandidate: vi.fn(),
  },
}));

describe('CandidateEvaluationModal Component Resilient Array Rendering', () => {
  it('renders safely when gapsAndRisks is an object with technicalGaps and operationalRisks', async () => {
    adminApi.getCandidateDossier.mockResolvedValueOnce({
      success: true,
      candidate: {
        id: 'cand_123',
        name: 'Tanjil Alam',
        email: 'tanjil@example.com',
        phone: '+1234567890',
        jobTitle: 'Lead Software Engineer',
      },
      dossier: {
        overallMatchScore: 87,
        recommendation: 'HIGH-PRIORITY SHORTLIST',
        strengths: ['Hands-on architecture in production', 'Deep full-stack mastery'],
        gapsAndRisks: {
          technicalGaps: ['Deepen live distributed caching defense'],
          operationalRisks: ['Serving 30-day notice period constraint'],
          careerFlags: [],
        },
        clientSubmissionSummary: [
          'Candidate demonstrates strong technical alignment.',
          'Cleared multi-factor rubric benchmark.',
        ],
        requirementAlignmentMatrix: [
          {
            skill: 'React',
            jdRequirement: 'Mandatory proficiency in React',
            candidateEvidence: 'Production experience with modern hooks',
            status: 'Strong Match',
          },
        ],
      },
    });

    render(
      <CandidateEvaluationModal
        isOpen={true}
        onClose={vi.fn()}
        candidateId="cand_123"
        showToast={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Deepen live distributed caching defense/i)).toBeInTheDocument();
      expect(screen.getByText(/Serving 30-day notice period constraint/i)).toBeInTheDocument();
      expect(screen.getByText(/Tanjil Alam/i)).toBeInTheDocument();
    });
  });

  it('renders matrix safely when items lack skill and status properties (legacy/fit-only format)', async () => {
    adminApi.getCandidateDossier.mockResolvedValueOnce({
      success: true,
      candidate: {
        id: 'cand_456',
        name: 'Tanjil Alam',
        jobTitle: 'Lead Software Engineer',
      },
      dossier: {
        overallMatchScore: 87,
        requirementAlignmentMatrix: [
          {
            jdRequirement: 'JavaScript',
            candidateEvidence: 'Demonstrated hands-on experience with JAVASCRIPT',
            fit: 'Strong',
          },
          {
            jdRequirement: 'Python',
            candidateEvidence: 'Demonstrated hands-on experience with PYTHON',
            fit: 'Partial',
          },
        ],
      },
    });

    render(
      <CandidateEvaluationModal
        isOpen={true}
        onClose={vi.fn()}
        candidateId="cand_456"
        showToast={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getAllByText('JavaScript').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Python').length).toBeGreaterThan(0);
      expect(screen.getByText('Strong Match')).toBeInTheDocument();
      expect(screen.getByText('Partial Match')).toBeInTheDocument();
      expect(screen.queryByText(/undefined/i)).not.toBeInTheDocument();
    });
  });
});
