import React, { useState } from 'react';
import logo from '../../assets/logo/logo.png';
import ApplyModal from './ApplyModal';
import { useTheme } from '../../useTheme';
import { Link, useLocation } from '../../router';

const Navbar = () => {
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { pathname } = useLocation();

  return (
    <>
      <header className={'Navbar-navbarContainer'}>
        {/* Top Bar */}
        <div className={'Navbar-topBar'}>
          <div className={'Navbar-topBarLeft'}>
            <div className={'Navbar-topBarItem'}>
              <span>🌐</span> India & USA / Canada
            </div>
            <div className={'Navbar-topBarItem'}>
              Talent is not bound by Borders
            </div>
          </div>
          <div className={'Navbar-topBarRight'}>
            <div className={'Navbar-topBarItem'}>
              <span>✉️</span> info@thinkwires.com
            </div>
            <div className={'Navbar-topBarItem'}>
              <span>📞</span> +91 87225 55828
            </div>
            <button 
              onClick={toggleTheme}
              className={'Navbar-topBarItem'}
              aria-label="Toggle Theme"
              style={{ 
                background: 'none', 
                border: 'none', 
                color: 'inherit', 
                cursor: 'pointer', 
                padding: '0 0.5rem',
                borderLeft: '1px solid var(--color-outline-variant)',
                marginLeft: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M12 2a10 10 0 0 0 0 20V2z" fill="currentColor"></path>
              </svg>
            </button>
          </div>
        </div>

        {/* Main Navigation */}
        <nav className={'Navbar-mainNav'}>
          <div className={'Navbar-leftNavGroup'}>
            <div className={'Navbar-logoContainer'}>
              <Link to="/">
                <img
                  src={logo}
                  alt="ThinkWires Logo"
                  className={'Navbar-logo'}
                />
              </Link>
            </div>

            <ul className={'Navbar-navLinks'}>
              <li>
                <Link
                  to="/"
                  className={`Navbar-navLink ${pathname === '/' ? 'Navbar-active' : ''}`}
                >
                  Home
                </Link>
              </li>
              <li>
                <Link 
                  to="/about" 
                  className={`Navbar-navLink ${pathname === '/about' ? 'Navbar-active' : ''}`}
                >
                  About Us
                </Link>
              </li>
              <li className="Navbar-dropdownContainer">
                <Link
                  to="/services"
                  className={`Navbar-navLink ${pathname.startsWith('/services') ? 'Navbar-active' : ''}`}
                  style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  Services
                  <svg
                    width="10"
                    height="6"
                    viewBox="0 0 10 6"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M1 1L5 5L9 1"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </Link>
                <div className="Navbar-dropdownMenu">
                  <Link
                    to="/services/staff-augmentation"
                    className="Navbar-dropdownItem"
                  >
                    Staff Augmentation
                  </Link>
                  <Link to="/services/eor" className="Navbar-dropdownItem">
                    Employer of Record (EOR)
                  </Link>
                  <Link
                    to="/services/permanent-staffing"
                    className="Navbar-dropdownItem"
                  >
                    Permanent Staffing &amp; Executive Search
                  </Link>
                  <Link to="/services/payroll" className="Navbar-dropdownItem">
                    Payroll Outsourcing
                  </Link>
                </div>
              </li>
              <li>
                <Link 
                  to="/industries" 
                  className={`Navbar-navLink ${pathname === '/industries' ? 'Navbar-active' : ''}`}
                >
                  Industries
                </Link>
              </li>
              <li>
                <Link 
                  to="/hot-jobs" 
                  className={`Navbar-navLink ${(pathname === '/hot-jobs' || pathname === '/jobs') ? 'Navbar-active' : ''}`}
                >
                  Hot Jobs
                </Link>
              </li>
              <li>
                <Link 
                  to="/talent-cloud" 
                  className={`Navbar-navLink ${pathname === '/talent-cloud' ? 'Navbar-active' : ''}`}
                >
                  Talent Cloud
                </Link>
              </li>
              <li>
                <Link 
                  to="/blog" 
                  className={`Navbar-navLink ${pathname === '/blog' ? 'Navbar-active' : ''}`}
                >
                  Blog
                </Link>
              </li>
              <li>
                <Link 
                  to="/contact" 
                  className={`Navbar-navLink ${pathname === '/contact' ? 'Navbar-active' : ''}`}
                >
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          <div className={'Navbar-actionButtons'}>
            <Link to="/find-talent" className={'Navbar-btnPrimary'}>
              Find Talent
            </Link>
            <button
              onClick={() => setIsApplyModalOpen(true)}
              className={'Navbar-btnOutline'}
            >
              Quick Apply
            </button>
            <button className={'Navbar-userIconBtn'} aria-label="User Profile">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="currentColor"
                viewBox="0 0 16 16"
              >
                <path d="M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1H3Zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
              </svg>
            </button>
          </div>
        </nav>
      </header>
      <ApplyModal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        roleTitle="General Engineering Candidate Pool"
      />
    </>
  );
};

export default Navbar;
