import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useSearchParams } from 'react-router-dom';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import ScreeningAssessmentModal from '../../components/common/ScreeningAssessmentModal';
import CandidateDossierModal from '../../components/candidate/CandidateDossierModal';
import '../auth/auth.css';

const CandidateApplicationsPage = () => {
  const [searchParams] = useSearchParams();
  const isJustApplied = searchParams.get('applied') === 'true';

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [noticeMessage, setNoticeMessage] = useState(
    isJustApplied
      ? 'Application submitted. Assessment available for 24 hours.'
      : ''
  );
  const [assessmentModalApp, setAssessmentModalApp] = useState(null);
  const [selectedDossierApp, setSelectedDossierApp] = useState(null);
  const [withdrawingId, setWithdrawingId] = useState(null);
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (searchParams.get('applied') === 'true') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setNoticeMessage(
        'Application submitted. Assessment available for 24 hours.'
      );
    }
  }, [searchParams]);

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = 'My Job Applications | Thinkwires';

    const fetchApplications = async () => {
      try {
        const response = await fetch('/api/candidate/applications', {
          credentials: 'include',
        });
        const data = await response.json();
        if (response.ok) {
          setApplications(data.applications || []);
        } else {
          setError(data.error || 'Failed to fetch job applications');
        }
      } catch {
        setError('Network error while retrieving applications.');
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, []);

  const handleWithdraw = async (app) => {
    const appId = app._id || app.id;
    setWithdrawingId(appId);
    setError('');
    try {
      const res = await fetch(`/api/candidate/applications/${appId}/withdraw`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok) {
        setApplications((prev) =>
          prev.map((a) =>
            (a._id || a.id) === appId
              ? { ...a, status: 'Withdrawn', stage: 'Withdrawn by Candidate' }
              : a
          )
        );
        setNoticeMessage('Application withdrawn successfully.');
      } else {
        setError(data.error || 'Failed to withdraw application.');
      }
    } catch {
      setError(
        'Network error connecting to Thinkwires service to withdraw application.'
      );
    } finally {
      setWithdrawingId(null);
    }
  };

  return (
    <div className="tw-candidate-shell">
      <Helmet>
        <title>My Applications | Thinkwires Candidate Portal</title>
        <meta
          name="description"
          content="Track real-time status and hiring milestones for all your submitted job applications."
        />
        <meta property="og:title" content="My Applications | Thinkwires" />
        <meta
          property="og:description"
          content="Track real-time status and hiring milestones for all your submitted job applications."
        />
        <meta property="og:image" content="https://thinkwires.com/og-image.jpg" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="My Applications | Thinkwires" />
        <meta
          name="twitter:description"
          content="Track real-time status and hiring milestones for all your submitted job applications."
        />
        <meta name="twitter:image" content="https://thinkwires.com/og-image.jpg" />
      </Helmet>
      <Navbar />

      <main className="tw-portal-container">
        {/* Navigation Tabs */}
        <div className="tw-portal-navtabs">
          <Link to="/candidate/dashboard" className="tw-portal-tab">
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
          <Link to="/candidate/applications" className="tw-portal-tab active">
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

        <div className="tw-portal-card">
          <div className="tw-portal-card-header">
            <div>
              <h1 className="tw-portal-card-title">
                My Tracked Job Applications
              </h1>
              <p
                style={{
                  color: '#64748B',
                  margin: '0.25rem 0 0 0',
                  fontSize: '0.9rem',
                }}
              >
                Track your active job applications, take your 24-hour technical
                assessments, and manage your submissions.
              </p>
            </div>

            <Link
              to="/jobs"
              className="Navbar-btnPrimary"
              style={{
                textDecoration: 'none',
                padding: '0.55rem 1rem',
                fontSize: '0.88rem',
              }}
            >
              + Apply for More Roles
            </Link>
          </div>

          {noticeMessage && (
            <div
              className="tw-auth-alert tw-auth-alert-success"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
                marginBottom: '1.25rem',
              }}
            >
              <span>{noticeMessage}</span>
              <button
                type="button"
                onClick={() => setNoticeMessage('')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  color: '#166534',
                  fontWeight: 700,
                }}
                aria-label="Dismiss Alert"
              >
                Dismiss
              </button>
            </div>
          )}

          {error && (
            <div
              className="tw-auth-alert tw-auth-alert-error"
              style={{ marginBottom: '1.25rem' }}
            >
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div
              style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}
            >
              Retrieving your applications...
            </div>
          ) : applications.length === 0 ? (
            <div
              style={{
                padding: '3rem 1.5rem',
                textAlign: 'center',
                background: '#F8FAFC',
                borderRadius: '8px',
                border: '1px dashed #CBD5E1',
              }}
            >
              <h3
                style={{
                  margin: '0 0 0.5rem 0',
                  color: '#0F172A',
                  fontSize: '1.1rem',
                }}
              >
                No active applications found
              </h3>
              <p
                style={{
                  color: '#64748B',
                  margin: '0 0 1.25rem 0',
                  maxWidth: '450px',
                  marginLeft: 'auto',
                  marginRight: 'auto',
                }}
              >
                You have not applied to any Thinkwires partner positions yet.
                Explore our open positions to submit an application.
              </p>
              <Link
                to="/jobs"
                className="Navbar-btnPrimary"
                style={{ textDecoration: 'none', display: 'inline-block' }}
              >
                Browse Curated Job Openings
              </Link>
            </div>
          ) : (
            <div className="tw-table-responsive">
              <table className="tw-portal-table">
                <thead>
                  <tr>
                    <th>Job Role</th>
                    <th>Department</th>
                    <th>Location</th>
                    <th>ATS Fit</th>
                    <th>Screening Assessment (24h Window)</th>
                    <th>Stage</th>
                    <th>Status</th>
                    <th>Submitted</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app) => {
                    const appId = app._id || app.id;
                    const submissionTime = new Date(
                      app.createdAt || app.appliedAt || currentTime
                    ).getTime();
                    const hoursElapsed =
                      (currentTime - submissionTime) / (1000 * 60 * 60);
                    const hoursRemaining = Math.max(0, 24 - hoursElapsed);
                    const isWithin24Hrs = hoursRemaining > 0;
                    const isWithdrawn = app.status === 'Withdrawn';
                    const isCompleted =
                      app.assessmentStatus === 'Completed' ||
                      app.assessmentStatus === 'Passed' ||
                      app.assessmentStatus === 'Failed' ||
                      app.assessmentScore != null;

                    return (
                      <tr
                        key={appId}
                        style={{ opacity: isWithdrawn ? 0.65 : 1 }}
                      >
                        <td style={{ fontWeight: 600, color: '#0F172A' }}>
                          {app.jobTitle}
                          {isWithdrawn && (
                            <span
                              style={{
                                display: 'block',
                                fontSize: '0.72rem',
                                color: '#64748B',
                                fontWeight: 500,
                              }}
                            >
                              (Application Withdrawn)
                            </span>
                          )}
                        </td>
                        <td>{app.department || 'Engineering'}</td>
                        <td>{app.location || 'Remote'}</td>
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
                          {isWithdrawn ? (
                            <span
                              style={{ color: '#94A3B8', fontSize: '0.82rem' }}
                            >
                              Withdrawn
                            </span>
                          ) : isCompleted ? (
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '0.25rem 0.6rem',
                                borderRadius: '6px',
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                background:
                                  app.screeningPassed ||
                                  (app.assessmentScore || 0) >= 70
                                    ? '#DCFCE7'
                                    : '#FEE2E2',
                                color:
                                  app.screeningPassed ||
                                  (app.assessmentScore || 0) >= 70
                                    ? '#166534'
                                    : '#991B1B',
                              }}
                            >
                              {app.screeningPassed ||
                              (app.assessmentScore || 0) >= 70
                                ? 'Passed'
                                : 'Completed'}{' '}
                              ({app.assessmentScore || 0}%)
                            </span>
                          ) : isWithin24Hrs ? (
                            <div>
                              <button
                                type="button"
                                onClick={() => setAssessmentModalApp(app)}
                                style={{
                                  background: '#2563EB',
                                  color: '#FFFFFF',
                                  border: 'none',
                                  borderRadius: '6px',
                                  padding: '0.35rem 0.75rem',
                                  fontSize: '0.8rem',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  boxShadow: '0 1px 2px rgba(37,99,235,0.2)',
                                }}
                              >
                                Take Assessment
                              </button>
                              <div
                                style={{
                                  fontSize: '0.74rem',
                                  color: '#D97706',
                                  marginTop: '0.3rem',
                                  fontWeight: 600,
                                }}
                              >
                                {Math.floor(hoursRemaining)}h{' '}
                                {Math.floor((hoursRemaining % 1) * 60)}m left
                              </div>
                            </div>
                          ) : (
                            <span
                              style={{
                                color: '#DC2626',
                                fontSize: '0.78rem',
                                fontWeight: 600,
                              }}
                            >
                              Expired (24h limit)
                            </span>
                          )}
                        </td>
                        <td
                          style={{
                            color: isWithdrawn ? '#64748B' : '#2563EB',
                            fontWeight: 500,
                          }}
                        >
                          {app.stage ||
                            (isWithdrawn ? 'Withdrawn' : 'Screening')}
                        </td>
                        <td>
                          <span
                            className={`tw-badge-status ${
                              isWithdrawn
                                ? 'tw-badge-rejected'
                                : app.status === 'Offered'
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
                        <td>{new Date(submissionTime).toLocaleDateString()}</td>
                        <td>
                          {isWithdrawn ? (
                            <span
                              style={{
                                color: '#94A3B8',
                                fontSize: '0.82rem',
                                fontStyle: 'italic',
                              }}
                            >
                              Withdrawn
                            </span>
                          ) : app.status !== 'Hired' ? (
                            <button
                              type="button"
                              onClick={() => handleWithdraw(app)}
                              disabled={withdrawingId === appId}
                              style={{
                                background: '#FFF1F2',
                                color: '#E11D48',
                                border: '1px solid #FECDD3',
                                borderRadius: '6px',
                                padding: '0.3rem 0.65rem',
                                fontSize: '0.78rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                              }}
                            >
                              {withdrawingId === appId
                                ? 'Withdrawing...'
                                : 'Withdraw'}
                            </button>
                          ) : (
                            <span
                              style={{
                                color: '#166534',
                                fontSize: '0.8rem',
                                fontWeight: 600,
                              }}
                            >
                              Active Placed
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Proctored Screening Assessment Modal */}
        {assessmentModalApp && (
          <ScreeningAssessmentModal
            isOpen={true}
            applicationId={assessmentModalApp._id || assessmentModalApp.id}
            jobTitle={assessmentModalApp.jobTitle}
            onClose={() => setAssessmentModalApp(null)}
            onCompleted={(result) => {
              const score = result.total_score ?? result.percentageScore ?? 0;
              setApplications((prev) =>
                prev.map((a) =>
                  (a._id || a.id) ===
                  (assessmentModalApp._id || assessmentModalApp.id)
                    ? {
                        ...a,
                        assessmentScore: score,
                        assessmentStatus: result.passed
                          ? 'Passed'
                          : 'Completed',
                        screeningPassed: result.passed,
                        stage:
                          result.gatekeeper_status ||
                          result.gatekeeperStatus ||
                          a.stage,
                      }
                    : a
                )
              );
              setNoticeMessage('Assessment submitted successfully.');
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

export default CandidateApplicationsPage;
