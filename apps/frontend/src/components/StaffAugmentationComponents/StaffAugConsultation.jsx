import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  submitStaffAugmentationConsultation,
  resetConsultationState,
} from '../../store/slices/staffAugmentationSlice';

const StaffAugConsultation = ({ data }) => {
  const dispatch = useDispatch();
  const { consultationStatus, consultationMessage, consultationError } =
    useSelector((state) => state.staffAugmentation || {});

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    roleNeeded: '',
    preferredTime: '',
    details: '',
  });

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(submitStaffAugmentationConsultation(formData));
  };

  if (!data) return null;
  const { eyebrow, heading, description, hotline, hubs, sla, certifications } =
    data;

  return (
    <section className="StaffAug-consultationSection" id="consultation-form">
      <div className="StaffAug-container">
        <div className="StaffAug-consultationGrid">
          {/* Left: Contact Points */}
          <div className="StaffAug-contactCol">
            <div>
              <span className="channel-badge">
                {eyebrow || 'Direct Channel'}
              </span>
              <h3 className="contact-title">
                {heading || 'Schedule a Workforce Strategy Call'}
              </h3>
              <p className="contact-desc">{description}</p>

              <div className="contact-points">
                <div className="point-item">
                  <span className="material-symbols-outlined emerald">
                    timer
                  </span>
                  <div>
                    <h4 className="point-head">
                      {sla || '5-Hour Response SLA'}
                    </h4>
                    <p className="point-sub">
                      A specialist reviews your requirements and responds within
                      5 business hours.
                    </p>
                  </div>
                </div>

                <div className="point-item">
                  <span className="material-symbols-outlined cobalt">
                    location_on
                  </span>
                  <div>
                    <h4 className="point-head">Global Tech Hubs</h4>
                    <p className="point-sub">{hubs}</p>
                  </div>
                </div>

                <div className="point-item">
                  <span className="material-symbols-outlined emerald">
                    mail
                  </span>
                  <div>
                    <h4 className="point-head">Advisory &amp; Talent Desk</h4>
                    <a
                      href="mailto:hr@thinkwires.com"
                      className="hotline-link"
                    >
                      hr@thinkwires.com
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="contact-footer">
              {certifications ||
                'ISO 27001 • SOC 2 Type II Compliant • 100% NDA Protection Prior to Discussion'}
            </div>
          </div>

          {/* Right: Form */}
          <div className="StaffAug-formCol">
            {consultationStatus === 'succeeded' ? (
              <div className="StaffAug-successCard">
                <span className="material-symbols-outlined success-icon">
                  check_circle
                </span>
                <h3>Workforce Consultation Requested</h3>
                <p>
                  {consultationMessage ||
                    'Thank you! A Senior Talent Architect will reach out within 5 hours.'}
                </p>
                <button
                  type="button"
                  className="reset-btn"
                  onClick={() => {
                    dispatch(resetConsultationState());
                    setFormData({
                      name: '',
                      email: '',
                      phone: '',
                      company: '',
                      roleNeeded: '',
                      preferredTime: '',
                      details: '',
                    });
                  }}
                >
                  Submit Another Request
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="StaffAug-form">
                <div className="form-row-2">
                  <div className="form-group">
                    <label htmlFor="name">
                      Full Name <span className="req">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      required
                      placeholder="e.g. Sarah Jenkins"
                      value={formData.name}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="email">
                      Work Email <span className="req">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      required
                      placeholder="s.jenkins@company.com"
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="form-row-2">
                  <div className="form-group">
                    <label htmlFor="phone">
                      Contact Number <span className="req">*</span>
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      required
                      placeholder="+1 (555) 000-0000"
                      value={formData.phone}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="company">
                      Company Name <span className="req">*</span>
                    </label>
                    <input
                      type="text"
                      id="company"
                      required
                      placeholder="Acme Corp"
                      value={formData.company}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="form-row-2">
                  <div className="form-group">
                    <label htmlFor="roleNeeded">
                      Primary Tech Stack / Role <span className="req">*</span>
                    </label>
                    <div className="StaffAug-selectWrapper">
                      <select
                        id="roleNeeded"
                        required
                        value={formData.roleNeeded}
                        onChange={handleChange}
                        className="StaffAug-styledSelect"
                      >
                        <option value="" disabled>
                          Select required domain
                        </option>
                        <option value="cloud-devops">
                          Cloud &amp; DevOps (AWS / GCP / K8s)
                        </option>
                        <option value="fullstack">
                          Full-Stack (React / Node / Python)
                        </option>
                        <option value="data-ai">
                          Data Engineering &amp; AI / ML
                        </option>
                        <option value="sap-erp">Enterprise ERP / SAP HANA</option>
                        <option value="qa-auto">QA &amp; Test Automation</option>
                        <option value="other">
                          Multiple Roles / Custom Squad
                        </option>
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label htmlFor="preferredTime">
                      Preferred Date &amp; Time <span className="req">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      id="preferredTime"
                      required
                      value={formData.preferredTime}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="details">
                    Project Scope or Headcount Requirements (Optional)
                  </label>
                  <textarea
                    id="details"
                    rows="3"
                    placeholder="Mention number of developers needed, target start date, or specific timezone overlap requirements..."
                    value={formData.details}
                    onChange={handleChange}
                  ></textarea>
                </div>

                {consultationError && (
                  <div className="StaffAug-errorMsg">{consultationError}</div>
                )}

                <div className="form-footer">
                  <span className="no-risk">
                    No credit card or upfront commitment required.
                  </span>
                  <button
                    type="submit"
                    className="submit-btn"
                    disabled={consultationStatus === 'loading'}
                  >
                    <span>
                      {consultationStatus === 'loading'
                        ? 'Scheduling...'
                        : 'Schedule Call Now'}
                    </span>
                    <span className="material-symbols-outlined">
                      arrow_forward
                    </span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default StaffAugConsultation;
