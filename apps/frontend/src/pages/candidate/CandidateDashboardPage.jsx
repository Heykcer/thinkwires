import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser } from '../../store/slices/authSlice';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import ScreeningAssessmentModal from '../../components/common/ScreeningAssessmentModal';
import CandidateDossierModal from '../../components/candidate/CandidateDossierModal';
import '../auth/auth.css';

const CandidateDashboardPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [assessmentModalApp, setAssessmentModalApp] = useState(null);
  const [selectedDossierApp, setSelectedDossierApp] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);

    const fetchDashboard = async () => {
      try {
        const response = await fetch('/api/candidate/dashboard', {
          credentials: 'include',
        });
        const data = await response.json();
        if (response.ok) {
          setDashboardData(data);
        } else {
          setError(data.error || 'Failed to load dashboard data');
        }
      } catch (err) {
        setError('Network error while loading dashboard.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/');
  };

  const candidateProfile = dashboardData?.profile || user || {};
  const metrics = dashboardData?.metrics || {
    totalApplications: 0,
    inReview: 0,
    interviewing: 0,
    offers: 0,
  };
  const recentApplications = dashboardData?.recentApplications || [];

  return (
    <div className="tw-candidate-shell">
      <Helmet>
        <title>Dashboard | Thinkwires Candidate Portal</title>
        <meta
          name="description"
          content="Overview of your applied jobs, screening assessments, fit scores, and interview requests."
        />
        <meta property="og:title" content="Candidate Dashboard | Thinkwires" />
        <meta
          property="og:description"
          content="Overview of your applied jobs, screening assessments, fit scores, and interview requests."
        />
        <meta property="og:image" content="https://thinkwires.com/og-image.jpg" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Candidate Dashboard | Thinkwires" />
        <meta
          name="twitter:description"
          content="Overview of your applied jobs and screening assessments."
        />
        <meta name="twitter:image" content="https://thinkwires.com/og-image.jpg" />
      </Helmet>
      <Navbar />

      <main className="tw-portal-container">
        {/* Top Header */}
        <div className="tw-portal-topheader">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                overflow: 'hidden',
                background: '#EFF6FF',
                border: '2px solid #0037B0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '1.2rem',
                color: '#0037B0',
                flexShrink: 0,
              }}
            >
              {candidateProfile.avatarUrl ? (
                <img
                  src={candidateProfile.avatarUrl}
                  alt={candidateProfile.name || 'Candidate'}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                (candidateProfile.name?.slice(0, 2) || 'TW').toUpperCase()
              )}
            </div>

            <div className="tw-portal-welcome">
              <h1>Welcome, {candidateProfile.name || 'Candidate'}</h1>
              <p>
                {candidateProfile.currentRole || 'Software Professional'} •{' '}
                {candidateProfile.email}
              </p>
            </div>
          </div>

          <div
            style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}
          >
            <Link
              to="/jobs"
              className="Navbar-btnPrimary"
              style={{
                textDecoration: 'none',
                padding: '0.65rem 1.25rem',
                fontSize: '0.9rem',
              }}
            >
              Explore Available Jobs
            </Link>
            <button
              onClick={handleLogout}
              className="ApplyModal-btnCancel"
              style={{
                background: '#FFFFFF',
                border: '1px solid #CBD5E1',
                borderRadius: '8px',
                padding: '0.65rem 1rem',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.88rem',
                color: '#475569',
              }}
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="tw-portal-navtabs">
          <Link to="/candidate/dashboard" className="tw-portal-tab active">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
            Dashboard
          </Link>
          <Link to="/candidate/profile" className="tw-portal-tab">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            Candidate Profile
          </Link>
          <Link to="/candidate/applications" className="tw-portal-tab">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            My Applications
          </Link>
          <Link to="/jobs" className="tw-portal-tab">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
            </svg>
            Available Jobs
          </Link>
        </div>

        {error && (
          <div className="tw-auth-alert tw-auth-alert-error">
            <span>{error}</span>
          </div>
        )}

        {/* Stat Metrics Strip */}
        <div className="tw-stats-grid">
          <div className="tw-stat-card">
            <div className="tw-stat-title">Submitted Applications</div>
            <div className="tw-stat-value">{metrics.totalApplications}</div>
          </div>
          <div className="tw-stat-card">
            <div className="tw-stat-title">Under Review</div>
            <div className="tw-stat-value" style={{ color: '#2563EB' }}>
              {metrics.inReview}
            </div>
          </div>
          <div className="tw-stat-card">
            <div className="tw-stat-title">Active Interviews</div>
            <div className="tw-stat-value" style={{ color: '#7E22CE' }}>
              {metrics.interviewing}
            </div>
          </div>
          <div className="tw-stat-card">
            <div className="tw-stat-title">Offers Received</div>
            <div className="tw-stat-value" style={{ color: '#16A34A' }}>
              {metrics.offers}
            </div>
          </div>
        </div>

        {/* Profile Snapshot Card */}
        <div className="tw-portal-card">
          <div className="tw-portal-card-header">
            <h2 className="tw-portal-card-title">Candidate Profile Snapshot</h2>
            <Link
              to="/candidate/profile"
              className="tw-auth-link"
              style={{ fontSize: '0.88rem' }}
            >
              Edit Full Profile →
            </Link>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1.25rem',
            }}
          >
            <div>
              <div
                style={{
                  fontSize: '0.78rem',
                  color: '#64748B',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                }}
              >
                Primary Specialty
              </div>
              <div
                style={{
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: '#0F172A',
                  marginTop: '0.2rem',
                }}
              >
                {candidateProfile.currentRole || 'Software Engineer'}
              </div>
            </div>
            <div>
              <div
                style={{
                  fontSize: '0.78rem',
                  color: '#64748B',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                }}
              >
                Total Experience
              </div>
              <div
                style={{
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: '#0F172A',
                  marginTop: '0.2rem',
                }}
              >
                {candidateProfile.experience
                  ? `${candidateProfile.experience} Years`
                  : 'Not specified'}
              </div>
            </div>
            <div>
              <div
                style={{
                  fontSize: '0.78rem',
                  color: '#64748B',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                }}
              >
                Expected CTC / Retainer
              </div>
              <div
                style={{
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: '#008F68',
                  marginTop: '0.2rem',
                }}
              >
                {candidateProfile.expectedSalary || 'Market Standard'}
              </div>
            </div>
            <div>
              <div
                style={{
                  fontSize: '0.78rem',
                  color: '#64748B',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                }}
              >
                AI Vetting Score
              </div>
              <div
                style={{
                  fontSize: '1rem',
                  fontWeight: 700,
                  color: '#2563EB',
                  marginTop: '0.2rem',
                }}
              >
                {candidateProfile.assessmentScore != null
                  ? `${candidateProfile.assessmentScore}%`
                  : candidateProfile.vettingScore
                    ? `${candidateProfile.vettingScore}% (Calibrated)`
                    : 'Pending Test'}
              </div>
            </div>
            <div>
              <div
                style={{
                  fontSize: '0.78rem',
                  color: '#64748B',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                }}
              >
                Talent Network Status
              </div>
              <div style={{ marginTop: '0.2rem' }}>
                <span className="tw-badge-status tw-badge-applied">
                  {candidateProfile.status || 'Active Candidate'}
                </span>
              </div>
            </div>
          </div>

          {candidateProfile.technicalSkills &&
            candidateProfile.technicalSkills.length > 0 && (
              <div
                style={{
                  marginTop: '1.25rem',
                  paddingTop: '1.25rem',
                  borderTop: '1px solid #F1F5F9',
                }}
              >
                <div
                  style={{
                    fontSize: '0.78rem',
                    color: '#64748B',
                    fontWeight: 600,
                    marginBottom: '0.5rem',
                  }}
                >
                  VERIFIED TECHNICAL SKILLS
                </div>
                <div
                  style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}
                >
                  {candidateProfile.technicalSkills.map((sk, idx) => (
                    <span
                      key={idx}
                      style={{
                        background: '#F1F5F9',
                        color: '#334155',
                        padding: '0.3rem 0.65rem',
                        borderRadius: '6px',
                        fontSize: '0.82rem',
                        fontWeight: 500,
                      }}
                    >
                      {sk}
                    </span>
                  ))}
                </div>
              </div>
            )}
        </div>

        {/* Recent Applications Table */}
        <div className="tw-portal-card">
          <div className="tw-portal-card-header">
            <h2 className="tw-portal-card-title">Recent Job Applications</h2>
            <Link
              to="/candidate/applications"
              className="tw-auth-link"
              style={{ fontSize: '0.88rem' }}
            >
              View All ({metrics.totalApplications}) →
            </Link>
          </div>

          {loading ? (
            <div
              style={{ padding: '2rem', textAlign: 'center', color: '#64748B' }}
            >
              Loading applications...
            </div>
          ) : recentApplications.length === 0 ? (
            <div
              style={{
                padding: '2.5rem',
                textAlign: 'center',
                background: '#F8FAFC',
                borderRadius: '8px',
                border: '1px dashed #CBD5E1',
              }}
            >
              <p style={{ color: '#64748B', margin: '0 0 1rem 0' }}>
                You have not submitted any job applications yet.
              </p>
              <Link
                to="/jobs"
                className="Navbar-btnPrimary"
                style={{
                  textDecoration: 'none',
                  display: 'inline-block',
                  fontSize: '0.88rem',
                }}
              >
                Browse Curated Openings
              </Link>
            </div>
          ) : (
            <div className="tw-table-responsive">
              <table className="tw-portal-table">
                <thead>
                  <tr>
                    <th>Position Title</th>
                    <th>Department</th>
                    <th>Location</th>
                    <th>Date Applied</th>
                    <th>ATS Fit Score</th>
                    <th>AI Screening Test</th>
                    <th>Current Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentApplications.map((app) => (
                    <tr key={app._id || app.id}>
                      <td style={{ fontWeight: 600, color: '#0F172A' }}>
                        {app.jobTitle}
                      </td>
                      <td>{app.department || 'Engineering'}</td>
                      <td>{app.location || 'Remote'}</td>
                      <td>
                        {app.createdAt || app.appliedAt
                          ? new Date(
                              app.createdAt || app.appliedAt
                            ).toLocaleDateString()
                          : 'Recent'}
                      </td>
                      <td>
                        <button
                          type="button"
                          onClick={() => setSelectedDossierApp(app)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            padding: '0.25rem 0.6rem',
                            borderRadius: '6px',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            border: '1px solid transparent',
                            cursor: 'pointer',
                            background:
                              app.fitScore >= 75
                                ? '#DCFCE7'
                                : app.fitScore >= 50
                                  ? '#FEF9C3'
                                  : '#FEE2E2',
                            color:
                              app.fitScore >= 75
                                ? '#166534'
                                : app.fitScore >= 50
                                  ? '#854D0E'
                                  : '#991B1B',
                            borderColor:
                              app.fitScore >= 75
                                ? '#BBF7D0'
                                : app.fitScore >= 50
                                  ? '#FEF08A'
                                  : '#FECDD3',
                          }}
                          title="Click to view AI Evaluation Dossier"
                        >
                          <span
                            className="material-symbols-outlined"
                            style={{ fontSize: '0.95rem' }}
                          >
                            psychology
                          </span>
                          <span>{app.fitScore != null ? `${app.fitScore}%` : 'View Dossier'}</span>
                        </button>
                      </td>
                      <td>
                        {app.assessmentStatus === 'Completed' ||
                        app.assessmentStatus === 'Passed' ||
                        app.assessmentStatus === 'Failed' ? (
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '0.2rem 0.55rem',
                              borderRadius: '6px',
                              fontSize: '0.8rem',
                              fontWeight: 600,
                              background:
                                app.screeningPassed || app.assessmentScore >= 70
                                  ? '#DCFCE7'
                                  : '#FEE2E2',
                              color:
                                app.screeningPassed || app.assessmentScore >= 70
                                  ? '#166534'
                                  : '#991B1B',
                            }}
                          >
                            {app.screeningPassed || app.assessmentScore >= 70
                              ? 'Passed'
                              : 'Completed'}{' '}
                            ({app.assessmentScore || 0}%)
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setAssessmentModalApp(app)}
                            style={{
                              background: '#2563EB',
                              color: '#FFFFFF',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '0.3rem 0.7rem',
                              fontSize: '0.8rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              boxShadow: '0 1px 2px rgba(37,99,235,0.2)',
                            }}
                          >
                            <span
                              className="material-symbols-outlined"
                              style={{ fontSize: '0.95rem' }}
                            >
                              assignment
                            </span>
                            <span>Take Test</span>
                          </button>
                        )}
                      </td>
                      <td>
                        <span
                          className={`tw-badge-status ${
                            app.status === 'Offered'
                              ? 'tw-badge-offered'
                              : app.status === 'Interview'
                                ? 'tw-badge-interview'
                                : app.status === 'Screening'
                                  ? 'tw-badge-screening'
                                  : app.status === 'Rejected'
                                    ? 'tw-badge-rejected'
                                    : 'tw-badge-applied'
                          }`}
                        >
                          {app.status || 'Applied'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Proctored Screening Assessment Modal */}
        {assessmentModalApp && (
          <ScreeningAssessmentModal
            applicationId={assessmentModalApp._id || assessmentModalApp.id}
            jobTitle={assessmentModalApp.jobTitle}
            onClose={() => setAssessmentModalApp(null)}
            onCompleted={(result) => {
              setDashboardData((prev) => {
                if (!prev) return prev;
                return {
                  ...prev,
                  profile: {
                    ...(prev.profile || {}),
                    assessmentScore: result.percentageScore,
                    vettingScore: Math.max(result.percentageScore, 85),
                  },
                  recentApplications: (prev.recentApplications || []).map(
                    (a) =>
                      (a._id || a.id) ===
                      (assessmentModalApp._id || assessmentModalApp.id)
                        ? {
                            ...a,
                            assessmentScore: result.percentageScore,
                            assessmentStatus: 'Completed',
                            screeningPassed: result.passed,
                          }
                        : a
                  ),
                };
              });
              setAssessmentModalApp(null);
            }}
          />
        )}

        {/* Candidate Evaluation Dossier Modal */}
        {selectedDossierApp && (
          <CandidateDossierModal
            isOpen={Boolean(selectedDossierApp)}
            onClose={() => setSelectedDossierApp(null)}
            applicationId={selectedDossierApp._id || selectedDossierApp.id}
            applicationData={selectedDossierApp}
          />
        )}
      </main>

      <Footer />
    </div>
  );
};

export default CandidateDashboardPage;
