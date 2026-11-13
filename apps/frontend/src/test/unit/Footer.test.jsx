/** @vitest-environment jsdom */
import React from 'react';
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Footer from '../../components/common/Footer';
import { renderWithProviders } from '../test-utils';

describe('Footer Component', () => {
  it('renders the new brand tagline heading and updated company introduction', () => {
    renderWithProviders(<Footer />);

    // Brand tagline heading
    const tagline = screen.getByRole('heading', {
      name: /Technology Matters\. People Matter More\./i,
    });
    expect(tagline).toBeInTheDocument();
    expect(tagline).toHaveClass('Footer-brandTagline');

    // Updated company introduction text
    const intro = screen.getByText(
      /Thinkwires Technology is a talent supply chain and business solutions company headquartered in Noida, India/i
    );
    expect(intro).toBeInTheDocument();
    expect(intro).toHaveClass('Footer-brandDesc');
    expect(intro).toHaveTextContent(/Artificial Intelligence \(AI\)/i);
    expect(intro).toHaveTextContent(/Digital Transformation/i);

    // Old description should no longer be present
    expect(
      screen.queryByText(/Architecting elite workforce solutions/i)
    ).not.toBeInTheDocument();
  });

  it('renders the Thinkwires logo linking to home', () => {
    renderWithProviders(<Footer />);

    const logoLink = screen.getByRole('link', { name: /Thinkwires Home/i });
    expect(logoLink).toBeInTheDocument();
    expect(logoLink).toHaveAttribute('href', '/');

    const logoImg = screen.getByAltText('Thinkwires');
    expect(logoImg).toBeInTheDocument();
    expect(logoImg).toHaveClass('Footer-logoImg');
  });

  it('renders footer columns: Core Services, Industries, Corporate Office, and Social Links', () => {
    renderWithProviders(<Footer />);

    expect(screen.getByRole('heading', { name: /CORE SERVICES/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /INDUSTRIES/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /CORPORATE OFFICE/i })).toBeInTheDocument();

    expect(screen.getByText(/Plot No 20, Block H-1\/A/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /LinkedIn/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Contact via Email/i })).toBeInTheDocument();
  });
});
