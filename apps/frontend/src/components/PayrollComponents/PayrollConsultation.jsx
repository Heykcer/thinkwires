import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  submitPayrollConsultation,
  resetSubmitStatus,
} from '../../store/slices/payrollSlice';

const EMPLOYEE_SIZE_OPTIONS = [
  { value: '1-10', label: '1-10 employees' },
  { value: '11-50', label: '11-50 employees' },
  { value: '51-200', label: '51-200 employees' },
  { value: '201-500', label: '201-500 employees' },
  { value: '500+', label: '500+ employees' },
];

const SERVICE_REQUIRED_OPTIONS = [
  { value: 'Payroll Outsourcing', label: 'Payroll Outsourcing' },
  { value: 'Staff Augmentation', label: 'Staff Augmentation' },
  { value: 'Employer of Record', label: 'Employer of Record (EOR)' },
  { value: 'Permanent Staffing', label: 'Permanent Staffing & Executive Search' },
  { value: 'Other', label: 'Other Advisory Services' },
];

const PayrollConsultation = ({ data }) => {
  const dispatch = useDispatch();
  const { submitStatus, submitMessage } = useSelector(
    (state) => state.payroll || {}
  );

  const [form, setForm] = useState({
    companyName: '',
    fullName: '',
    employeeSize: '',
    serviceReq: 'Payroll Outsourcing',
    phoneNumber: '',
    emailAddress: '',
  });

  const [sizeOpen, setSizeOpen] = useState(false);
  const [serviceOpen, setServiceOpen] = useState(false);
  const [sizeHighlight, setSizeHighlight] = useState(-1);
  const [serviceHighlight, setServiceHighlight] = useState(-1);

  const sizeRef = useRef(null);
  const serviceRef = useRef(null);
  const sizeTriggerRef = useRef(null);
  const serviceTriggerRef = useRef(null);

  // Close custom dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (sizeRef.current && !sizeRef.current.contains(e.target)) {
        setSizeOpen(false);
        setSizeHighlight(-1);
      }
      if (serviceRef.current && !serviceRef.current.contains(e.target)) {
        setServiceOpen(false);
        setServiceHighlight(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectSize = (val) => {
    setForm((prev) => ({ ...prev, employeeSize: val }));
    setSizeOpen(false);
    setSizeHighlight(-1);
    if (sizeTriggerRef.current) {
      sizeTriggerRef.current.focus();
    }
  };

  const handleSelectService = (val) => {
    setForm((prev) => ({ ...prev, serviceReq: val }));
    setServiceOpen(false);
    setServiceHighlight(-1);
    if (serviceTriggerRef.current) {
      serviceTriggerRef.current.focus();
    }
  };

  const handleSizeKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!sizeOpen) {
        setSizeOpen(true);
        const currIdx = EMPLOYEE_SIZE_OPTIONS.findIndex(
          (opt) => opt.value === form.employeeSize
        );
        setSizeHighlight(currIdx >= 0 ? currIdx : 0);
        return;
      }
      setSizeHighlight((prev) =>
        prev < EMPLOYEE_SIZE_OPTIONS.length - 1 ? prev + 1 : 0
      );
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!sizeOpen) {
        setSizeOpen(true);
        const currIdx = EMPLOYEE_SIZE_OPTIONS.findIndex(
          (opt) => opt.value === form.employeeSize
        );
        setSizeHighlight(
          currIdx >= 0 ? currIdx : EMPLOYEE_SIZE_OPTIONS.length - 1
        );
        return;
      }
      setSizeHighlight((prev) =>
        prev > 0 ? prev - 1 : EMPLOYEE_SIZE_OPTIONS.length - 1
      );
      return;
    }

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (
        sizeOpen &&
        sizeHighlight >= 0 &&
        EMPLOYEE_SIZE_OPTIONS[sizeHighlight]
      ) {
        handleSelectSize(EMPLOYEE_SIZE_OPTIONS[sizeHighlight].value);
      } else {
        setSizeOpen((prev) => !prev);
        const currIdx = EMPLOYEE_SIZE_OPTIONS.findIndex(
          (opt) => opt.value === form.employeeSize
        );
        setSizeHighlight(currIdx >= 0 ? currIdx : 0);
      }
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      setSizeOpen(false);
      setSizeHighlight(-1);
      return;
    }

    if (e.key === 'Tab') {
      setSizeOpen(false);
      setSizeHighlight(-1);
    }
  };

  const handleServiceKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!serviceOpen) {
        setServiceOpen(true);
        const currIdx = SERVICE_REQUIRED_OPTIONS.findIndex(
          (opt) => opt.value === form.serviceReq
        );
        setServiceHighlight(currIdx >= 0 ? currIdx : 0);
        return;
      }
      setServiceHighlight((prev) =>
        prev < SERVICE_REQUIRED_OPTIONS.length - 1 ? prev + 1 : 0
      );
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!serviceOpen) {
        setServiceOpen(true);
        const currIdx = SERVICE_REQUIRED_OPTIONS.findIndex(
          (opt) => opt.value === form.serviceReq
        );
        setServiceHighlight(
          currIdx >= 0 ? currIdx : SERVICE_REQUIRED_OPTIONS.length - 1
        );
        return;
      }
      setServiceHighlight((prev) =>
        prev > 0 ? prev - 1 : SERVICE_REQUIRED_OPTIONS.length - 1
      );
      return;
    }

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (
        serviceOpen &&
        serviceHighlight >= 0 &&
        SERVICE_REQUIRED_OPTIONS[serviceHighlight]
      ) {
        handleSelectService(SERVICE_REQUIRED_OPTIONS[serviceHighlight].value);
      } else {
        setServiceOpen((prev) => !prev);
        const currIdx = SERVICE_REQUIRED_OPTIONS.findIndex(
          (opt) => opt.value === form.serviceReq
        );
        setServiceHighlight(currIdx >= 0 ? currIdx : 0);
      }
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      setServiceOpen(false);
      setServiceHighlight(-1);
      return;
    }

    if (e.key === 'Tab') {
      setServiceOpen(false);
      setServiceHighlight(-1);
    }
  };

  if (!data) return null;
  const { eyebrow, heading, description, hqDetails = {} } = data;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(submitPayrollConsultation(form));
  };

  return (
    <section
      className="Payroll-sectionShell"
      id="consultation-form"
      style={{ backgroundColor: 'var(--color-surface-container-low, #f3f2fe)' }}
    >
      <div className="Payroll-sectionContainer">
        <div className="Payroll-consultationGrid">
          {/* Left: HQ Details */}
          <div>
            <span className="Payroll-sectionEyebrow emerald">{eyebrow}</span>
            <h2 className="Payroll-sectionTitle">{heading}</h2>
            <p className="Payroll-sectionDesc">{description}</p>

            <div className="Payroll-hqCard">
              <h3 className="Payroll-hqTitle">{hqDetails.title}</h3>

              <div className="Payroll-hqItem">
                <span
                  className="material-symbols-outlined text-primary"
                  style={{ fontSize: '20px' }}
                >
                  location_on
                </span>
                <div>
                  <strong>Noida Corporate Campus</strong>
                  <span>{hqDetails.address}</span>
                </div>
              </div>

              <div className="Payroll-hqItem">
                <span
                  className="material-symbols-outlined text-primary"
                  style={{ fontSize: '20px' }}
                >
                  mail
                </span>
                <div>
                  <strong>Direct Operations & HR Desk</strong>
                  <a
                    href={`mailto:${hqDetails.email || 'hr@thinkwires.com'}`}
                    style={{
                      color: 'var(--color-primary, #0037b0)',
                      fontWeight: 700,
                    }}
                  >
                    {hqDetails.email || 'hr@thinkwires.com'}
                  </a>
                </div>
              </div>

              <div className="Payroll-hqItem">
                <span
                  className="material-symbols-outlined text-primary"
                  style={{ fontSize: '20px' }}
                >
                  schedule
                </span>
                <div>
                  <strong>Operations Window</strong>
                  <span>{hqDetails.hours}</span>
                </div>
              </div>

              <div
                style={{
                  paddingTop: '1rem',
                  borderTop: '1px solid var(--color-card-stroke, #e2e8f0)',
                }}
              >
                <div
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'var(--color-outline, #747686)',
                    marginBottom: '0.5rem',
                  }}
                >
                  Cross-Border Operations
                </div>
                <div
                  style={{
                    display: 'flex',
                    gap: '1rem',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                  }}
                >
                  {(hqDetails.regions || []).map((reg, i) => (
                    <span
                      key={i}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                      }}
                    >
                      <span
                        className="Payroll-bulletDot"
                        style={{
                          backgroundColor:
                            'var(--color-emerald-accent, #22c55e)',
                        }}
                      ></span>
                      {reg}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Interactive Consultation Form */}
          <div className="Payroll-formCard">
            <h3
              style={{
                fontSize: '1.5rem',
                fontWeight: 800,
                color: 'var(--color-navy-dark, #0f172a)',
                margin: '0 0 0.5rem 0',
              }}
            >
              Request Free Consultation
            </h3>
            <p
              style={{
                fontSize: '0.875rem',
                color: 'var(--color-on-surface-variant, #434655)',
                margin: '0 0 1.75rem 0',
              }}
            >
              Fill out the parameters below and a Senior Payroll Solutions
              Architect will prepare a customized compliance evaluation within 2
              hours.
            </p>

            <form
              onSubmit={handleSubmit}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem',
              }}
            >
              <div className="Payroll-formRowGrid">
                <div className="Payroll-formField">
                  <label className="Payroll-formLabel" htmlFor="companyName">
                    Company Name *
                  </label>
                  <div className="Payroll-inputWrapper">
                    <span className="material-symbols-outlined Payroll-inputIcon">
                      business
                    </span>
                    <input
                      className="Payroll-input"
                      id="companyName"
                      name="companyName"
                      placeholder="e.g. Acme Technologies Corp"
                      required
                      value={form.companyName}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="Payroll-formField">
                  <label className="Payroll-formLabel" htmlFor="fullName">
                    Full Name *
                  </label>
                  <div className="Payroll-inputWrapper">
                    <span className="material-symbols-outlined Payroll-inputIcon">
                      person
                    </span>
                    <input
                      className="Payroll-input"
                      id="fullName"
                      name="fullName"
                      placeholder="e.g. Alex Morgan"
                      required
                      value={form.fullName}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              <div className="Payroll-formRowGrid">
                <div className="Payroll-formField">
                  <label
                    className="Payroll-formLabel"
                    id="employeeSize-label"
                    htmlFor="employeeSize-trigger"
                  >
                    Employee Size *
                  </label>
                  <div
                    className="Payroll-inputWrapper Payroll-customSelectWrapper"
                    ref={sizeRef}
                  >
                    <span className="material-symbols-outlined Payroll-inputIcon">
                      groups
                    </span>
                    <button
                      type="button"
                      id="employeeSize-trigger"
                      ref={sizeTriggerRef}
                      role="combobox"
                      aria-haspopup="listbox"
                      aria-expanded={sizeOpen}
                      aria-labelledby="employeeSize-label employeeSize-trigger"
                      aria-controls="employeeSize-menu"
                      className={`Payroll-customSelectTrigger ${
                        sizeOpen ? 'is-open' : ''
                      }`}
                      onClick={() => {
                        setSizeOpen((prev) => !prev);
                        setServiceOpen(false);
                        const currIdx = EMPLOYEE_SIZE_OPTIONS.findIndex(
                          (opt) => opt.value === form.employeeSize
                        );
                        setSizeHighlight(currIdx >= 0 ? currIdx : 0);
                      }}
                      onKeyDown={handleSizeKeyDown}
                    >
                      <span
                        className={`Payroll-customSelectValue ${
                          !form.employeeSize ? 'is-placeholder' : ''
                        }`}
                      >
                        {EMPLOYEE_SIZE_OPTIONS.find(
                          (opt) => opt.value === form.employeeSize
                        )?.label || 'Select employee size'}
                      </span>
                      <span
                        className={`material-symbols-outlined Payroll-selectArrow ${
                          sizeOpen ? 'is-open' : ''
                        }`}
                        aria-hidden="true"
                      >
                        expand_more
                      </span>
                    </button>

                    <select
                      className="sr-only"
                      id="employeeSize"
                      name="employeeSize"
                      required
                      value={form.employeeSize}
                      onChange={handleChange}
                      tabIndex={-1}
                      aria-hidden="true"
                    >
                      <option value="" disabled>
                        Select employee size
                      </option>
                      {EMPLOYEE_SIZE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>

                    {sizeOpen && (
                      <ul
                        id="employeeSize-menu"
                        role="listbox"
                        aria-labelledby="employeeSize-label"
                        className="Payroll-customSelectMenu"
                      >
                        {EMPLOYEE_SIZE_OPTIONS.map((opt, idx) => {
                          const isSelected = form.employeeSize === opt.value;
                          const isHighlighted = idx === sizeHighlight;
                          return (
                            <li
                              key={opt.value}
                              role="option"
                              aria-selected={isSelected}
                              className={`Payroll-customSelectOption ${
                                isSelected ? 'is-selected' : ''
                              } ${isHighlighted ? 'is-highlighted' : ''}`}
                              onClick={() => handleSelectSize(opt.value)}
                              onMouseEnter={() => setSizeHighlight(idx)}
                            >
                              <span className="Payroll-customSelectOptionText">
                                {opt.label}
                              </span>
                              {isSelected && (
                                <span
                                  className="material-symbols-outlined Payroll-customSelectCheck"
                                  aria-hidden="true"
                                >
                                  check
                                </span>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </div>

                <div className="Payroll-formField">
                  <label
                    className="Payroll-formLabel"
                    id="serviceReq-label"
                    htmlFor="serviceReq-trigger"
                  >
                    Service Required *
                  </label>
                  <div
                    className="Payroll-inputWrapper Payroll-customSelectWrapper"
                    ref={serviceRef}
                  >
                    <span className="material-symbols-outlined Payroll-inputIcon">
                      mobile_arrow_right
                    </span>
                    <button
                      type="button"
                      id="serviceReq-trigger"
                      ref={serviceTriggerRef}
                      role="combobox"
                      aria-haspopup="listbox"
                      aria-expanded={serviceOpen}
                      aria-labelledby="serviceReq-label serviceReq-trigger"
                      aria-controls="serviceReq-menu"
                      className={`Payroll-customSelectTrigger ${
                        serviceOpen ? 'is-open' : ''
                      }`}
                      onClick={() => {
                        setServiceOpen((prev) => !prev);
                        setSizeOpen(false);
                        const currIdx = SERVICE_REQUIRED_OPTIONS.findIndex(
                          (opt) => opt.value === form.serviceReq
                        );
                        setServiceHighlight(currIdx >= 0 ? currIdx : 0);
                      }}
                      onKeyDown={handleServiceKeyDown}
                    >
                      <span className="Payroll-customSelectValue">
                        {SERVICE_REQUIRED_OPTIONS.find(
                          (opt) => opt.value === form.serviceReq
                        )?.label || form.serviceReq}
                      </span>
                      <span
                        className={`material-symbols-outlined Payroll-selectArrow ${
                          serviceOpen ? 'is-open' : ''
                        }`}
                        aria-hidden="true"
                      >
                        expand_more
                      </span>
                    </button>

                    <select
                      className="sr-only"
                      id="serviceReq"
                      name="serviceReq"
                      required
                      value={form.serviceReq}
                      onChange={handleChange}
                      tabIndex={-1}
                      aria-hidden="true"
                    >
                      {SERVICE_REQUIRED_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>

                    {serviceOpen && (
                      <ul
                        id="serviceReq-menu"
                        role="listbox"
                        aria-labelledby="serviceReq-label"
                        className="Payroll-customSelectMenu"
                      >
                        {SERVICE_REQUIRED_OPTIONS.map((opt, idx) => {
                          const isSelected = form.serviceReq === opt.value;
                          const isHighlighted = idx === serviceHighlight;
                          return (
                            <li
                              key={opt.value}
                              role="option"
                              aria-selected={isSelected}
                              className={`Payroll-customSelectOption ${
                                isSelected ? 'is-selected' : ''
                              } ${isHighlighted ? 'is-highlighted' : ''}`}
                              onClick={() => handleSelectService(opt.value)}
                              onMouseEnter={() => setServiceHighlight(idx)}
                            >
                              <span className="Payroll-customSelectOptionText">
                                {opt.label}
                              </span>
                              {isSelected && (
                                <span
                                  className="material-symbols-outlined Payroll-customSelectCheck"
                                  aria-hidden="true"
                                >
                                  check
                                </span>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </div>
              </div>

              <div className="Payroll-formRowGrid">
                <div className="Payroll-formField">
                  <label className="Payroll-formLabel" htmlFor="phoneNumber">
                    Phone Number *
                  </label>
                  <div className="Payroll-inputWrapper">
                    <span className="material-symbols-outlined Payroll-inputIcon">
                      call
                    </span>
                    <input
                      className="Payroll-input"
                      id="phoneNumber"
                      name="phoneNumber"
                      placeholder="+91 98765 43210"
                      required
                      type="tel"
                      value={form.phoneNumber}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="Payroll-formField">
                  <label className="Payroll-formLabel" htmlFor="emailAddress">
                    Work Email ID *
                  </label>
                  <div className="Payroll-inputWrapper">
                    <span className="material-symbols-outlined Payroll-inputIcon">
                      mail
                    </span>
                    <input
                      className="Payroll-input"
                      id="emailAddress"
                      name="emailAddress"
                      placeholder="alex@company.com"
                      required
                      type="email"
                      value={form.emailAddress}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="Payroll-formSubmitBtn"
                disabled={submitStatus === 'loading'}
              >
                <span>
                  {submitStatus === 'loading'
                    ? 'Submitting...'
                    : 'Get Free Consultation'}
                </span>
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: '20px' }}
                >
                  arrow_forward
                </span>
              </button>

              {submitStatus === 'succeeded' && (
                <div className="Payroll-successBanner">
                  <span
                    className="material-symbols-outlined text-emerald-accent"
                    style={{ fontSize: '24px' }}
                  >
                    verified
                  </span>
                  <span>
                    {submitMessage ||
                      'Thank you! Your request is queued. Our compliance lead will call within 120 minutes.'}
                  </span>
                </div>
              )}

              {submitStatus === 'failed' && (
                <div
                  className="Payroll-errorBanner"
                  role="alert"
                  aria-live="assertive"
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: '24px' }}
                  >
                    error
                  </span>
                  <span>
                    {submitMessage ||
                      'Submission failed. Please check your details and try again.'}
                  </span>
                </div>
              )}

              <div
                style={{
                  textAlign: 'center',
                  fontSize: '0.75rem',
                  color: 'var(--color-outline, #747686)',
                  marginTop: '0.5rem',
                }}
              >
                Protected by Enterprise SLA NDA • Zero obligation • ISO 27001
                Data Privacy Guaranteed
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PayrollConsultation;
