import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import logo from '../../assets/logo/logo.png';
import QuickApplyModal from './QuickApplyModal';
import { useTheme } from '../../useTheme';
import { GlobeIcon, MailIcon } from '../../admin/AdminIcons';

const Navbar = () => {
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isServicesOpen, setIsServicesOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
    setIsServicesOpen(false);
  };

  const handlePortalClick = (e) => {
    e.preventDefault();
    closeMobileMenu();
    if (isAuthenticated) {
      navigate('/candidate/dashboard');
    } else {
      navigate('/login?redirect=/candidate/dashboard');
    }
  };

  const handleQuickApply = () => {
    closeMobileMenu();
    setIsApplyModalOpen(true);
  };

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/' ? 'Navbar-active' : '';
    return location.pathname === path || location.pathname.startsWith(`${path}/`)
      ? 'Navbar-active'
      : '';
  };

  return (
    <>
      <header className="Navbar-navbarContainer">
        {/* Top Bar */}
        <div className="Navbar-topBar">
          <div className="Navbar-topBarLeft">
            <div className="Navbar-topBarItem">
              <GlobeIcon size={13} color="currentColor" />
              <span>India &amp; USA / Canada</span>
            </div>

            <div className="Navbar-topBarItem">
              Talent is not bound by Borders
            </div>
          </div>

          <div className="Navbar-topBarRight">
            <a href="mailto:info@thinkwires.com" className="Navbar-topBarItem">
              <MailIcon size={13} color="currentColor" />
              <span>info@thinkwires.com</span>
            </a>

            <button
              type="button"
              onClick={toggleTheme}
              className="Navbar-topBarItem Navbar-themeToggle"
              aria-label="Toggle Theme"
              data-testid="desktop-theme-toggle"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 2a10 10 0 0 0 0 20V2z" fill="currentColor" />
              </svg>
            </button>
          </div>
        </div>

        {/* Main Navigation */}
        <nav className="Navbar-mainNav" aria-label="Main navigation">
          <div className="Navbar-logoContainer">
            <Link to="/" onClick={closeMobileMenu} aria-label="Thinkwires Home">
              <img src={logo} alt="Thinkwires Logo" className="Navbar-logo" />
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            className="Navbar-mobileMenuToggle"
            aria-label={
              isMobileMenuOpen
                ? 'Close navigation menu'
                : 'Open navigation menu'
            }
            aria-expanded={isMobileMenuOpen}
            aria-controls="Navbar-navigationContent"
            onClick={() => setIsMobileMenuOpen((open) => !open)}
          >
            {isMobileMenuOpen ? (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            ) : (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M4 6h16" />
                <path d="M4 12h16" />
                <path d="M4 18h16" />
              </svg>
            )}
          </button>

          {/* Navigation Links and Actions */}
          <div
            id="Navbar-navigationContent"
            className={`Navbar-navigationContent ${
              isMobileMenuOpen ? 'Navbar-mobileMenuOpen' : ''
            }`}
          >
            <ul className="Navbar-navLinks">
              <li>
                <Link
                  to="/"
                  className={`Navbar-navLink ${isActive('/')}`}
                  onClick={closeMobileMenu}
                >
                  Home
                </Link>
              </li>

              <li>
                <Link
                  to="/about"
                  className={`Navbar-navLink ${isActive('/about')}`}
                  onClick={closeMobileMenu}
                >
                  About Us
                </Link>
              </li>

              <li
                className={`Navbar-dropdownContainer ${
                  isServicesOpen ? 'Navbar-servicesOpen' : ''
                }`}
              >
                <div className="Navbar-servicesHeader">
                  <Link
                    to="/services"
                    className={`Navbar-navLink ${isActive('/services')}`}
                    onClick={closeMobileMenu}
                  >
                    Services
                  </Link>

                  <button
                    type="button"
                    className="Navbar-servicesToggle"
                    aria-label="Toggle services submenu"
                    aria-expanded={isServicesOpen}
                    onClick={() => setIsServicesOpen((open) => !open)}
                  >
                    <svg
                      width="12"
                      height="8"
                      viewBox="0 0 12 8"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="m1 1 5 5 5-5" />
                    </svg>
                  </button>
                </div>

                <div className="Navbar-dropdownMenu">
                  <Link
                    to="/services/staff-augmentation"
                    className={`Navbar-dropdownItem ${isActive('/services/staff-augmentation')}`}
                    onClick={closeMobileMenu}
                  >
                    Staff Augmentation
                  </Link>

                  <Link
                    to="/services/eor"
                    className={`Navbar-dropdownItem ${isActive('/services/eor')}`}
                    onClick={closeMobileMenu}
                  >
                    Employer of Record (EOR)
                  </Link>

                  <Link
                    to="/services/permanent-staffing"
                    className={`Navbar-dropdownItem ${isActive('/services/permanent-staffing')}`}
                    onClick={closeMobileMenu}
                  >
                    Permanent Staffing &amp; Executive Search
                  </Link>

                  <Link
                    to="/services/payroll"
                    className={`Navbar-dropdownItem ${isActive('/services/payroll')}`}
                    onClick={closeMobileMenu}
                  >
                    Payroll Outsourcing
                  </Link>
                </div>
              </li>

              <li>
                <Link
                  to="/industries"
                  className={`Navbar-navLink ${isActive('/industries')}`}
                  onClick={closeMobileMenu}
                >
                  Industries
                </Link>
              </li>

              <li>
                <Link
                  to="/hot-jobs"
                  className={`Navbar-navLink ${isActive('/hot-jobs')}`}
                  onClick={closeMobileMenu}
                >
                  Hot Jobs
                </Link>
              </li>

              <li>
                <Link
                  to="/talent-cloud"
                  className={`Navbar-navLink ${isActive('/talent-cloud')}`}
                  onClick={closeMobileMenu}
                >
                  Talent Cloud
                </Link>
              </li>

              <li>
                <Link
                  to="/blog"
                  className={`Navbar-navLink ${isActive('/blog')}`}
                  onClick={closeMobileMenu}
                >
                  Blog
                </Link>
              </li>

              <li>
                <Link
                  to="/contact"
                  className={`Navbar-navLink ${isActive('/contact')}`}
                  onClick={closeMobileMenu}
                >
                  Contact Us
                </Link>
              </li>
            </ul>

            <div className="Navbar-actionButtons">
              <Link
                to="/find-talent"
                className="Navbar-btnPrimary"
                onClick={closeMobileMenu}
              >
                Find Talent
              </Link>

              <button
                type="button"
                onClick={handleQuickApply}
                className="Navbar-btnOutline"
              >
                Quick Apply
              </button>

              <button
                type="button"
                onClick={toggleTheme}
                className="Navbar-mobileThemeToggle"
                aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                data-testid="mobile-theme-toggle"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 2a10 10 0 0 0 0 20V2z" fill="currentColor" />
                </svg>
                <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
              </button>

              <button
                type="button"
                onClick={handlePortalClick}
                className="Navbar-userIconBtn"
                aria-label={
                  isAuthenticated
                    ? `Candidate Portal (${user?.name || 'Account'})`
                    : 'Candidate Portal (Sign In)'
                }
                title={
                  isAuthenticated
                    ? `Candidate Portal (${user?.name || 'Account'})`
                    : 'Candidate Portal (Sign In)'
                }
                style={{
                  background: isAuthenticated ? '#0037B0' : undefined,
                  color: isAuthenticated ? '#FFFFFF' : undefined,
                  cursor: 'pointer',
                  border: 'none',
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  fill="currentColor"
                  viewBox="0 0 16 16"
                  aria-hidden="true"
                >
                  <path d="M3 14s-1 0-1-1 1-4 6-4 6 1 6 4-1 1-1 1H3Zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
                </svg>
              </button>
            </div>
          </div>
        </nav>
      </header>

      <QuickApplyModal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        roleTitle="General Engineering Candidate Pool"
      />
    </>
  );
};

export default Navbar;
