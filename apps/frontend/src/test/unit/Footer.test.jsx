/** @vitest-environment jsdom */
import React from 'react';
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Footer from '../../components/common/Footer';
import { renderWithProviders } from '../test-utils';

describe('Footer Component', () => {
  it('renders the updated tagline and brand description', () => {
    const { container } = renderWithProviders(<Footer />);

    // Tagline check
    const tagline = container.querySelector('.Footer-tagline');
    expect(tagline).toBeInTheDocument();
    expect(tagline).toHaveTextContent(/Technology Matters\.\s*People Matter More\./i);

    // Brand description check
    const brandDesc = container.querySelector('.Footer-brandDesc');
    expect(brandDesc).toBeInTheDocument();
    expect(brandDesc).toHaveTextContent(
      /Thinkwires Technology is a talent supply chain and business solutions company headquartered in Noida, India/i
    );
    expect(brandDesc).toHaveTextContent(
      /Artificial Intelligence \(AI\), Cloud Computing, Cybersecurity, Semiconductor, Engineering, and Digital Transformation\./i
    );
  });

  it('renders the brand logo and social links', () => {
    const { container } = renderWithProviders(<Footer />);

    const logo = container.querySelector('.Footer-logo');
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute('href', '/');

    const logoImg = container.querySelector('.Footer-logoImg');
    expect(logoImg).toBeInTheDocument();
    expect(logoImg).toHaveAttribute('alt', 'Thinkwires');

    expect(screen.getByLabelText(/LinkedIn/i)).toHaveAttribute(
      'href',
      'https://linkedin.com/company/thinkwires'
    );
  });

  it('renders all core services and industries links', () => {
    renderWithProviders(<Footer />);

    // Core services
    expect(screen.getByText('CORE SERVICES')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Staff Augmentation/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Employer of Record \(EOR\)/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Executive Search/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Permanent Staffing/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Payroll Outsourcing/i })).toBeInTheDocument();

    // Industries
    expect(screen.getByText('INDUSTRIES')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Information Technology/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /BFSI & Fintech/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Healthcare & Life Sciences/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Engineering & Telecom/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /E-Commerce & Retail/i })).toBeInTheDocument();
  });

  it('renders the corporate office information and newsletter', () => {
    renderWithProviders(<Footer />);

    expect(screen.getByText('CORPORATE OFFICE')).toBeInTheDocument();
    expect(screen.getByText('Thinkwires Global Corp')).toBeInTheDocument();
    expect(screen.getByText(/Plot No 20, Block H-1\/A, Sector 63/i)).toBeInTheDocument();
    expect(screen.getByText(/Noida, Uttar Pradesh 201301, India/i)).toBeInTheDocument();

    expect(screen.getByText('Talent Advisory Newsletter')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Your work email')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Join/i })).toBeInTheDocument();
  });
});
