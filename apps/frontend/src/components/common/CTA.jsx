import API_BASE from '../../utils/apiConfig';
import React, { useState } from 'react';
import ApplyModal from './ApplyModal';

// API_BASE is imported from apiConfig

const CTA = () => {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState({
    loading: false,
    success: false,
    error: null,
  });
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !phone) return;

    setStatus({ loading: true, success: false, error: null });

    try {
      const response = await fetch(`${API_BASE}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, phone }),
      });

      if (response.ok) {
        setStatus({ loading: false, success: true, error: null });
        setEmail('');
        setPhone('');
      } else {
        const data = await response.json();
        setStatus({
          loading: false,
          success: false,
          error: data.error || 'Failed to submit',
        });
      }
    } catch {
      setStatus({
        loading: false,
        success: false,
        error: 'Network error. Please try again.',
      });
    }
  };

  return (
    <section className="CTA-section">
      <div className="CTA-container">
        {/* Employer Card */}
        <div className="CTA-card CTA-employerCard">
          <span className="CTA-employerTag">
            <span className="material-symbols-outlined text-[16px]">
              business_center
            </span>
            <span>For Enterprise Employers</span>
          </span>
          <h2 className="CTA-employerTitle">
            Need Scalable Engineering Squads?
          </h2>
          <p className="CTA-employerDesc">
            Book a 20-minute workforce consultation. We will audit your current
            sprint bottlenecks, match vetted candidates within 48 hours, and
            manage cross-border compliance.
          </p>

          <form className="CTA-form" onSubmit={handleSubmit}>
            {status.success && (
              <div className="CTA-successMsg">
                Callback requested successfully! A talent advisor will reach out
                shortly.
              </div>
            )}
            {status.error && <div className="CTA-errorMsg">{status.error}</div>}

            <div className="CTA-inputGroup">
              <input
                type="email"
                placeholder="Work Email"
                className="CTA-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <input
                type="tel"
                placeholder="Phone Number"
                className="CTA-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="CTA-submitBtn"
              disabled={status.loading}
            >
              {status.loading
                ? 'Submitting...'
                : 'Request Immediate Talent Callback'}
            </button>
          </form>

          <div className="CTA-footerNote">
            <span className="material-symbols-outlined text-[16px]">lock</span>
            <span>Guaranteed NDA &amp; Enterprise Security Standard</span>
          </div>
        </div>

        {/* Engineer Card */}
        <div className="CTA-card CTA-engineerCard">
          <span className="CTA-engineerTag">
            <span className="material-symbols-outlined text-[16px]">
              person
            </span>
            <span>For Software Engineers &amp; Leads</span>
          </span>
          <h2 className="CTA-engineerTitle">
            Accelerate Your Technical Career
          </h2>
          <p className="CTA-engineerDesc">
            Get matched directly with funded US/India startups and multinational
            enterprises. Transparent compensation, direct feedback, and rapid
            onboarding.
          </p>

          <div className="CTA-priorityBox">
            <div className="CTA-priorityHeader">
              <span className="CTA-priorityTitle">
                Priority Placement Network
              </span>
              <span className="CTA-activeIntake">Active Intake</span>
            </div>
            <p className="CTA-priorityDesc">
              Fast-track routing for SAP, Full Stack, AEM, and Cloud System
              Specialists.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsApplyModalOpen(true)}
            className="CTA-applyBtn"
          >
            <span className="material-symbols-outlined text-[20px]">
              upload_file
            </span>
            <span>Drop Resume / Quick Apply</span>
          </button>

          <div className="CTA-engineerFooterNote">
            <span className="material-symbols-outlined text-[16px]">
              verified
            </span>
            <span>
              Direct client interviews • Zero recruiter commission cut
            </span>
          </div>
        </div>
      </div>
      <ApplyModal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        roleTitle="General Engineering Candidate Pool"
      />
    </section>
  );
};

export default CTA;
