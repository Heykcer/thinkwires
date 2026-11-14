import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  submitPermanentStaffingConsultation,
  resetPermConsultationState,
} from '../../store/slices/permanentStaffingSlice';

const MANDATE_HIERARCHY_OPTIONS = [
  'C-Suite (CTO / CIO / CDO)',
  'Vice President / Head of Engineering',
  'Principal Architect / Director',
  'Enterprise ERP (SAP S/4HANA Practice)',
  'Permanent Core Engineering Team (5+)',
];

const TARGET_TIMELINE_OPTIONS = [
  'Immediate (Under 30 Days)',
  'Q1 Executive Strategic Plan',
  'Confidential Succession Replacement',
  'GCC Buildout (Quarterly Intake)',
];

const PermStaffConsultation = ({ data }) => {
  const dispatch = useDispatch();
  const { consultationStatus, consultationMessage, consultationError } =
    useSelector((state) => state.permanentStaffing || {});

  const [formData, setFormData] = useState({
    fullName: '',
    workEmail: '',
    companyName: '',
    directPhone: '',
    mandateHierarchy: 'C-Suite (CTO / CIO / CDO)',
    targetTimeline: 'Immediate (Under 30 Days)',
    mandateScope: '',
    isConfidential: true,
  });

  const [hierarchyOpen, setHierarchyOpen] = useState(false);
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [hierarchyHighlight, setHierarchyHighlight] = useState(-1);
  const [timelineHighlight, setTimelineHighlight] = useState(-1);

  const hierarchyRef = useRef(null);
  const timelineRef = useRef(null);
  const hierarchyTriggerRef = useRef(null);
  const timelineTriggerRef = useRef(null);

  // Close custom dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (hierarchyRef.current && !hierarchyRef.current.contains(e.target)) {
        setHierarchyOpen(false);
        setHierarchyHighlight(-1);
      }
      if (timelineRef.current && !timelineRef.current.contains(e.target)) {
        setTimelineOpen(false);
        setTimelineHighlight(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectHierarchy = (option) => {
    setFormData((prev) => ({ ...prev, mandateHierarchy: option }));
    setHierarchyOpen(false);
    setHierarchyHighlight(-1);
    if (hierarchyTriggerRef.current) {
      hierarchyTriggerRef.current.focus();
    }
  };

  const handleSelectTimeline = (option) => {
    setFormData((prev) => ({ ...prev, targetTimeline: option }));
    setTimelineOpen(false);
    setTimelineHighlight(-1);
    if (timelineTriggerRef.current) {
      timelineTriggerRef.current.focus();
    }
  };

  const handleHierarchyKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!hierarchyOpen) {
        setHierarchyOpen(true);
        const currIdx = MANDATE_HIERARCHY_OPTIONS.indexOf(formData.mandateHierarchy);
        setHierarchyHighlight(currIdx >= 0 ? currIdx : 0);
        return;
      }
      setHierarchyHighlight((prev) =>
        prev < MANDATE_HIERARCHY_OPTIONS.length - 1 ? prev + 1 : 0
      );
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!hierarchyOpen) {
        setHierarchyOpen(true);
        const currIdx = MANDATE_HIERARCHY_OPTIONS.indexOf(formData.mandateHierarchy);
        setHierarchyHighlight(
          currIdx >= 0 ? currIdx : MANDATE_HIERARCHY_OPTIONS.length - 1
        );
        return;
      }
      setHierarchyHighlight((prev) =>
        prev > 0 ? prev - 1 : MANDATE_HIERARCHY_OPTIONS.length - 1
      );
      return;
    }

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (
        hierarchyOpen &&
        hierarchyHighlight >= 0 &&
        MANDATE_HIERARCHY_OPTIONS[hierarchyHighlight]
      ) {
        handleSelectHierarchy(MANDATE_HIERARCHY_OPTIONS[hierarchyHighlight]);
      } else {
        setHierarchyOpen((prev) => !prev);
        const currIdx = MANDATE_HIERARCHY_OPTIONS.indexOf(formData.mandateHierarchy);
        setHierarchyHighlight(currIdx >= 0 ? currIdx : 0);
      }
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      setHierarchyOpen(false);
      setHierarchyHighlight(-1);
      return;
    }

    if (e.key === 'Tab') {
      setHierarchyOpen(false);
      setHierarchyHighlight(-1);
    }
  };

  const handleTimelineKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!timelineOpen) {
        setTimelineOpen(true);
        const currIdx = TARGET_TIMELINE_OPTIONS.indexOf(formData.targetTimeline);
        setTimelineHighlight(currIdx >= 0 ? currIdx : 0);
        return;
      }
      setTimelineHighlight((prev) =>
        prev < TARGET_TIMELINE_OPTIONS.length - 1 ? prev + 1 : 0
      );
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!timelineOpen) {
        setTimelineOpen(true);
        const currIdx = TARGET_TIMELINE_OPTIONS.indexOf(formData.targetTimeline);
        setTimelineHighlight(
          currIdx >= 0 ? currIdx : TARGET_TIMELINE_OPTIONS.length - 1
        );
        return;
      }
      setTimelineHighlight((prev) =>
        prev > 0 ? prev - 1 : TARGET_TIMELINE_OPTIONS.length - 1
      );
      return;
    }

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (
        timelineOpen &&
        timelineHighlight >= 0 &&
        TARGET_TIMELINE_OPTIONS[timelineHighlight]
      ) {
        handleSelectTimeline(TARGET_TIMELINE_OPTIONS[timelineHighlight]);
      } else {
        setTimelineOpen((prev) => !prev);
        const currIdx = TARGET_TIMELINE_OPTIONS.indexOf(formData.targetTimeline);
        setTimelineHighlight(currIdx >= 0 ? currIdx : 0);
      }
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      setTimelineOpen(false);
      setTimelineHighlight(-1);
      return;
    }

    if (e.key === 'Tab') {
      setTimelineOpen(false);
      setTimelineHighlight(-1);
    }
  };

  const handleChange = (e) => {
    const { id, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(submitPermanentStaffingConsultation(formData));
  };

  if (!data) return null;
  const {
    eyebrow,
    heading,
    description,
    hotline,
    hotlineAvailability,
    hubs = [],
    confidentialityNote,
  } = data;

  return (
    <section
      className="PermStaff-consultationSection"
      id="consultation-booking"
    >
      <div className="PermStaff-container">
        <div className="PermStaff-consultationCard">
          <div className="glow-effect"></div>
          <div className="consultation-grid">
            {/* Left: Hotline & Corporate Hubs */}
            <div className="consultation-left">
              <div>
                <div className="confidential-pill">
                  <span className="material-symbols-outlined">lock</span>
                  <span>{eyebrow || 'Confidential Mandate Desk'}</span>
                </div>
                <h2 className="consultation-title">
                  {heading || 'Initiate Executive Search Mandate'}
                </h2>
                <p className="consultation-desc">{description}</p>

                {/* Direct Partner Email Card */}
                <div className="hotline-card">
                  <div className="hl-top">
                    <span className="material-symbols-outlined">
                      mail
                    </span>
                    <span>Executive Mandate Inquiries</span>
                  </div>
                  <a
                    href="mailto:hr@thinkwires.com"
                    className="hl-phone"
                  >
                    hr@thinkwires.com
                  </a>
                  <p className="hl-note">
                    {hotlineAvailability ||
                      'Available 09:00 AM – 19:00 PM IST • Mon – Fri'}
                  </p>
                </div>

                {/* Hubs */}
                <div className="hubs-list">
                  {hubs.map((hub, idx) => (
                    <div key={idx} className="hub-item">
                      <span className="material-symbols-outlined">
                        {idx === 0 ? 'apartment' : 'public'}
                      </span>
                      <div>
                        <h4>{hub.title}</h4>
                        <p>{hub.address}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {confidentialityNote && (
                <div className="confidentiality-notice">
                  <span className="notice-label">
                    Confidentiality Guarantee
                  </span>
                  <p>{confidentialityNote}</p>
                </div>
              )}
            </div>

            {/* Right: Booking Form */}
            <div className="consultation-right">
              <h3 className="form-head">Book an Executive Consultation</h3>
              <p className="form-sub">
                Complete the brief below to receive a curated market comp
                analysis.
              </p>

              {consultationStatus === 'succeeded' ? (
                <div className="PermStaff-successCard">
                  <span className="material-symbols-outlined">verified</span>
                  <div>
                    <h4>Search Mandate Logged Confidentially</h4>
                    <p>
                      {consultationMessage ||
                        'A Managing Partner will reach out via secure channel within 2 business hours.'}
                    </p>
                    <button
                      type="button"
                      className="reset-btn"
                      onClick={() => {
                        dispatch(resetPermConsultationState());
                        setFormData({
                          fullName: '',
                          workEmail: '',
                          companyName: '',
                          directPhone: '',
                          mandateHierarchy: 'C-Suite (CTO / CIO / CDO)',
                          targetTimeline: 'Immediate (Under 30 Days)',
                          mandateScope: '',
                          isConfidential: true,
                        });
                        setHierarchyOpen(false);
                        setTimelineOpen(false);
                        setHierarchyHighlight(-1);
                        setTimelineHighlight(-1);
                      }}
                    >
                      Register Another Mandate
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="PermStaff-form">
                  <div className="form-row-2">
                    <div className="form-group">
                      <label htmlFor="fullName">Full Name *</label>
                      <input
                        type="text"
                        id="fullName"
                        required
                        placeholder="e.g. Vikramaditya Sharma"
                        value={formData.fullName}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="workEmail">Work Email *</label>
                      <input
                        type="email"
                        id="workEmail"
                        required
                        placeholder="v.sharma@enterprise.com"
                        value={formData.workEmail}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="form-row-2">
                    <div className="form-group">
                      <label htmlFor="companyName">
                        Company / Enterprise *
                      </label>
                      <input
                        type="text"
                        id="companyName"
                        required
                        placeholder="Enterprise Technologies Inc."
                        value={formData.companyName}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="directPhone">Direct Phone *</label>
                      <input
                        type="tel"
                        id="directPhone"
                        required
                        placeholder="+1 (415) 555-0192"
                        value={formData.directPhone}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="form-row-2">
                    <div className="form-group">
                      <label
                        id="mandateHierarchy-label"
                        htmlFor="mandateHierarchy-trigger"
                      >
                        Mandate Hierarchy *
                      </label>
                      <div
                        className="PermStaff-customSelectWrapper"
                        ref={hierarchyRef}
                      >
                        <button
                          type="button"
                          id="mandateHierarchy-trigger"
                          ref={hierarchyTriggerRef}
                          role="combobox"
                          aria-haspopup="listbox"
                          aria-expanded={hierarchyOpen}
                          aria-labelledby="mandateHierarchy-label mandateHierarchy-trigger"
                          aria-controls="mandateHierarchy-menu"
                          className={`PermStaff-customSelectTrigger ${
                            hierarchyOpen ? 'is-open' : ''
                          }`}
                          onClick={() => {
                            setHierarchyOpen((prev) => !prev);
                            setTimelineOpen(false);
                            const currIdx = MANDATE_HIERARCHY_OPTIONS.indexOf(
                              formData.mandateHierarchy
                            );
                            setHierarchyHighlight(currIdx >= 0 ? currIdx : 0);
                          }}
                          onKeyDown={handleHierarchyKeyDown}
                        >
                          <span className="PermStaff-customSelectValue">
                            {formData.mandateHierarchy}
                          </span>
                          <span
                            className={`material-symbols-outlined PermStaff-selectArrow ${
                              hierarchyOpen ? 'is-open' : ''
                            }`}
                            aria-hidden="true"
                          >
                            expand_more
                          </span>
                        </button>

                        <select
                          id="mandateHierarchy"
                          name="mandateHierarchy"
                          value={formData.mandateHierarchy}
                          onChange={handleChange}
                          className="PermStaff-hiddenSelect"
                          tabIndex={-1}
                          aria-hidden="true"
                        >
                          {MANDATE_HIERARCHY_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>

                        {hierarchyOpen && (
                          <ul
                            id="mandateHierarchy-menu"
                            role="listbox"
                            aria-labelledby="mandateHierarchy-label"
                            className="PermStaff-customSelectMenu"
                          >
                            {MANDATE_HIERARCHY_OPTIONS.map((opt, idx) => {
                              const isSelected =
                                formData.mandateHierarchy === opt;
                              const isHighlighted = idx === hierarchyHighlight;
                              return (
                                <li
                                  key={opt}
                                  role="option"
                                  aria-selected={isSelected}
                                  className={`PermStaff-customSelectOption ${
                                    isSelected ? 'is-selected' : ''
                                  } ${
                                    isHighlighted ? 'is-highlighted' : ''
                                  }`}
                                  onClick={() => handleSelectHierarchy(opt)}
                                  onMouseEnter={() =>
                                    setHierarchyHighlight(idx)
                                  }
                                >
                                  <span className="PermStaff-customSelectOptionText">
                                    {opt}
                                  </span>
                                  {isSelected && (
                                    <span
                                      className="material-symbols-outlined PermStaff-customSelectCheck"
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

                    <div className="form-group">
                      <label
                        id="targetTimeline-label"
                        htmlFor="targetTimeline-trigger"
                      >
                        Target Timeline *
                      </label>
                      <div
                        className="PermStaff-customSelectWrapper"
                        ref={timelineRef}
                      >
                        <button
                          type="button"
                          id="targetTimeline-trigger"
                          ref={timelineTriggerRef}
                          role="combobox"
                          aria-haspopup="listbox"
                          aria-expanded={timelineOpen}
                          aria-labelledby="targetTimeline-label targetTimeline-trigger"
                          aria-controls="targetTimeline-menu"
                          className={`PermStaff-customSelectTrigger ${
                            timelineOpen ? 'is-open' : ''
                          }`}
                          onClick={() => {
                            setTimelineOpen((prev) => !prev);
                            setHierarchyOpen(false);
                            const currIdx = TARGET_TIMELINE_OPTIONS.indexOf(
                              formData.targetTimeline
                            );
                            setTimelineHighlight(currIdx >= 0 ? currIdx : 0);
                          }}
                          onKeyDown={handleTimelineKeyDown}
                        >
                          <span className="PermStaff-customSelectValue">
                            {formData.targetTimeline}
                          </span>
                          <span
                            className={`material-symbols-outlined PermStaff-selectArrow ${
                              timelineOpen ? 'is-open' : ''
                            }`}
                            aria-hidden="true"
                          >
                            expand_more
                          </span>
                        </button>

                        <select
                          id="targetTimeline"
                          name="targetTimeline"
                          value={formData.targetTimeline}
                          onChange={handleChange}
                          className="PermStaff-hiddenSelect"
                          tabIndex={-1}
                          aria-hidden="true"
                        >
                          {TARGET_TIMELINE_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>

                        {timelineOpen && (
                          <ul
                            id="targetTimeline-menu"
                            role="listbox"
                            aria-labelledby="targetTimeline-label"
                            className="PermStaff-customSelectMenu"
                          >
                            {TARGET_TIMELINE_OPTIONS.map((opt, idx) => {
                              const isSelected =
                                formData.targetTimeline === opt;
                              const isHighlighted = idx === timelineHighlight;
                              return (
                                <li
                                  key={opt}
                                  role="option"
                                  aria-selected={isSelected}
                                  className={`PermStaff-customSelectOption ${
                                    isSelected ? 'is-selected' : ''
                                  } ${
                                    isHighlighted ? 'is-highlighted' : ''
                                  }`}
                                  onClick={() => handleSelectTimeline(opt)}
                                  onMouseEnter={() =>
                                    setTimelineHighlight(idx)
                                  }
                                >
                                  <span className="PermStaff-customSelectOptionText">
                                    {opt}
                                  </span>
                                  {isSelected && (
                                    <span
                                      className="material-symbols-outlined PermStaff-customSelectCheck"
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

                  <div className="form-group">
                    <label htmlFor="mandateScope">
                      Mandate Scope &amp; Tech Stack Objectives
                    </label>
                    <textarea
                      id="mandateScope"
                      rows="3"
                      placeholder="Outline specific leadership mandates, target headcount, tech requirements, or existing team roadblocks..."
                      value={formData.mandateScope}
                      onChange={handleChange}
                    ></textarea>
                  </div>

                  <div className="nda-checkbox-box">
                    <input
                      type="checkbox"
                      id="isConfidential"
                      checked={formData.isConfidential}
                      onChange={handleChange}
                    />
                    <label htmlFor="isConfidential">
                      <strong>Strict NDA Confidential Mandate:</strong> Do not
                      publish this search requirement publicly. Require
                      candidate pre-screening NDA before identity disclosure.
                    </label>
                  </div>

                  {consultationError && (
                    <div className="PermStaff-errorMsg">
                      {consultationError}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="submit-mandate-btn"
                    disabled={consultationStatus === 'loading'}
                  >
                    <span className="material-symbols-outlined">send</span>
                    <span>
                      {consultationStatus === 'loading'
                        ? 'Registering Mandate...'
                        : 'Submit Confidential Mandate & Request Partner Call'}
                    </span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PermStaffConsultation;
