import React, { useState, useRef, useEffect } from 'react';
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

  // Custom dropdown state
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const roleDropdownRef = useRef(null);

  const roleOptions = [
    { value: 'cloud-devops', label: 'Cloud & DevOps (AWS / GCP / K8s)' },
    { value: 'fullstack',    label: 'Full-Stack (React / Node / Python)' },
    { value: 'data-ai',     label: 'Data Engineering & AI / ML' },
    { value: 'sap-erp',     label: 'Enterprise ERP / SAP HANA' },
    { value: 'qa-auto',     label: 'QA & Test Automation' },
    { value: 'other',       label: 'Multiple Roles / Custom Squad' },
  ];

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutside = (e) => {
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(e.target)) {
        setIsRoleDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

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
                    <label htmlFor="roleNeeded-trigger">
                      Primary Tech Stack / Role <span className="req">*</span>
                    </label>

                    {/* Custom accessible dropdown */}
                    <div
                      className="StaffAug-customDropdown"
                      ref={roleDropdownRef}
                    >
                      {/* Trigger button */}
                      <button
                        id="roleNeeded-trigger"
                        type="button"
                        className={`StaffAug-dropdownTrigger${isRoleDropdownOpen ? ' StaffAug-dropdownTrigger--open' : ''}`}
                        aria-haspopup="listbox"
                        aria-expanded={isRoleDropdownOpen}
                        onClick={() => setIsRoleDropdownOpen((o) => !o)}
                      >
                        <span
                          className={
                            formData.roleNeeded
                              ? 'StaffAug-dropdownValue'
                              : 'StaffAug-dropdownPlaceholder'
                          }
                        >
                          {formData.roleNeeded
                            ? roleOptions.find(
                                (o) => o.value === formData.roleNeeded
                              )?.label
                            : 'Select required domain'}
                        </span>
                        {/* Chevron – rotates via CSS class */}
                        <svg
                          className={`StaffAug-dropdownChevron${isRoleDropdownOpen ? ' StaffAug-dropdownChevron--open' : ''}`}
                          width="14"
                          height="14"
                          viewBox="0 0 12 8"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <path d="m1 1 5 5 5-5" />
                        </svg>
                      </button>

                      {/* Options panel */}
                      {isRoleDropdownOpen && (
                        <ul
                          className="StaffAug-dropdownMenu"
                          role="listbox"
                          aria-label="Primary Tech Stack / Role"
                        >
                          {roleOptions.map((option) => {
                            const isSelected =
                              formData.roleNeeded === option.value;
                            return (
                              <li
                                key={option.value}
                                role="option"
                                aria-selected={isSelected}
                                className={`StaffAug-dropdownOption${isSelected ? ' StaffAug-dropdownOption--selected' : ''}`}
                                onMouseDown={() => {
                                  setFormData((prev) => ({
                                    ...prev,
                                    roleNeeded: option.value,
                                  }));
                                  setIsRoleDropdownOpen(false);
                                }}
                              >
                                <span>{option.label}</span>
                                {isSelected && (
                                  <svg
                                    width="14"
                                    height="14"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    aria-hidden="true"
                                  >
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      )}

                      {/* Hidden native select keeps form required-validation */}
                      <select
                        id="roleNeeded"
                        name="roleNeeded"
                        required
                        value={formData.roleNeeded}
                        onChange={handleChange}
                        tabIndex={-1}
                        aria-hidden="true"
                        style={{
                          position: 'absolute',
                          opacity: 0,
                          pointerEvents: 'none',
                          width: 0,
                          height: 0,
                        }}
                      >
                        <option value="" disabled />
                        {roleOptions.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
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
