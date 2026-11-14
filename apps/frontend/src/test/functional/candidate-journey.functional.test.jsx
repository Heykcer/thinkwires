import React from 'react';
import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../test-utils';
import LoginPage from '../../pages/auth/LoginPage';
import CandidateApplicationsPage from '../../pages/candidate/CandidateApplicationsPage';

describe('Candidate End-to-End Functional Journey (Functional Tests)', () => {
  it(
    'executes complete candidate lifecycle: Login -> View Applications -> Withdraw Application',
    async () => {
      const user = userEvent.setup();

    // ── STEP 1: Candidate logs in ──────────────────────────────────────────
    const { store } = renderWithProviders(<LoginPage />);

    const emailInput = screen.getByPlaceholderText(/name@example\.com/i);
    const passwordInput = screen.getByPlaceholderText(/enter your password/i);
    const loginBtn = screen.getByRole('button', {
      name: /sign in to candidate dashboard/i,
    });

    await user.type(emailInput, 'jane@thinkwires.com');
    await user.type(passwordInput, 'Password123!');
    await user.click(loginBtn);

    await waitFor(() => {
      expect(store.getState().auth.isAuthenticated).toBe(true);
    });

    // ── STEP 2: Candidate accesses tracked applications portal ─────────────
    const { unmount } = renderWithProviders(<CandidateApplicationsPage />, {
      store,
    });

    // Live jobs populated via MSW
    await waitFor(() => {
      expect(
        screen.getByText('Senior Full Stack Engineer')
      ).toBeInTheDocument();
      expect(
        screen.getByText('AI / Machine Learning Architect')
      ).toBeInTheDocument();
    });

    // ── STEP 3: Candidate withdraws active application ─────────────────────
    const withdrawBtns = screen.getAllByRole('button', { name: /withdraw/i });
    expect(withdrawBtns.length).toBeGreaterThan(0);

    await user.click(withdrawBtns[0]);

    // ── STEP 4: Optimistic feedback notice displayed ───────────────────────
    await waitFor(() => {
      expect(
        screen.getByText(/application withdrawn successfully/i)
      ).toBeInTheDocument();
    });

    unmount();
  }, 20000);
});
