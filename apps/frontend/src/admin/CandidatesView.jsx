import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { adminApi } from './adminService';
import {
  PlusIcon,
  EyeIcon,
  TrashIcon,
  CloseIcon,
  AlertCircleIcon,
} from './AdminIcons';
import CandidateEvaluationModal from './CandidateEvaluationModal';

const PIPELINE_STAGES = [
  'Applied',
  'Screening',
  'Interview',
  'Offered',
  'Hired',
  'Rejected',
];

const CandidatesView = () => {
  const { showToast, activeRole } = useOutletContext();
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedStage, setSelectedStage] = useState('All');
  const [viewMode, setViewMode] = useState('pipeline'); // 'pipeline' | 'table'

  // Modals & Drawers
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [evaluationModalCandidateId, setEvaluationModalCandidateId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    currentRole: 'Senior Software Engineer',
    technicalSkills: '',
    experience: 5,
    expectedSalary: '₹28 LPA / $55k',
    status: 'Applied',
    jobTitle: 'Lead Full Stack & Frontend Engineer',
    notes: '',
  });

  const [formError, setFormError] = useState('');

  const fetchCandidates = () => {
    setLoading(true);
    adminApi
      .getCandidates({ search, status: selectedStage })
      .then((res) => {
        setCandidates(res.candidates || []);
        setLoading(false);
      })
      .catch((err) => {
        setLoading(false);
        showToast(`Failed to load candidates: ${err.message}`);
      });
  };

  useEffect(() => {
    fetchCandidates();
  }, [search, selectedStage]);

  const handleStageChange = (candidateId, newStage) => {
    if (activeRole === 'viewer') {
      showToast('Viewer accounts cannot advance candidate stages.');
      return;
    }
    adminApi
      .updateCandidateStatus(candidateId, newStage)
      .then(() => {
        showToast(`Candidate status updated to ${newStage}`);
        fetchCandidates();
      })
      .catch((err) => showToast(`Status change failed: ${err.message}`));
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (
      !formData.name.trim() ||
      !formData.email.trim() ||
      !formData.phone.trim()
    ) {
      setFormError('Please enter candidate name, email, and phone.');
      return;
    }

    const payload = {
      ...formData,
      technicalSkills: formData.technicalSkills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    };

    adminApi
      .createCandidate(payload)
      .then(() => {
        showToast(`Candidate ${formData.name} submitted into ATS pipeline.`);
        setModalOpen(false);
        fetchCandidates();
      })
      .catch((err) => setFormError(err.message));
  };

  const handleDelete = (id) => {
    if (activeRole === 'viewer') {
      showToast('Viewer accounts cannot delete candidates.');
      return;
    }
    adminApi
      .deleteCandidate(id)
      .then(() => {
        showToast('Candidate removed from ATS.');
        setDeleteConfirmId(null);
        setSelectedCandidate(null);
        fetchCandidates();
      })
      .catch((err) => showToast(`Delete failed: ${err.message}`));
  };

  return (
    <div>
      {/* Header */}
      <div className="tw-view-header">
        <div className="tw-view-title-group">
          <h1>Candidate Pipeline & Recruitment ATS</h1>
          <p className="tw-view-subtitle">
            Track candidates through Applied, Screening, Technical Interview,
            Offered, and Hired stages.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div className="tw-period-filter-group">
            <button
              className={`tw-period-btn ${viewMode === 'pipeline' ? 'active' : ''}`}
              onClick={() => setViewMode('pipeline')}
            >
              Kanban Board
            </button>
            <button
              className={`tw-period-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
            >
              List View
            </button>
          </div>

          <button
            className="tw-btn-primary"
            onClick={() => {
              if (activeRole === 'viewer') {
                showToast('Viewer accounts cannot add candidates.');
                return;
              }
              setFormData({
                name: '',
                email: '',
                phone: '',
                currentRole: 'Senior Full Stack Engineer',
                technicalSkills: '',
                experience: 4,
                expectedSalary: '₹24 LPA',
                status: 'Applied',
                jobTitle: 'Lead Full Stack & Frontend Engineer',
                notes: '',
              });
              setFormError('');
              setModalOpen(true);
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
            }}
          >
            <PlusIcon size={15} />
            <span>Add Candidate</span>
          </button>
        </div>
      </div>

      {/* Filter Strip */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.25rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <input
            type="text"
            className="tw-filter-input"
            placeholder="Search candidate name or skill..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '260px' }}
          />

          <select
            className="tw-filter-select"
            value={selectedStage}
            onChange={(e) => setSelectedStage(e.target.value)}
          >
            <option value="All">All Stages</option>
            {PIPELINE_STAGES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>

        <div style={{ fontSize: '0.8rem', color: '#64748B' }}>
          Total active candidates: <strong>{candidates.length}</strong>
        </div>
      </div>

      {/* Mode 1: Kanban Pipeline Board */}
      {viewMode === 'pipeline' ? (
        <div className="tw-pipeline-board">
          {PIPELINE_STAGES.map((stage) => {
            const stageCandidates = candidates.filter(
              (c) => c.status === stage
            );
            return (
              <div key={stage} className="tw-pipeline-col">
                <div className="tw-pipeline-col-header">
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                    }}
                  >
                    <span
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor:
                          stage === 'Hired'
                            ? '#16A34A'
                            : stage === 'Offered'
                              ? '#008F68'
                              : stage === 'Interview'
                                ? '#3478D4'
                                : stage === 'Screening'
                                  ? '#8064D8'
                                  : stage === 'Rejected'
                                    ? '#DC2626'
                                    : '#D97706',
                      }}
                    ></span>
                    {stage}
                  </span>
                  <span
                    className="tw-badge"
                    style={{ padding: '0.1rem 0.4rem' }}
                  >
                    {stageCandidates.length}
                  </span>
                </div>

                <div className="tw-pipeline-cards">
                  {stageCandidates.length === 0 ? (
                    <div
                      style={{
                        padding: '1.5rem 0.5rem',
                        textAlign: 'center',
                        color: '#94A3B8',
                        fontSize: '0.75rem',
                      }}
                    >
                      No candidates in {stage}
                    </div>
                  ) : (
                    stageCandidates.map((cand) => (
                      <div
                        key={cand.id || cand._id}
                        className="tw-candidate-card"
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                          }}
                        >
                          <strong
                            style={{
                              fontSize: '0.85rem',
                              color: '#172033',
                              cursor: 'pointer',
                            }}
                            onClick={() => setSelectedCandidate(cand)}
                          >
                            {cand.name}
                          </strong>
                          <span
                            style={{ fontSize: '0.7rem', color: '#64748B' }}
                          >
                            {cand.experience}y exp
                          </span>
                        </div>

                        <div
                          style={{
                            fontSize: '0.75rem',
                            color: '#64748B',
                            marginTop: '0.15rem',
                          }}
                        >
                          {cand.currentRole}
                        </div>

                        {cand.jobTitle && (
                          <div
                            style={{
                              fontSize: '0.72rem',
                              color: '#0F766E',
                              fontWeight: 600,
                              marginTop: '0.2rem',
                            }}
                          >
                            {cand.jobTitle}
                          </div>
                        )}

                        {cand.assessmentStatus &&
                          cand.assessmentStatus !== 'Not Started' && (
                            <div style={{ marginTop: '0.25rem' }}>
                              <span
                                style={{
                                  fontSize: '0.66rem',
                                  padding: '0.1rem 0.35rem',
                                  borderRadius: '4px',
                                  fontWeight: 600,
                                  backgroundColor:
                                    cand.assessmentStatus === 'Passed'
                                      ? '#DCFCE7'
                                      : '#FEE2E2',
                                  color:
                                    cand.assessmentStatus === 'Passed'
                                      ? '#15803D'
                                      : '#B91C1C',
                                }}
                              >
                                {cand.assessmentStatus === 'Passed'
                                  ? 'Assessment Passed'
                                  : 'Assessment Failed'}
                                :{' '}
                                {cand.assessmentScore !== null &&
                                cand.assessmentScore !== undefined
                                  ? `${cand.assessmentScore}/100`
                                  : cand.assessmentStatus}
                              </span>
                            </div>
                          )}

                        <div
                          style={{
                            display: 'flex',
                            gap: '0.2rem',
                            flexWrap: 'wrap',
                            margin: '0.4rem 0',
                          }}
                        >
                          {(cand.technicalSkills || [])
                            .slice(0, 2)
                            .map((sk, idx) => (
                              <span
                                key={idx}
                                style={{
                                  fontSize: '0.65rem',
                                  padding: '0.1rem 0.35rem',
                                  borderRadius: '4px',
                                  backgroundColor: '#EBF2FC',
                                  color: '#3478D4',
                                }}
                              >
                                {sk}
                              </span>
                            ))}
                        </div>

                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            borderTop: '1px solid #E2E8F0',
                            paddingTop: '0.4rem',
                            marginTop: '0.4rem',
                          }}
                        >
                          <select
                            value={cand.status}
                            onChange={(e) =>
                              handleStageChange(
                                cand.id || cand._id,
                                e.target.value
                              )
                            }
                            style={{
                              fontSize: '0.7rem',
                              padding: '0.15rem 0.35rem',
                              borderRadius: '4px',
                              border: '1px solid #CBD5E1',
                              backgroundColor: '#FFFFFF',
                              cursor: 'pointer',
                            }}
                          >
                            {PIPELINE_STAGES.map((s) => (
                              <option key={s} value={s}>
                                → {s}
                              </option>
                            ))}
                          </select>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <button
                              type="button"
                              onClick={() => setEvaluationModalCandidateId(cand.id || cand._id)}
                              style={{
                                background: '#EFF6FF',
                                border: '1px solid #BFDBFE',
                                borderRadius: '4px',
                                color: '#1D4ED8',
                                fontSize: '0.7rem',
                                fontWeight: 600,
                                padding: '0.15rem 0.45rem',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.2rem',
                              }}
                              title="View AI Evaluation Dossier"
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: '0.85rem' }}>
                                psychology
                              </span>
                              Dossier
                            </button>
                            <button
                              onClick={() => setSelectedCandidate(cand)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#008F68',
                                fontSize: '0.72rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              Details
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Mode 2: Table View */
        <div className="tw-table-container">
          <div style={{ overflowX: 'auto' }}>
            <table className="tw-table">
              <thead>
                <tr>
                  <th>Candidate</th>
                  <th>Current Role & Exp</th>
                  <th>Applied For</th>
                  <th>Skills</th>
                  <th>Comp Expectation</th>
                  <th>Stage</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {candidates.map((cand) => (
                  <tr key={cand.id || cand._id}>
                    <td data-label="Candidate">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <div
                          style={{
                            width: '34px',
                            height: '34px',
                            borderRadius: '50%',
                            overflow: 'hidden',
                            background: '#E2E8F0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '0.78rem',
                            color: '#0037B0',
                            flexShrink: 0,
                          }}
                        >
                          {cand.avatarUrl ? (
                            <img
                              src={cand.avatarUrl}
                              alt={cand.name}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            (cand.name?.slice(0, 2) || 'TW').toUpperCase()
                          )}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{cand.name}</div>
                          <div style={{ fontSize: '0.73rem', color: '#64748B' }}>
                            {cand.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td data-label="Current Role & Exp">
                      <div style={{ fontWeight: 500 }}>
                        {cand.currentRole || cand.jobTitle}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
                        {cand.experience ? `${cand.experience}y exp` : 'Experienced'}
                      </div>
                      {cand.assessmentStatus &&
                        cand.assessmentStatus !== 'Not Started' && (
                          <div
                            style={{
                              fontSize: '0.68rem',
                              marginTop: '0.15rem',
                            }}
                          >
                            <span
                              style={{
                                color:
                                  cand.assessmentStatus === 'Passed'
                                    ? '#15803D'
                                    : '#B91C1C',
                                fontWeight: 600,
                              }}
                            >
                              {cand.assessmentStatus === 'Passed'
                                ? 'Passed'
                                : 'Failed'}
                              :{' '}
                              {cand.assessmentScore !== null &&
                              cand.assessmentScore !== undefined
                                ? `${cand.assessmentScore}/100`
                                : ''}
                            </span>
                          </div>
                        )}
                    </td>
                    <td data-label="Applied For">
                      <div style={{ fontWeight: 600, color: '#0F172A' }}>
                        {cand.jobTitle || 'General Application'}
                      </div>
                    </td>
                    <td data-label="Skills">
                      <div
                        style={{
                          display: 'flex',
                          gap: '0.2rem',
                          flexWrap: 'wrap',
                          maxWidth: '200px',
                        }}
                      >
                        {(cand.technicalSkills || []).map((sk, idx) => (
                          <span
                            key={idx}
                            style={{
                              fontSize: '0.65rem',
                              padding: '0.1rem 0.35rem',
                              borderRadius: '4px',
                              backgroundColor: '#EBF2FC',
                              color: '#3478D4',
                            }}
                          >
                            {sk}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td data-label="Comp Expectation">
                      <strong>{cand.expectedSalary}</strong>
                    </td>
                    <td data-label="Stage">
                      <select
                        value={cand.status}
                        onChange={(e) =>
                          handleStageChange(cand.id || cand._id, e.target.value)
                        }
                        className="tw-filter-select"
                        style={{
                          padding: '0.25rem 0.5rem',
                          fontSize: '0.75rem',
                        }}
                      >
                        {PIPELINE_STAGES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td data-label="Actions" style={{ textAlign: 'right' }}>
                      <div
                        className="tw-action-btn-group"
                        style={{ justifyContent: 'flex-end', alignItems: 'center' }}
                      >
                        <button
                          className="tw-action-icon-btn"
                          style={{ color: '#0037B0' }}
                          onClick={() => setEvaluationModalCandidateId(cand.id || cand._id)}
                          title="View Full AI Evaluation Dossier & Download"
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '1.05rem' }}>
                            psychology
                          </span>
                        </button>
                        <button
                          className="tw-action-icon-btn"
                          onClick={() => setSelectedCandidate(cand)}
                          title="View Details"
                        >
                          <EyeIcon size={14} />
                        </button>
                        <button
                          className="tw-action-icon-btn delete"
                          onClick={() =>
                            setDeleteConfirmId(cand.id || cand._id)
                          }
                          title="Delete Candidate"
                        >
                          <TrashIcon size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Candidate Details Modal */}
      {selectedCandidate && (
        <div className="tw-modal-overlay">
          <div className="tw-modal" style={{ maxWidth: '540px' }}>
            <div className="tw-modal-header">
              <h2 className="tw-modal-title">{selectedCandidate.name}</h2>
              <button
                className="tw-modal-close-btn"
                onClick={() => setSelectedCandidate(null)}
                title="Close"
              >
                <CloseIcon size={16} />
              </button>
            </div>
            <div className="tw-modal-body">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '1rem',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, color: '#172033' }}>
                    {selectedCandidate.currentRole}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#64748B' }}>
                    {selectedCandidate.email} • {selectedCandidate.phone}
                  </div>
                </div>
                <span className="tw-badge deployed">
                  {selectedCandidate.status}
                </span>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label className="tw-form-label">Target Role Requisition</label>
                <div style={{ fontSize: '0.85rem' }}>
                  {selectedCandidate.jobTitle}
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label className="tw-form-label">Technical Skills</label>
                <div
                  style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}
                >
                  {(selectedCandidate.technicalSkills || []).map((sk, idx) => (
                    <span
                      key={idx}
                      style={{
                        fontSize: '0.75rem',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        backgroundColor: '#E6F4F0',
                        color: '#006548',
                        fontWeight: 600,
                      }}
                    >
                      {sk}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label className="tw-form-label">
                  Compensation Expectation
                </label>
                <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                  {selectedCandidate.expectedSalary}
                </div>
              </div>

              {/* Open AI Dossier Button */}
              <button
                type="button"
                onClick={() => {
                  const id = selectedCandidate.id || selectedCandidate._id;
                  setEvaluationModalCandidateId(id);
                }}
                style={{
                  width: '100%',
                  padding: '0.65rem 1rem',
                  borderRadius: '8px',
                  background: '#0037B0',
                  color: '#FFFFFF',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.86rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                  marginBottom: '1rem',
                  boxShadow: '0 2px 4px rgba(0, 55, 176, 0.2)',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>
                  psychology
                </span>
                <span>Open Full AI Evaluation Dossier & Download</span>
              </button>

              {/* AI Screening Assessment & ATS Fit */}
              <div
                style={{
                  marginBottom: '1rem',
                  padding: '0.85rem',
                  backgroundColor: '#F0FDF4',
                  borderRadius: '8px',
                  border: '1px solid #BBF7D0',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.4rem',
                  }}
                >
                  <label
                    className="tw-form-label"
                    style={{ margin: 0, color: '#166534', fontWeight: 700 }}
                  >
                    AI Screening Assessment & ATS Fit
                  </label>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '0.15rem 0.5rem',
                      borderRadius: '4px',
                      backgroundColor:
                        selectedCandidate.assessmentStatus === 'Passed'
                          ? '#DCFCE7'
                          : selectedCandidate.assessmentStatus === 'Failed'
                            ? '#FEE2E2'
                            : '#F1F5F9',
                      color:
                        selectedCandidate.assessmentStatus === 'Passed'
                          ? '#15803D'
                          : selectedCandidate.assessmentStatus === 'Failed'
                            ? '#B91C1C'
                            : '#475569',
                    }}
                  >
                    {selectedCandidate.assessmentStatus || 'Not Started'}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: '0.82rem',
                    color: '#166534',
                    display: 'flex',
                    gap: '1.25rem',
                    flexWrap: 'wrap',
                  }}
                >
                  <span>
                    Assessment Score:{' '}
                    <strong>
                      {selectedCandidate.assessmentScore !== null &&
                      selectedCandidate.assessmentScore !== undefined
                        ? `${selectedCandidate.assessmentScore} / 100`
                        : 'Not Taken'}
                    </strong>
                  </span>
                  <span>
                    ATS Match Score:{' '}
                    <strong>
                      {selectedCandidate.fitScore
                        ? `${selectedCandidate.fitScore}%`
                        : '85%'}{' '}
                      ({selectedCandidate.fitBadge || 'Top Match'})
                    </strong>
                  </span>
                </div>
              </div>

              {/* Resume download / view link */}
              {selectedCandidate.resumeUrl && (
                <div style={{ marginBottom: '1rem' }}>
                  <label className="tw-form-label">Attached Resume</label>
                  <div>
                    <a
                      href={selectedCandidate.resumeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="tw-btn-secondary"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.45rem',
                        padding: '0.4rem 0.85rem',
                        fontSize: '0.78rem',
                        textDecoration: 'none',
                        color: '#0F766E',
                        fontWeight: 600,
                        borderRadius: '6px',
                        border: '1px solid #CCFBF1',
                        backgroundColor: '#F0FDFA',
                      }}
                    >
                      View Candidate Resume{' '}
                      {selectedCandidate.resumeOriginalName
                        ? `(${selectedCandidate.resumeOriginalName})`
                        : ''}
                    </a>
                  </div>
                </div>
              )}

              <div style={{ marginBottom: '1rem' }}>
                <label className="tw-form-label">
                  Evaluation Notes & Technical Screen
                </label>
                <div
                  style={{
                    padding: '0.75rem',
                    backgroundColor: '#F8FAFC',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    border: '1px solid #E2E8F0',
                  }}
                >
                  {selectedCandidate.notes ||
                    'Interview rounds ongoing. Positive feedback on distributed systems.'}
                </div>
              </div>

              <div
                style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem' }}
              >
                <label className="tw-form-label" style={{ margin: 'auto 0' }}>
                  Advance Stage:
                </label>
                <select
                  className="tw-form-select"
                  value={selectedCandidate.status}
                  onChange={(e) => {
                    handleStageChange(
                      selectedCandidate.id || selectedCandidate._id,
                      e.target.value
                    );
                    setSelectedCandidate({
                      ...selectedCandidate,
                      status: e.target.value,
                    });
                  }}
                  style={{ flex: 1 }}
                >
                  {PIPELINE_STAGES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="tw-modal-footer">
              <button
                className="tw-btn-danger"
                onClick={() =>
                  setDeleteConfirmId(
                    selectedCandidate.id || selectedCandidate._id
                  )
                }
              >
                Delete Candidate
              </button>
              <button
                className="tw-btn-secondary"
                onClick={() => setSelectedCandidate(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Candidate Modal */}
      {modalOpen && (
        <div className="tw-modal-overlay">
          <div className="tw-modal">
            <div className="tw-modal-header">
              <h2 className="tw-modal-title">Intake New Candidate</h2>
              <button
                className="tw-modal-close-btn"
                onClick={() => setModalOpen(false)}
                title="Close"
              >
                <CloseIcon size={16} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit}>
              <div className="tw-modal-body">
                {formError && (
                  <div
                    style={{
                      padding: '0.65rem 0.9rem',
                      backgroundColor: '#FEE2E2',
                      color: '#DC2626',
                      borderRadius: '8px',
                      marginBottom: '1rem',
                      fontSize: '0.82rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                    }}
                  >
                    <AlertCircleIcon size={16} />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="tw-form-row">
                  <div className="tw-form-group">
                    <label className="tw-form-label">Candidate Name *</label>
                    <input
                      type="text"
                      className="tw-form-input"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="e.g. Shalini Mehra"
                      required
                    />
                  </div>
                  <div className="tw-form-group">
                    <label className="tw-form-label">Email Address *</label>
                    <input
                      type="email"
                      className="tw-form-input"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      placeholder="candidate@example.com"
                      required
                    />
                  </div>
                </div>

                <div className="tw-form-row">
                  <div className="tw-form-group">
                    <label className="tw-form-label">Phone *</label>
                    <input
                      type="text"
                      className="tw-form-input"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      placeholder="+91 98223 44556"
                      required
                    />
                  </div>
                  <div className="tw-form-group">
                    <label className="tw-form-label">Current Role</label>
                    <input
                      type="text"
                      className="tw-form-input"
                      value={formData.currentRole}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          currentRole: e.target.value,
                        })
                      }
                      placeholder="e.g. Senior Frontend React Engineer"
                    />
                  </div>
                </div>

                <div className="tw-form-group">
                  <label className="tw-form-label">
                    Technical Skills (comma separated) *
                  </label>
                  <input
                    type="text"
                    className="tw-form-input"
                    value={formData.technicalSkills}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        technicalSkills: e.target.value,
                      })
                    }
                    placeholder="React, TypeScript, Tailwind, Redux"
                  />
                </div>

                <div className="tw-form-row">
                  <div className="tw-form-group">
                    <label className="tw-form-label">Experience (Years)</label>
                    <input
                      type="number"
                      className="tw-form-input"
                      value={formData.experience}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          experience: Number(e.target.value),
                        })
                      }
                      min="0"
                    />
                  </div>
                  <div className="tw-form-group">
                    <label className="tw-form-label">
                      Expected Compensation
                    </label>
                    <input
                      type="text"
                      className="tw-form-input"
                      value={formData.expectedSalary}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          expectedSalary: e.target.value,
                        })
                      }
                      placeholder="₹25 LPA / $55k"
                    />
                  </div>
                </div>

                <div className="tw-form-row">
                  <div className="tw-form-group">
                    <label className="tw-form-label">
                      Initial Pipeline Stage
                    </label>
                    <select
                      className="tw-form-select"
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({ ...formData, status: e.target.value })
                      }
                    >
                      {PIPELINE_STAGES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="tw-form-group">
                    <label className="tw-form-label">
                      Applied For Requisition
                    </label>
                    <input
                      type="text"
                      className="tw-form-input"
                      value={formData.jobTitle}
                      onChange={(e) =>
                        setFormData({ ...formData, jobTitle: e.target.value })
                      }
                      placeholder="e.g. Lead Full Stack & Frontend Engineer"
                    />
                  </div>
                </div>

                <div className="tw-form-group">
                  <label className="tw-form-label">
                    Initial Screening Notes
                  </label>
                  <textarea
                    className="tw-form-textarea"
                    rows="2"
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    placeholder="Code assessment score, portfolio link, notice period..."
                  ></textarea>
                </div>
              </div>

              <div className="tw-modal-footer">
                <button
                  type="button"
                  className="tw-btn-secondary"
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="tw-btn-primary">
                  Submit Candidate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirmId && (
        <div className="tw-modal-overlay">
          <div className="tw-modal" style={{ maxWidth: '440px' }}>
            <div className="tw-modal-header">
              <h2 className="tw-modal-title">Delete Candidate</h2>
              <button
                className="tw-modal-close-btn"
                onClick={() => setDeleteConfirmId(null)}
                title="Close"
              >
                <CloseIcon size={16} />
              </button>
            </div>
            <div className="tw-modal-body">
              Are you sure you want to remove this candidate profile from the
              recruitment pipeline?
            </div>
            <div className="tw-modal-footer">
              <button
                className="tw-btn-secondary"
                onClick={() => setDeleteConfirmId(null)}
              >
                Cancel
              </button>
              <button
                className="tw-btn-danger"
                onClick={() => handleDelete(deleteConfirmId)}
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full AI Evaluation Dossier Modal */}
      {evaluationModalCandidateId && (
        <CandidateEvaluationModal
          isOpen={Boolean(evaluationModalCandidateId)}
          onClose={() => setEvaluationModalCandidateId(null)}
          candidateId={evaluationModalCandidateId}
          showToast={showToast}
        />
      )}
    </div>
  );
};

export default CandidatesView;
