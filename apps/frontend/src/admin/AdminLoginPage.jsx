import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { adminApi, isAdminAuthenticated, getAdminRole } from './adminService';
import { ShieldIcon, LockIcon } from './AdminIcons';
import logo from '../assets/logo/logo.png';
import './admin.css';

const AdminLoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // If already authenticated via HttpOnly cookie session, redirect to appropriate admin module
  useEffect(() => {
    let isMounted = true;
    adminApi
      .getMe()
      .then((data) => {
        if (!isMounted) return;
        if (data && data.user) {
          const role = (data.user.role || '').toLowerCase();
          const target = role === 'cms_admin' ? '/admin/cms' : '/admin';
          navigate(target, { replace: true });
        }
      })
      .catch(() => {
        // Not authenticated, stay on login page safely
      });

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError('Please provide both official email and password.');
      return;
    }

    try {
      setLoading(true);
      const res = await adminApi.login(email.trim(), password);

      const targetPath =
        location.state?.from ||
        (res.user?.role === 'cms_admin' ? '/admin/cms' : '/admin');

      navigate(targetPath, { replace: true });
    } catch (err) {
      setError(
        err.message ||
          'Authentication failed. Please verify your email and password.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background:
          'linear-gradient(135deg, #0B132B 0%, #1C2541 50%, #1E293B 100%)',
        padding: '1.5rem',
        fontFamily:
          "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
          overflow: 'hidden',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        {/* Top Header Banner */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
            padding: '2.25rem 2rem 1.75rem',
            textAlign: 'center',
            color: '#FFFFFF',
            position: 'relative',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem',
            }}
          >
            <div
              style={{
                background: '#FFFFFF',
                borderRadius: '12px',
                padding: '0.45rem 1.25rem',
                display: 'inline-flex',
                alignItems: 'center',
                boxShadow: '0 8px 20px rgba(0, 0, 0, 0.25)',
              }}
            >
              <img
                src={logo}
                alt="Thinkwires Logo"
                style={{ height: '36px', width: 'auto', display: 'block' }}
              />
            </div>
          </div>
          <h1
            style={{
              fontSize: '1.4rem',
              fontWeight: 700,
              margin: '0 0 0.35rem',
              letterSpacing: '-0.02em',
            }}
          >
            Admin Portal
          </h1>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#94A3B8' }}>
            Sign in with your Superadmin-provisioned credentials
          </p>
        </div>

        {/* Form Body */}
        <div style={{ padding: '2rem' }}>
          {error && (
            <div
              style={{
                backgroundColor: '#FEF2F2',
                border: '1px solid #FCA5A5',
                borderRadius: '8px',
                padding: '0.85rem 1rem',
                marginBottom: '1.5rem',
                fontSize: '0.84rem',
                color: '#B91C1C',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>
                warning
              </span>
              <span>{error}</span>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
          >
            <div>
              <label
                htmlFor="admin-email"
                style={{
                  display: 'block',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: '#334155',
                  marginBottom: '0.4rem',
                }}
              >
                Official Email Address
              </label>
              <input
                id="admin-email"
                type="email"
                required
                autoComplete="email"
                placeholder="name@thinkwires.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 0.9rem',
                  fontSize: '0.9rem',
                  border: '1px solid #CBD5E1',
                  borderRadius: '8px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#008F68')}
                onBlur={(e) => (e.target.style.borderColor = '#CBD5E1')}
              />
            </div>

            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.4rem',
                }}
              >
                <label
                  htmlFor="admin-password"
                  style={{
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    color: '#334155',
                  }}
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '0.75rem',
                    color: '#008F68',
                    cursor: 'pointer',
                    fontWeight: 600,
                    padding: 0,
                  }}
                >
                  {showPassword ? 'Hide Password' : 'Show Password'}
                </button>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 0.9rem',
                    fontSize: '0.9rem',
                    border: '1px solid #CBD5E1',
                    borderRadius: '8px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#008F68')}
                  onBlur={(e) => (e.target.style.borderColor = '#CBD5E1')}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: '0.5rem',
                padding: '0.85rem',
                fontSize: '0.92rem',
                fontWeight: 600,
                color: '#FFFFFF',
                backgroundColor: loading ? '#94A3B8' : '#008F68',
                border: 'none',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 12px rgba(0, 143, 104, 0.25)',
                transition: 'background-color 0.2s',
              }}
            >
              {loading ? (
                <>
                  <span
                    style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid #FFFFFF',
                      borderTopColor: 'transparent',
                      borderRadius: '50%',
                      display: 'inline-block',
                      animation: 'twSpin 0.7s linear infinite',
                    }}
                  />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <LockIcon size={16} />
                  <span>Sign In to Admin Portal</span>
                </>
              )}
            </button>
          </form>

          <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
            <Link
              to="/"
              style={{
                color: '#64748B',
                fontSize: '0.8rem',
                textDecoration: 'none',
              }}
            >
              &larr; Return to Public Website
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
