import React, { useState, useEffect, useRef } from 'react';
import API_BASE from '../../utils/apiConfig';
import SkillTagInput from './SkillTagInput';
import './scopeCallModal.css';

/**
 * ScopeCallModal
 *
 * Enterprise requisition intake and consultation scheduler for high-growth engineering teams.
 * Captures project scope, headcount, timeline, and consultation preferences.
 * Adheres to WCAG AA accessibility with focus trapping and keyboard navigation.
 * Zero emojis.
 */
const ScopeCallModal = ({ isOpen, onClose }) => {
  const dialogRef = useRef(null);
  const firstInputRef = useRef(null);

  // Tomorrow's date formatted as YYYY-MM-DD for min date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDateStr = tomorrow.toISOString().split('T')[0];

  const initialFormState = {
    company: '',
    fullName: '',
    corporateEmail: '',
    phone: '',
    targetRole: 'Enterprise Engineering Squad',
    domain: 'Full Stack & Web',
    techStack: [],
    headcount: '3-5 Engineers (Core Squad)',
    deploymentUrgency: 'Immediate (Within 48h - Bench Pool)',
    consultationDate: defaultDateStr,
    consultationTime: 'Morning (09:00 - 12:00 IST / EST Overlap)',
    workArrangement: 'Remote (Global / Borderless)',
    scopeNotes: '',
  };

  const [formData, setFormData] = useState(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorBanner, setErrorBanner] = useState('');
  const [successData, setSuccessData] = useState(null);

  // Reset form when opened
  useEffect(() => {
    if (isOpen) {
      setErrorBanner('');
      setSuccessData(null);
      // Retain or reset form
      setTimeout(() => {
        firstInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Escape key and focus trap handler
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isSubmitting) {
        onClose();
        return;
      }

      // Focus trap
      if (e.key === 'Tab' && dialogRef.current) {
        const focusableElements = dialogRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement?.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement?.focus();
            e.preventDefault();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, isSubmitting]);

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errorBanner) setErrorBanner('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    // Validations
    if (!formData.company.trim()) {
      setErrorBanner('Company Name is required.');
      return;
    }
    if (!formData.fullName.trim()) {
      setErrorBanner('Full Name is required.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.corporateEmail.trim() || !emailRegex.test(formData.corporateEmail.trim())) {
      setErrorBanner('Please provide a valid corporate work email address.');
      return;
    }
    if (!formData.consultationDate) {
      setErrorBanner('Please select a preferred consultation date.');
      return;
    }

    setIsSubmitting(true);
    setErrorBanner('');

    const formattedSkills = Array.isArray(formData.techStack)
      ? formData.techStack.join(', ')
      : formData.techStack;

    const payload = {
      isScopingCall: true,
      requestType: 'scoping_call',
      domain: formData.domain,
      consultationDate: formData.consultationDate,
      consultationTime: formData.consultationTime,
      scopeNotes: formData.scopeNotes.trim(),
      engagementModel: `Enterprise Consultation: ${formData.domain}`,
      targetRole: formData.targetRole.trim() || 'Enterprise Engineering Squad',
      headcount: formData.headcount,
      seniority: 'Mid-Senior / Principal Lead',
      techStack: formattedSkills ? formattedSkills.split(',').map((s) => s.trim()) : [formData.domain],
      deploymentUrgency: formData.deploymentUrgency,
      workArrangement: formData.workArrangement,
      fullName: formData.fullName.trim(),
      corporateEmail: formData.corporateEmail.trim(),
      company: formData.company.trim(),
      phone: formData.phone.trim() || null,
      jobDescription: `[Scoping Call Request] Domain: ${formData.domain}. Consultation Slot: ${formData.consultationDate} (${formData.consultationTime}). Tech Stack: ${formattedSkills || 'General'}. Headcount: ${formData.headcount}. Urgency: ${formData.deploymentUrgency}. Scope Notes: ${formData.scopeNotes.trim() || 'Direct discussion during call.'}`,
    };

    try {
      const response = await fetch(`${API_BASE}/find-talent/requisition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const refId =
          data.requisition?.requisitionId ||
          data.bookingRef ||
          `TW-REQ-${Date.now().toString(36).toUpperCase()}`;
        setSuccessData({
          referenceId: refId,
          company: formData.company,
          email: formData.corporateEmail,
          date: formData.consultationDate,
          time: formData.consultationTime,
        });
      } else {
        setErrorBanner(data.error || 'Failed to submit scoping call request. Please try again.');
      }
    } catch {
      setErrorBanner('Network error connecting to intake server. Please try again or email enterprise@thinkwires.com.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !isSubmitting) {
      onClose();
    }
  };

  return (
    <div
      className="ScopeModal-overlay"
      onClick={handleBackdropClick}
      data-testid="scope-modal-overlay"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="scope-modal-title"
        className="ScopeModal-dialog"
      >
        {/* Header */}
        <div className="ScopeModal-header">
          <div className="ScopeModal-headerContent">
            <span className="ScopeModal-badge">
              <span className="material-symbols-outlined text-[14px]">business</span>
              <span>Enterprise Staffing</span>
            </span>
            <h2 id="scope-modal-title" className="ScopeModal-title">
              Schedule Technical Scoping Call
            </h2>
            <p className="ScopeModal-subtitle">
              Book a 20-minute consultation with our Staffing Directors to map squad requirements, evaluate bench talent, and define deployment timelines.
            </p>
          </div>
          <button
            type="button"
            className="ScopeModal-closeBtn"
            onClick={onClose}
            aria-label="Close scoping call modal"
            disabled={isSubmitting}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Content View: Success or Form */}
        {successData ? (
          <div className="ScopeModal-successView" data-testid="scope-modal-success">
            <div className="ScopeModal-successIcon">
              <span className="material-symbols-outlined text-[32px]">check_circle</span>
            </div>
            <h3 className="ScopeModal-successTitle">Scoping Call Confirmed</h3>
            <p className="ScopeModal-successText">
              Thank you, <strong>{formData.fullName}</strong>. A calendar invite for{' '}
              <strong>{successData.date}</strong> ({successData.time}) has been logged for{' '}
              <strong>{successData.company}</strong>.
            </p>
            <div className="ScopeModal-refBadge">
              <span>Reference Mandate ID:</span>
              <strong>{successData.referenceId}</strong>
            </div>
            <p className="ScopeModal-hint">
              Confirmation and agenda notes have been sent to <strong>{successData.email}</strong>. Our Technical Director will connect with pre-vetted profiles prior to the call.
            </p>
            <button
              type="button"
              className="ScopeModal-successCloseBtn"
              onClick={onClose}
            >
              Done &amp; Close
            </button>
          </div>
        ) : (
          <form className="ScopeModal-form" onSubmit={handleSubmit} noValidate>
            <div className="ScopeModal-body">
              {errorBanner && (
                <div className="ScopeModal-errorBanner" role="alert">
                  <span className="material-symbols-outlined text-[18px]">error</span>
                  <span>{errorBanner}</span>
                </div>
              )}

              {/* Company & Name */}
              <div className="ScopeModal-grid2">
                <div className="ScopeModal-field">
                  <label htmlFor="scope-company" className="ScopeModal-label">
                    <span>Company / Enterprise Name</span>
                    <span className="ScopeModal-required">*</span>
                  </label>
                  <input
                    ref={firstInputRef}
                    id="scope-company"
                    name="company"
                    type="text"
                    required
                    className="ScopeModal-input"
                    placeholder="e.g. Acme Corp / Global Scale"
                    value={formData.company}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="ScopeModal-field">
                  <label htmlFor="scope-full-name" className="ScopeModal-label">
                    <span>Contact Full Name</span>
                    <span className="ScopeModal-required">*</span>
                  </label>
                  <input
                    id="scope-full-name"
                    name="fullName"
                    type="text"
                    required
                    className="ScopeModal-input"
                    placeholder="e.g. Sarah Connor"
                    value={formData.fullName}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              {/* Email & Phone */}
              <div className="ScopeModal-grid2">
                <div className="ScopeModal-field">
                  <label htmlFor="scope-email" className="ScopeModal-label">
                    <span>Corporate Work Email</span>
                    <span className="ScopeModal-required">*</span>
                  </label>
                  <input
                    id="scope-email"
                    name="corporateEmail"
                    type="email"
                    required
                    className="ScopeModal-input"
                    placeholder="e.g. sarah@acme.com"
                    value={formData.corporateEmail}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="ScopeModal-field">
                  <label htmlFor="scope-phone" className="ScopeModal-label">
                    <span>Phone / WhatsApp</span>
                    <span className="ScopeModal-hint">(Optional)</span>
                  </label>
                  <input
                    id="scope-phone"
                    name="phone"
                    type="tel"
                    className="ScopeModal-input"
                    placeholder="e.g. +1 (555) 234-5678"
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              {/* Primary Domain & Target Role */}
              <div className="ScopeModal-grid2">
                <div className="ScopeModal-field">
                  <label htmlFor="scope-domain" className="ScopeModal-label">
                    <span>Primary Technical Domain</span>
                  </label>
                  <select
                    id="scope-domain"
                    name="domain"
                    className="ScopeModal-select"
                    value={formData.domain}
                    onChange={handleInputChange}
                  >
                    <option value="Full Stack & Web">Full Stack &amp; Web Systems</option>
                    <option value="AI & Machine Learning">AI &amp; Machine Learning / GenAI</option>
                    <option value="Cloud & DevOps">Cloud Infrastructure &amp; DevOps</option>
                    <option value="Enterprise Systems (SAP/AEM)">Enterprise Systems (SAP, Salesforce, AEM)</option>
                    <option value="Data & Analytics">Data Engineering &amp; Analytics</option>
                    <option value="Cybersecurity">Cybersecurity &amp; InfoSec</option>
                    <option value="Custom Squad">Cross-functional Dedicated Squad</option>
                  </select>
                </div>

                <div className="ScopeModal-field">
                  <label htmlFor="scope-target-role" className="ScopeModal-label">
                    <span>Target Role / Squad Mandate</span>
                  </label>
                  <input
                    id="scope-target-role"
                    name="targetRole"
                    type="text"
                    className="ScopeModal-input"
                    placeholder="e.g. Senior Backend / Distributed Systems"
                    value={formData.targetRole}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              {/* Target Tech Stack Autocomplete (Zero emojis, single-letter suggestions) */}
              <div className="ScopeModal-field">
                <SkillTagInput
                  id="scope-tech-stack"
                  label="Target Tech Stack & Key Skills"
                  value={formData.techStack}
                  onChange={(skills) =>
                    setFormData((prev) => ({ ...prev, techStack: skills }))
                  }
                  placeholder="Type a skill (e.g. React, Python, Go, Kubernetes, AWS)..."
                  maxTags={8}
                />
              </div>

              {/* Headcount & Deployment Timeline */}
              <div className="ScopeModal-grid2">
                <div className="ScopeModal-field">
                  <label htmlFor="scope-headcount" className="ScopeModal-label">
                    <span>Hiring Volume / Headcount</span>
                  </label>
                  <select
                    id="scope-headcount"
                    name="headcount"
                    className="ScopeModal-select"
                    value={formData.headcount}
                    onChange={handleInputChange}
                  >
                    <option value="1-2 Engineers (Tactical Fill)">1 - 2 Engineers (Tactical Fill)</option>
                    <option value="3-5 Engineers (Core Squad)">3 - 5 Engineers (Core Squad)</option>
                    <option value="6-10 Engineers (Pod Scaling)">6 - 10 Engineers (Pod Scaling)</option>
                    <option value="10+ Engineers (Enterprise Department)">10+ Engineers (Enterprise Department)</option>
                  </select>
                </div>

                <div className="ScopeModal-field">
                  <label htmlFor="scope-urgency" className="ScopeModal-label">
                    <span>Deployment Timeline</span>
                  </label>
                  <select
                    id="scope-urgency"
                    name="deploymentUrgency"
                    className="ScopeModal-select"
                    value={formData.deploymentUrgency}
                    onChange={handleInputChange}
                  >
                    <option value="Immediate (Within 48h - Bench Pool)">Immediate (Within 48h - Bench Pool)</option>
                    <option value="1 - 2 Weeks">1 - 2 Weeks</option>
                    <option value="Within 1 Month">Within 1 Month</option>
                    <option value="Planning / Next Quarter">Planning / Next Quarter</option>
                  </select>
                </div>
              </div>

              {/* Preferred Date & Time Slot */}
              <div className="ScopeModal-grid2">
                <div className="ScopeModal-field">
                  <label htmlFor="scope-date" className="ScopeModal-label">
                    <span>Preferred Consultation Date</span>
                    <span className="ScopeModal-required">*</span>
                  </label>
                  <input
                    id="scope-date"
                    name="consultationDate"
                    type="date"
                    required
                    min={defaultDateStr}
                    className="ScopeModal-input"
                    value={formData.consultationDate}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="ScopeModal-field">
                  <label htmlFor="scope-time" className="ScopeModal-label">
                    <span>Preferred Time Slot</span>
                  </label>
                  <select
                    id="scope-time"
                    name="consultationTime"
                    className="ScopeModal-select"
                    value={formData.consultationTime}
                    onChange={handleInputChange}
                  >
                    <option value="Morning (09:00 - 12:00 IST / EST Overlap)">Morning (09:00 - 12:00 IST / EST Overlap)</option>
                    <option value="Afternoon (12:00 - 16:00 IST)">Afternoon (12:00 - 16:00 IST)</option>
                    <option value="Evening (16:00 - 20:00 IST / US Morning)">Evening (16:00 - 20:00 IST / US Morning)</option>
                  </select>
                </div>
              </div>

              {/* Project Scope & Sprint Requirements */}
              <div className="ScopeModal-field">
                <label htmlFor="scope-notes" className="ScopeModal-label">
                  <span>Project Scope &amp; Engineering Constraints</span>
                  <span className="ScopeModal-hint">(Optional)</span>
                </label>
                <textarea
                  id="scope-notes"
                  name="scopeNotes"
                  className="ScopeModal-textarea"
                  placeholder="Outline sprint challenges, deliverables, tech constraints, or compliance requirements..."
                  value={formData.scopeNotes}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="ScopeModal-footer">
              <div className="ScopeModal-footerNote">
                <span className="material-symbols-outlined text-[16px]">lock</span>
                <span>Protected under Standard Enterprise NDA</span>
              </div>
              <div className="ScopeModal-footerActions">
                <button
                  type="button"
                  className="ScopeModal-cancelBtn"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="ScopeModal-submitBtn"
                  disabled={isSubmitting}
                  aria-label="Schedule Scoping Call"
                  data-testid="scope-modal-submit"
                >
                  {isSubmitting ? (
                    <>
                      <span className="ScopeModal-spinner" />
                      <span>Scheduling...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                      <span>Schedule Scoping Call</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ScopeCallModal;

