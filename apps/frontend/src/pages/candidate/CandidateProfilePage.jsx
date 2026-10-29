import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { updateProfile } from '../../store/slices/authSlice';
import { getApiBaseUrl, getCandidateAuthHeaders } from '../../utils/apiConfig';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import './candidate.css';
import '../auth/auth.css';
import AvatarManagerModal from '../../components/candidate/AvatarManagerModal';

const POPULAR_SKILL_SUGGESTIONS = [
  'React',
  'Node.js',
  'TypeScript',
  'Python',
  'Go',
  'AWS',
  'Docker',
  'Kubernetes',
  'PostgreSQL',
  'System Design',
  'GraphQL',
  'Microservices',
];

const CandidateProfilePage = () => {
  const dispatch = useDispatch();
  const { user, loading, error, successMessage } = useSelector(
    (state) => state.auth
  );

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    headline: '',
    currentRole: '',
    location: '',
    experience: 0,
    expectedSalary: '',
    technicalSkills: '',
    workMode: 'Full-Time Looking',
    portfolioUrl: '',
    githubUrl: '',
    linkedinUrl: '',
    bio: '',
  });

  const [localSuccess, setLocalSuccess] = useState('');
  const [localError, setLocalError] = useState('');
  const [resumeFile, setResumeFile] = useState(null);
  const [parsingResume, setParsingResume] = useState(false);
  const [resumeNotice, setResumeNotice] = useState('');
  const [resumeError, setResumeError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);

  // Compute profile initials
  const initials = useMemo(() => {
    const candidateName = formData.name || user?.name || '';
    if (!candidateName.trim()) return 'TW';
    const parts = candidateName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }, [formData.name, user?.name]);

  // Compute profile completeness percentage
  const completeness = useMemo(() => {
    let score = 0;
    if (formData.name?.trim()) score += 15;
    if (formData.phone?.trim()) score += 10;
    if (formData.currentRole?.trim()) score += 15;
    if (formData.location?.trim()) score += 10;
    if (Number(formData.experience) > 0) score += 10;
    if (formData.technicalSkills?.trim()) score += 15;
    if (
      formData.linkedinUrl?.trim() ||
      formData.githubUrl?.trim() ||
      formData.portfolioUrl?.trim()
    )
      score += 10;
    if (formData.bio?.trim()) score += 15;
    return Math.min(score, 100);
  }, [formData]);

  // Active skills array for live chips
  const activeSkillsList = useMemo(() => {
    if (!formData.technicalSkills) return [];
    return formData.technicalSkills
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }, [formData.technicalSkills]);

  // Check if form has unsaved modifications
  const isDirty = useMemo(() => {
    if (!user) return false;
    const userSkills = Array.isArray(user.technicalSkills)
      ? user.technicalSkills.join(', ')
      : user.technicalSkills || '';

    return (
      formData.name !== (user.name || '') ||
      formData.phone !== (user.phone || '') ||
      formData.currentRole !== (user.currentRole || '') ||
      formData.location !== (user.location || '') ||
      Number(formData.experience) !== Number(user.experience || 0) ||
      formData.expectedSalary !== (user.expectedSalary || '') ||
      formData.workMode !== (user.workMode || 'Full-Time Looking') ||
      formData.technicalSkills !== userSkills ||
      formData.linkedinUrl !== (user.linkedinUrl || '') ||
      formData.githubUrl !== (user.githubUrl || '') ||
      formData.portfolioUrl !== (user.portfolioUrl || '') ||
      formData.bio !== (user.bio || '')
    );
  }, [formData, user]);

  const processResumeFile = async (file) => {
    setResumeError('');
    setResumeNotice('');
    if (!file) return;

    const validExtensions = ['.pdf', '.doc', '.docx'];
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

    if (!validExtensions.includes(ext)) {
      setResumeError('Please upload a valid document (.pdf, .doc, .docx).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setResumeError('File size exceeds 10MB limit.');
      return;
    }

    setResumeFile(file);
    setParsingResume(true);

    try {
      const apiBase = getApiBaseUrl();
      const parseData = new FormData();
      parseData.append('resume', file);
      const res = await fetch(`${apiBase}/candidate/parse-resume`, {
        method: 'POST',
        headers: getCandidateAuthHeaders(),
        credentials: 'include',
        body: parseData,
      });

      const data = await res.json();
      if (res.ok && data.parsed) {
        const p = data.parsed;
        const parsedFullName = [p.firstName, p.lastName]
          .filter(Boolean)
          .join(' ');

        setFormData((prev) => ({
          ...prev,
          name: parsedFullName || prev.name,
          phone: p.mobileNumber || prev.phone,
          currentRole: p.currentRole || prev.currentRole,
          headline: p.headline || p.currentRole || prev.headline,
          location: p.location || prev.location,
          experience: p.totalExperienceYears
            ? Number(p.totalExperienceYears) || prev.experience
            : prev.experience,
          technicalSkills:
            p.skillSet ||
            (Array.isArray(p.skills)
              ? p.skills.join(', ')
              : prev.technicalSkills),
          linkedinUrl: p.linkedInLink || prev.linkedinUrl,
          githubUrl: p.githubLink || prev.githubUrl,
          portfolioUrl: p.portfolioUrl || p.portfolioLink || prev.portfolioUrl,
          bio: p.candidateNote || prev.bio,
        }));
        setResumeNotice(
          'Resume analyzed successfully. Fields have been pre-filled below.'
        );
      } else {
        setResumeError(data.error || 'Failed to parse resume.');
      }
    } catch (err) {
      setResumeError('Error parsing resume: ' + err.message);
    } finally {
      setParsingResume(false);
    }
  };

  const handleResumeChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processResumeFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processResumeFile(e.dataTransfer.files[0]);
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = 'Candidate Profile & Preferences | Thinkwires';

    if (user) {
      // Synchronize editable form state when authenticated user profile data loads or changes from Redux
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        headline: user.headline || '',
        currentRole: user.currentRole || '',
        location: user.location || '',
        experience: user.experience || 0,
        expectedSalary: user.expectedSalary || '',
        technicalSkills: Array.isArray(user.technicalSkills)
          ? user.technicalSkills.join(', ')
          : user.technicalSkills || '',
        workMode: user.workMode || 'Full-Time Looking',
        portfolioUrl: user.portfolioUrl || '',
        githubUrl: user.githubUrl || '',
        linkedinUrl: user.linkedinUrl || '',
        bio: user.bio || '',
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRemoveSkill = (skillToRemove) => {
    const updated = activeSkillsList
      .filter((s) => s.toLowerCase() !== skillToRemove.toLowerCase())
      .join(', ');
    setFormData((prev) => ({ ...prev, technicalSkills: updated }));
  };

  const handleAddPopularSkill = (skillToAdd) => {
    if (
      activeSkillsList.some(
        (s) => s.toLowerCase() === skillToAdd.toLowerCase()
      )
    ) {
      return;
    }
    const updated = activeSkillsList.length
      ? `${formData.technicalSkills.trim()}, ${skillToAdd}`
      : skillToAdd;
    setFormData((prev) => ({ ...prev, technicalSkills: updated }));
  };

  const handleReset = () => {
    if (!user) return;
    setFormData({
      name: user.name || '',
      phone: user.phone || '',
      headline: user.headline || '',
      currentRole: user.currentRole || '',
      location: user.location || '',
      experience: user.experience || 0,
      expectedSalary: user.expectedSalary || '',
      technicalSkills: Array.isArray(user.technicalSkills)
        ? user.technicalSkills.join(', ')
        : user.technicalSkills || '',
      workMode: user.workMode || 'Full-Time Looking',
      portfolioUrl: user.portfolioUrl || '',
      githubUrl: user.githubUrl || '',
      linkedinUrl: user.linkedinUrl || '',
      bio: user.bio || '',
    });
    setLocalSuccess('');
    setLocalError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalSuccess('');
    setLocalError('');

    const payload = {
      ...formData,
      experience: Number(formData.experience) || 0,
      technicalSkills: formData.technicalSkills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    };

    const action = await dispatch(updateProfile(payload));
    if (updateProfile.fulfilled.match(action)) {
      setLocalSuccess(
        'Your candidate profile and preferences have been updated successfully.'
      );
    } else {
      setLocalError(
        action.payload || 'Unable to update profile. Please try again.'
      );
    }
  };

  return (
    <div className="tw-candidate-shell">
      <Helmet>
        <title>My Profile | Thinkwires Candidate Portal</title>
        <meta
          name="description"
          content="Edit your professional experience, technical skills, resume, and portfolio details."
        />
        <meta property="og:title" content="Candidate Profile | Thinkwires" />
        <meta
          property="og:description"
          content="Edit your professional experience, technical skills, resume, and portfolio details."
        />
        <meta property="og:image" content="https://thinkwires.com/og-image.jpg" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Candidate Profile | Thinkwires" />
        <meta
          name="twitter:description"
          content="Edit your professional experience, technical skills, and resume."
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
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
            Dashboard
          </Link>
          <Link to="/candidate/profile" className="tw-portal-tab active">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
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
              strokeLinecap="round"
              strokeLinejoin="round"
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
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
            </svg>
            Available Jobs
          </Link>
        </div>

        {/* Floating Success / Error Alerts */}
        {(localSuccess || successMessage) && (
          <div className="tw-portal-alert tw-portal-alert-success" role="alert">
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
              <span>{localSuccess || successMessage}</span>
            </div>
            <button
              type="button"
              className="tw-alert-close-btn"
              onClick={() => setLocalSuccess('')}
              aria-label="Close notification"
            >
              ×
            </button>
          </div>
        )}

        {(localError || error) && (
          <div className="tw-portal-alert tw-portal-alert-error" role="alert">
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <span>{localError || error}</span>
            </div>
            <button
              type="button"
              className="tw-alert-close-btn"
              onClick={() => setLocalError('')}
              aria-label="Close error"
            >
              ×
            </button>
          </div>
        )}

        {/* Profile Identity & Completeness Hero */}
        <div className="tw-profile-hero">
          <div className="tw-profile-identity">
            <div
              className="tw-profile-avatar"
              style={{
                position: 'relative',
                cursor: 'pointer',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onClick={() => setIsAvatarModalOpen(true)}
              title="Click to manage profile avatar"
            >
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={formData.name || 'Candidate Avatar'}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                initials
              )}
              <span
                className="tw-avatar-status-dot"
                title="Profile Active"
              ></span>
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: 'rgba(15, 23, 42, 0.45)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: 0,
                  transition: 'opacity 0.2s ease',
                  borderRadius: '50%',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '0')}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ color: '#FFFFFF', fontSize: '1.25rem' }}
                >
                  photo_camera
                </span>
              </div>
            </div>
            <div className="tw-profile-names">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <h1>
                  {formData.name || user?.name || 'Candidate Profile'}
                  <span className="tw-profile-verified-badge">
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    Verified Talent
                  </span>
                </h1>
                <button
                  type="button"
                  onClick={() => setIsAvatarModalOpen(true)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '20px',
                    border: '1px solid #CBD5E1',
                    background: '#FFFFFF',
                    color: '#0037B0',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                  title="Change avatar or photo"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '0.95rem' }}>
                    palette
                  </span>
                  Avatar
                </button>
              </div>
              <p className="tw-profile-subline">
                <span>
                  {formData.currentRole ||
                    user?.currentRole ||
                    'Technical Professional'}
                </span>
                {formData.location && (
                  <>
                    <span className="bullet">•</span>
                    <span>{formData.location}</span>
                  </>
                )}
                {user?.email && (
                  <>
                    <span className="bullet">•</span>
                    <span>{user.email}</span>
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Completeness Widget */}
          <div className="tw-completeness-card">
            <div className="tw-completeness-header">
              <span>Profile Strength</span>
              <span className="tw-completeness-pct">{completeness}%</span>
            </div>
            <div className="tw-completeness-bar-bg">
              <div
                className="tw-completeness-bar-fill"
                style={{ width: `${completeness}%` }}
              ></div>
            </div>
            <p className="tw-completeness-tip">
              {completeness === 100
                ? 'Your profile is fully optimized for top tier matches'
                : 'Complete all sections to maximize enterprise matching'}
            </p>
          </div>
        </div>

        {/* Key Metrics & Calibration Cards */}
        <div className="tw-metrics-grid">
          <div className="tw-metric-tile">
            <div className="tw-metric-icon-wrap green">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
              </svg>
            </div>
            <div className="tw-metric-details">
              <span className="tw-metric-label">AI Assessment Score</span>
              <div className="tw-metric-value" style={{ color: '#166534' }}>
                {user?.assessmentScore != null
                  ? `${user.assessmentScore}%`
                  : user?.vettingScore
                    ? `${user.vettingScore}% (Calibrated)`
                    : 'Pending Test'}
              </div>
              <div className="tw-metric-subtext">
                Validated technical aptitude
              </div>
            </div>
          </div>

          <div className="tw-metric-tile">
            <div className="tw-metric-icon-wrap blue">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <circle cx="12" cy="12" r="6"></circle>
                <circle cx="12" cy="12" r="2"></circle>
              </svg>
            </div>
            <div className="tw-metric-details">
              <span className="tw-metric-label">ATS Resume Match</span>
              <div className="tw-metric-value" style={{ color: '#2563EB' }}>
                {user?.fitScore != null
                  ? `${user.fitScore}% Match`
                  : 'Calculated on Submission'}
              </div>
              <div className="tw-metric-subtext">
                Benchmarked against job requisitions
              </div>
            </div>
          </div>

          <div className="tw-metric-tile">
            <div className="tw-metric-icon-wrap amber">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
              </svg>
            </div>
            <div className="tw-metric-details">
              <span className="tw-metric-label">Talent Availability</span>
              <div className="tw-metric-value" style={{ fontSize: '1rem' }}>
                <span
                  className="tw-badge-status tw-badge-applied"
                  style={{ fontSize: '0.82rem', padding: '0.3rem 0.75rem' }}
                >
                  {formData.workMode || user?.workMode || 'Full-Time Looking'}
                </span>
              </div>
              <div className="tw-metric-subtext">
                Immediate enterprise deployment mode
              </div>
            </div>
          </div>
        </div>

        {/* Smart Resume Parser Card */}
        <div
          className={`tw-resume-card ${isDragging ? 'drag-over' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={handleResumeChange}
            className="tw-resume-file-input"
            aria-label="Upload Resume for AI Auto-Fill"
          />

          <div className="tw-resume-content">
            <div className="tw-resume-icon-badge">
              <svg
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
            </div>

            {resumeFile ? (
              <div className="tw-uploaded-preview">
                <div className="tw-uploaded-file-info">
                  <div className="tw-uploaded-file-icon">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                    </svg>
                  </div>
                  <div>
                    <span className="tw-uploaded-name">{resumeFile.name}</span>
                    <span className="tw-uploaded-meta">
                      {(resumeFile.size / (1024 * 1024)).toFixed(2)} MB • Ready
                      &amp; Parsed
                    </span>
                  </div>
                </div>
                <span className="tw-replace-badge">Replace File</span>
              </div>
            ) : (
              <>
                <h3 className="tw-resume-title">
                  Upload Resume to Auto-Fill Profile Details
                </h3>
                <p className="tw-resume-subtitle">
                  Drop your updated document here or click to browse. Our AI
                  extracts your experience, skills, and links into the form
                  below.
                </p>
                <div className="tw-resume-tags-row">
                  <span className="tw-resume-pill">PDF</span>
                  <span className="tw-resume-pill">DOC</span>
                  <span className="tw-resume-pill">DOCX</span>
                  <span className="tw-resume-pill">Max 10MB</span>
                  <span className="tw-resume-sparkle-pill">
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                    </svg>
                    Instant AI Auto-Fill
                  </span>
                </div>
              </>
            )}

            {parsingResume && (
              <div className="tw-resume-alert parsing">
                <span className="tw-spinner"></span>
                <span>
                  Analyzing resume structure &amp; pre-filling attributes...
                </span>
              </div>
            )}

            {resumeNotice && !parsingResume && (
              <div className="tw-resume-alert success">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>{resumeNotice}</span>
              </div>
            )}

            {resumeError && (
              <div className="tw-resume-alert error">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <span>{resumeError}</span>
              </div>
            )}
          </div>
        </div>

        {/* Profile Edit Form */}
        <form onSubmit={handleSubmit} className="tw-profile-form">
          {/* Section 1: Personal & Contact Information */}
          <div className="tw-form-section">
            <div className="tw-section-header">
              <div className="tw-section-icon-box">
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
              </div>
              <div className="tw-section-title-wrap">
                <h2>1. Personal &amp; Contact Details</h2>
                <p>
                  Recruitment partners and hiring managers use this to contact
                  you for technical rounds.
                </p>
              </div>
            </div>

            <div className="tw-grid-3">
              <div className="tw-field">
                <label className="tw-field-label" htmlFor="prof-name">
                  Full Name <span className="req">*</span>
                </label>
                <div className="tw-field-input-box">
                  <span className="tw-input-icon">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                  </span>
                  <input
                    id="prof-name"
                    type="text"
                    name="name"
                    className="tw-input-control has-icon"
                    placeholder="e.g. Tanjil Alam"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="tw-field">
                <label className="tw-field-label" htmlFor="prof-email">
                  Registered Email Address
                </label>
                <div className="tw-field-input-box">
                  <span className="tw-input-icon">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                      <polyline points="22,6 12,13 2,6"></polyline>
                    </svg>
                  </span>
                  <input
                    id="prof-email"
                    type="email"
                    className="tw-input-control has-icon"
                    value={user?.email || 'Registered Candidate Email'}
                    readOnly
                    disabled
                    title="Account email address is locked for security"
                  />
                </div>
                <span className="tw-field-note">
                  Primary account login coordinate
                </span>
              </div>

              <div className="tw-field">
                <label className="tw-field-label" htmlFor="prof-phone">
                  Phone Number
                </label>
                <div className="tw-field-input-box">
                  <span className="tw-input-icon">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                    </svg>
                  </span>
                  <input
                    id="prof-phone"
                    type="tel"
                    name="phone"
                    className="tw-input-control has-icon"
                    placeholder="e.g. +91 8144891842"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Professional Background & Role */}
          <div className="tw-form-section">
            <div className="tw-section-header">
              <div className="tw-section-icon-box">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect
                    x="2"
                    y="7"
                    width="20"
                    height="14"
                    rx="2"
                    ry="2"
                  ></rect>
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                </svg>
              </div>
              <div className="tw-section-title-wrap">
                <h2>2. Professional Background &amp; Expectations</h2>
                <p>
                  Positions you for roles matching your seniority, location
                  preference, and rate.
                </p>
              </div>
            </div>

            <div className="tw-grid-2" style={{ marginBottom: '1.25rem' }}>
              <div className="tw-field">
                <label className="tw-field-label" htmlFor="prof-role">
                  Current Role / Title
                </label>
                <div className="tw-field-input-box">
                  <span className="tw-input-icon">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                  </span>
                  <input
                    id="prof-role"
                    type="text"
                    name="currentRole"
                    placeholder="e.g. Lead Full Stack Engineer"
                    className="tw-input-control has-icon"
                    value={formData.currentRole}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="tw-field">
                <label className="tw-field-label" htmlFor="prof-location">
                  Preferred Location / Work Arrangement
                </label>
                <div className="tw-field-input-box">
                  <span className="tw-input-icon">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                  </span>
                  <input
                    id="prof-location"
                    type="text"
                    name="location"
                    placeholder="e.g. Bhubaneswar, Odisha / Remote"
                    className="tw-input-control has-icon"
                    value={formData.location}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <div className="tw-grid-3">
              <div className="tw-field">
                <label className="tw-field-label" htmlFor="prof-exp">
                  Total Experience (Years)
                </label>
                <div className="tw-field-input-box">
                  <span className="tw-input-icon">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                  </span>
                  <input
                    id="prof-exp"
                    type="number"
                    min="0"
                    step="0.5"
                    name="experience"
                    className="tw-input-control has-icon"
                    value={formData.experience}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="tw-field">
                <label className="tw-field-label" htmlFor="prof-ctc">
                  Expected CTC / Retainer
                </label>
                <div className="tw-field-input-box">
                  <span className="tw-input-icon">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <line x1="12" y1="1" x2="12" y2="23"></line>
                      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                    </svg>
                  </span>
                  <input
                    id="prof-ctc"
                    type="text"
                    name="expectedSalary"
                    placeholder="e.g. ₹38 LPA or $120,000/yr"
                    className="tw-input-control has-icon"
                    value={formData.expectedSalary}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="tw-field">
                <label className="tw-field-label" htmlFor="prof-workmode">
                  Talent Availability / Bench Mode
                </label>
                <select
                  id="prof-workmode"
                  name="workMode"
                  className="tw-input-control"
                  value={formData.workMode}
                  onChange={handleChange}
                >
                  <option value="Full-Time Looking">Full-Time Looking</option>
                  <option value="Freelancer">Freelancer / Contractor</option>
                  <option value="On-Bench">
                    On-Bench (Immediate 48h Deployment)
                  </option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Key Technical Skills */}
          <div className="tw-form-section">
            <div className="tw-section-header">
              <div className="tw-section-icon-box">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="16 18 22 12 16 6"></polyline>
                  <polyline points="8 6 2 12 8 18"></polyline>
                </svg>
              </div>
              <div className="tw-section-title-wrap">
                <h2>3. Key Technical Skills &amp; Architecture</h2>
                <p>
                  Indexed by enterprise automated talent matching &amp; search
                  algorithms.
                </p>
              </div>
            </div>

            <div className="tw-field">
              <label className="tw-field-label" htmlFor="prof-skills">
                Key Technical Skills (Comma-separated)
              </label>
              <input
                id="prof-skills"
                type="text"
                name="technicalSkills"
                placeholder="e.g. React, Node.js, Go, Kubernetes, AWS, PostgreSQL, Kafka"
                className="tw-input-control"
                value={formData.technicalSkills}
                onChange={handleChange}
              />

              {/* Live Interactive Skill Badges */}
              {activeSkillsList.length > 0 && (
                <div className="tw-skills-preview-wrap">
                  <span className="tw-skills-label">
                    Parsed Skills ({activeSkillsList.length})
                  </span>
                  <div className="tw-skills-chip-list">
                    {activeSkillsList.map((skill, idx) => (
                      <span key={`${skill}-${idx}`} className="tw-skill-chip">
                        {skill}
                        <button
                          type="button"
                          className="tw-skill-chip-remove"
                          onClick={() => handleRemoveSkill(skill)}
                          title={`Remove ${skill}`}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Popular Skill Suggestions */}
              <div className="tw-popular-skills-row">
                <span>Suggested quick-add:</span>
                {POPULAR_SKILL_SUGGESTIONS.map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    className="tw-popular-skill-btn"
                    onClick={() => handleAddPopularSkill(sug)}
                  >
                    + {sug}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 4: Portfolios & Public Profiles */}
          <div className="tw-form-section">
            <div className="tw-section-header">
              <div className="tw-section-icon-box">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="2" y1="12" x2="22" y2="12"></line>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                </svg>
              </div>
              <div className="tw-section-title-wrap">
                <h2>4. Public Profiles &amp; Portfolios</h2>
                <p>
                  Help technical reviewers evaluate your open source
                  contributions and live work.
                </p>
              </div>
            </div>

            <div className="tw-grid-3">
              <div className="tw-field">
                <label className="tw-field-label" htmlFor="prof-linkedin">
                  LinkedIn Profile
                </label>
                <div className="tw-field-input-box">
                  <span className="tw-input-icon">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                      <rect x="2" y="9" width="4" height="12"></rect>
                      <circle cx="4" cy="4" r="2"></circle>
                    </svg>
                  </span>
                  <input
                    id="prof-linkedin"
                    type="url"
                    name="linkedinUrl"
                    placeholder="https://linkedin.com/in/username"
                    className="tw-input-control has-icon"
                    value={formData.linkedinUrl}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="tw-field">
                <label className="tw-field-label" htmlFor="prof-github">
                  GitHub Profile
                </label>
                <div className="tw-field-input-box">
                  <span className="tw-input-icon">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
                    </svg>
                  </span>
                  <input
                    id="prof-github"
                    type="url"
                    name="githubUrl"
                    placeholder="https://github.com/username"
                    className="tw-input-control has-icon"
                    value={formData.githubUrl}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="tw-field">
                <label className="tw-field-label" htmlFor="prof-portfolio">
                  Portfolio / Personal Site
                </label>
                <div className="tw-field-input-box">
                  <span className="tw-input-icon">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                    </svg>
                  </span>
                  <input
                    id="prof-portfolio"
                    type="url"
                    name="portfolioUrl"
                    placeholder="https://portfolio.dev"
                    className="tw-input-control has-icon"
                    value={formData.portfolioUrl}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 5: Professional Summary */}
          <div className="tw-form-section">
            <div className="tw-section-header">
              <div className="tw-section-icon-box">
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
              </div>
              <div className="tw-section-title-wrap">
                <h2>5. Executive Summary &amp; Specialization</h2>
                <p>
                  Highlight your high-scale systems experience, core domain
                  mastery, and leadership background.
                </p>
              </div>
            </div>

            <div className="tw-field">
              <label className="tw-field-label" htmlFor="prof-bio">
                Professional Bio &amp; Summary
              </label>
              <textarea
                id="prof-bio"
                name="bio"
                rows="4"
                className="tw-input-control"
                placeholder="Briefly describe your high-scale systems experience, engineering leadership, core domains, and specialized technical accomplishments."
                value={formData.bio}
                onChange={handleChange}
              />
              <span className="tw-field-note">
                Tip: 2-4 sentences summarizing your architectural philosophy and
                quantifiable impact.
              </span>
            </div>
          </div>

          {/* Action Footer Bar */}
          <div className="tw-form-actions-card">
            <div className="tw-form-actions-left">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#10B981"
                strokeWidth="2.5"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
              <span>
                {isDirty
                  ? 'You have unsaved changes in your profile.'
                  : 'Profile information is synchronized with recruitment database.'}
              </span>
            </div>

            <div className="tw-form-actions-right">
              {isDirty && (
                <button
                  type="button"
                  className="tw-btn-reset"
                  onClick={handleReset}
                  disabled={loading}
                >
                  Discard Changes
                </button>
              )}
              <button
                type="submit"
                className="tw-btn-save-profile"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="tw-spinner"></span>
                    <span>Saving Profile...</span>
                  </>
                ) : (
                  <>
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                      <polyline points="17 21 17 13 7 13 7 21"></polyline>
                      <polyline points="7 3 7 8 15 8"></polyline>
                    </svg>
                    <span>Save Profile Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Avatar Manager Modal */}
        <AvatarManagerModal
          isOpen={isAvatarModalOpen}
          onClose={() => setIsAvatarModalOpen(false)}
        />
      </main>

      <Footer />
    </div>
  );
};

export default CandidateProfilePage;
