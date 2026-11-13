import React from 'react';
import { Link } from 'react-router-dom';

const IconLinkedIn = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

const IconX = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.742l7.733-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const IconMail = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
    <polyline points="22,6 12,13 2,6"></polyline>
  </svg>
);


import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { subscribeNewsletter } from '../../store/slices/blogSlice';
import logoImg from '../../assets/logo/logo.png';

const NewsletterForm = () => {
  const dispatch = useDispatch();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | success | error | invalid
  const [message, setMessage] = useState('');

  const validateEmail = (value) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!validateEmail(trimmed)) {
      setStatus('invalid');
      setMessage('Please enter a valid email address.');
      return;
    }
    setStatus('loading');
    setMessage('');
    try {
      await dispatch(subscribeNewsletter({ email: trimmed })).unwrap();
      setStatus('success');
      setMessage("Thanks for subscribing! You're on the list.");
      setEmail('');
    } catch (err) {
      setStatus('error');
      setMessage('Subscription failed. Please try again.');
    }
  };

  return (
    <>
      <form className={'Footer-newsletterForm'} onSubmit={handleSubmit} noValidate>
        <input
          type="email"
          placeholder="Your work email"
          className={'Footer-newsletterInput'}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          aria-label="Email address"
        />
        <button
          type="submit"
          className={'Footer-newsletterBtn'}
          disabled={status === 'loading'}
        >
          {status === 'loading' ? 'Joining...' : 'Join'}
        </button>
      </form>
      {status !== 'idle' && (
        <div
          role="status"
          aria-live="polite"
          className={'Footer-newsletterFeedback'}
          style={{
            marginTop: '0.5rem',
            color: status === 'success' ? 'var(--color-success, #16a34a)' : 'var(--color-error, #dc2626)',
          }}
        >
          {message}
        </div>
      )}
    </>
  );
};

const Footer = () => {
  return (
    <footer className={'Footer-footer'}>
      <div className={'Footer-container'}>
        <div className={'Footer-topSection'}>
          <div className={'Footer-brandCol'}>
            <Link to="/" className={'Footer-logo'} aria-label="Thinkwires Home">
              <img
                src={logoImg}
                alt="Thinkwires"
                className={'Footer-logoImg'}
              />
            </Link>
            <h4 className={'Footer-brandTagline'}>
              Technology Matters. People Matter More.
            </h4>
            <p className={'Footer-brandDesc'}>
             Thinkwires Technology is a Noida-based talent supply chain and business solutions company delivering skilled professionals and innovative solutions across AI, Cloud Computing, Cybersecurity, Semiconductors, Engineering, and Digital Transformation.
            </p>
            <div className={'Footer-socialLinks'}>
              <a
                href="https://linkedin.com/company/thinkwires"
                target="_blank"
                rel="noopener noreferrer"
                className={'Footer-socialIcon'}
                aria-label="LinkedIn"
              >
                <IconLinkedIn />
              </a>

              <a
                href="mailto:info@thinkwires.com"
                className={'Footer-socialIcon'}
                aria-label="Contact via Email"
              >
                <IconMail />
              </a>
            </div>
          </div>

          <div>
            <h4 className={'Footer-colTitle'}>CORE SERVICES</h4>
            <ul className={'Footer-linkList'}>
              <li>
                <Link
                  to="/services/staff-augmentation"
                  className={'Footer-linkItem'}
                >
                  Staff Augmentation
                </Link>
              </li>
              <li>
                <Link to="/services/eor" className={'Footer-linkItem'}>
                  Employer of Record (EOR)
                </Link>
              </li>
              <li>
                <Link
                  to="/services/executive-search"
                  className={'Footer-linkItem'}
                >
                  Executive Search
                </Link>
              </li>
              <li>
                <Link
                  to="/services/permanent-staffing"
                  className={'Footer-linkItem'}
                >
                  Permanent Staffing
                </Link>
              </li>
              <li>
                <Link to="/services/payroll" className={'Footer-linkItem'}>
                  Payroll Outsourcing
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className={'Footer-colTitle'}>INDUSTRIES</h4>
            <ul className={'Footer-linkList'}>
                <li>
                  <Link to="/industries/information-technology" className={'Footer-linkItem'}>
                    Information Technology
                  </Link>
                </li>
                <li>
                  <Link to="/industries/bfsi-and-fintech" className={'Footer-linkItem'}>
                    BFSI &amp; Fintech
                  </Link>
                </li>
                <li>
                  <Link to="/industries/healthcare-and-life-sciences" className={'Footer-linkItem'}>
                    Healthcare &amp; Life Sciences
                  </Link>
                </li>
                <li>
                  <Link to="/industries/engineering-and-telecom" className={'Footer-linkItem'}>
                    Engineering &amp; Telecom
                  </Link>
                </li>
                <li>
                  <Link to="/industries/e-commerce-and-retail" className={'Footer-linkItem'}>
                    E-Commerce &amp; Retail
                  </Link>
                </li>
              </ul>
          </div>

          <div>
            <h4 className={'Footer-colTitle'}>CORPORATE OFFICE</h4>
            <div className={'Footer-address'}>
              Thinkwires Global Corp
              <br />
              Plot No 20, Block H-1/A,
              <br />
              Sector 63, Noida, Uttar
              <br />
              Pradesh 201301
            </div>
            <div className={'Footer-contactInfo'}>
              <a
                href="mailto:info@thinkwires.com"
                className={'Footer-contactLink'}
              >
                <IconMail width="14" height="14" /> info@thinkwires.com
              </a>
            </div>

            <h4 className={'Footer-newsletterTitle'}>
              Talent Advisory Newsletter
            </h4>
      <NewsletterForm />

          </div>
        </div>

        <div className={'Footer-bottomSection'}>
          <div className={'Footer-copyright'}>
            &copy; 2026 Thinkwires. All rights reserved. Precision Staffing
            &amp; Global Talent Architecture
          </div>
          <div className={'Footer-bottomLinks'}>
            <Link to="/privacy" className={'Footer-bottomLink'}>
              Privacy Policy
            </Link>
            <Link to="/terms" className={'Footer-bottomLink'}>
              Terms of Service
            </Link>
            <Link to="/security" className={'Footer-bottomLink'}>
              Security &amp; Compliance
            </Link>
            <Link to="/cookies" className={'Footer-bottomLink'}>
              Cookie Settings
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
