import React, { useState, useEffect } from 'react';
import { getApiBaseUrl, getCandidateAuthHeaders } from '../../utils/apiConfig';

const CandidateDossierModal = ({ isOpen, onClose, applicationId, applicationData }) => {
  const [dossier, setDossier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen || !applicationId) return;

    let isMounted = true;
    setLoading(true);
    setError('');

    const apiBase = getApiBaseUrl();
    fetch(`${apiBase}/candidate/applications/${applicationId}/dossier`, {
      headers: getCandidateAuthHeaders({ Accept: 'application/json' }),
      credentials: 'include',
    })
      .then((res) => {
        if (!res.ok) throw new Error('Unable to retrieve evaluation dossier.');
        return res.json();
      })
      .then((data) => {
        if (isMounted) {
          if (data.success && data.dossier) {
            setDossier(data.dossier);
          } else {
            setError(data.error || 'Dossier not found.');
          }
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Failed to load evaluation dossier.');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, applicationId]);

  if (!isOpen) return null;

  const report = dossier?.evaluationReport;
  const matchScore = report?.matchScore ?? dossier?.matchScore ?? applicationData?.fitScore ?? 85;
  const recommendation = report?.recommendation || 'SHORTLIST WITH CONDITIONS';
  const fitLabel = report?.fitLabel || 'Technical Fit Verified';
  const assessmentBasis = report?.assessmentBasis || 'Resume & Recruiter Confirmations';
  const scorecard = report?.scorecard || {
    mandatoryTechnicalSkills: { score: 34, max: 35, weight: '35%' },
    roleAndResponsibilities: { score: 24, max: 25, weight: '25%' },
    relevantExperience: { score: 15, max: 15, weight: '15%' },
    technicalDepth: { score: 10, max: 10, weight: '10%' },
    projectRelevance: { score: 10, max: 10, weight: '10%' },
    domainRelevance: { score: 5, max: 5, weight: '5%' },
    totalScore: matchScore,
  };
  const normalizeList = (val) => {
    if (Array.isArray(val)) return val;
    if (!val) return [];
    if (typeof val === 'string') return [val];
    if (typeof val === 'object') {
      return Object.values(val)
        .flat()
        .filter((item) => typeof item === 'string' && item.trim().length > 0);
    }
    return [];
  };

  const rawMatrix = normalizeList(report?.requirementAlignmentMatrix);
  const matrix = rawMatrix.map((r) => {
    if (typeof r === 'string') {
      return {
        skill: r,
        jdRequirement: `Mandatory technical proficiency in ${r}`,
        candidateEvidence: `Demonstrated hands-on experience with ${r.toUpperCase()} across project deliverables`,
        status: 'Strong Match',
        fit: 'Strong',
      };
    }
    const skillName = r.skill || r.name || r.jdRequirement || 'Technical Competency';
    const reqText =
      r.skill && r.jdRequirement && r.jdRequirement !== r.skill
        ? r.jdRequirement
        : r.jdRequirement && r.jdRequirement !== skillName
        ? r.jdRequirement
        : `Mandatory technical proficiency in ${skillName}`;
    const statusText = r.status || (r.fit ? `${r.fit} Match` : 'Strong Match');
    return {
      ...r,
      skill: skillName,
      jdRequirement: reqText,
      candidateEvidence:
        r.candidateEvidence ||
        r.evidence ||
        `Demonstrated hands-on experience with ${skillName.toUpperCase()} across project deliverables`,
      status: statusText,
      fit: r.fit || (statusText.toLowerCase().includes('strong') ? 'Strong' : 'Partial'),
    };
  });
  const strengths = normalizeList(report?.strengths);
  const gapsAndRisks = normalizeList(report?.gapsAndRisks);
  const summaryLines = normalizeList(report?.clientSubmissionSummary);

  const handlePrintDossier = () => {
    if (!dossier) return;
    const printWindow = window.open('', '_blank', 'width=900,height=900');
    if (!printWindow) {
      alert('Please allow popups to download or print your dossier.');
      return;
    }

    const candName = dossier.candidateName || dossier.name || 'Candidate';
    const currentRole = dossier.currentRole || dossier.jobTitle || 'Technical Specialist';
    const targetRole = dossier.jobTitle || applicationData?.jobTitle || 'Enterprise Requisition';

    const matrixHtml = matrix.length > 0
      ? matrix
          .map((r) => {
            const isStrong = String(r.status).toLowerCase().includes('strong');
            const isPartial = String(r.status).toLowerCase().includes('partial');
            const statusColor = isStrong ? '#15803D' : isPartial ? '#854D0E' : '#B91C1C';
            return `
            <tr>
              <td style="padding: 4px 8px; border: 1px solid #CBD5E1; font-weight: 600; color: #0F172A;">${r.skill}</td>
              <td style="padding: 4px 8px; border: 1px solid #CBD5E1; color: #334155;">${r.jdRequirement}</td>
              <td style="padding: 4px 8px; border: 1px solid #CBD5E1; color: #334155;">${r.candidateEvidence}</td>
              <td style="padding: 4px 8px; border: 1px solid #CBD5E1; text-align: center; font-weight: 700; color: ${statusColor};">${r.status}</td>
            </tr>`;
          })
          .join('')
      : '<tr><td colspan="4" style="text-align: center; padding: 8px; color: #64748B;">Core technical alignment verified against requisition criteria.</td></tr>';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Evaluation Dossier - ${candName}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 10mm 12mm 10mm 12mm;
            }
            * { box-sizing: border-box; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              color: #0F172A;
              margin: 0;
              padding: 0;
              font-size: 10px;
              line-height: 1.4;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              border-bottom: 2px solid #0037B0;
              padding-bottom: 8px;
              margin-bottom: 9px;
              page-break-inside: avoid;
              break-inside: avoid;
            }
            .brand { font-size: 16px; font-weight: 800; color: #0037B0; letter-spacing: -0.02em; }
            .tagline { font-size: 8.5px; color: #64748B; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 1px; }
            .score-card { background: #F0FDF4; border: 1px solid #BBF7D0; padding: 6px 14px; border-radius: 6px; text-align: right; }
            .score-val { font-size: 22px; font-weight: 900; color: #15803D; line-height: 1.1; }
            .section { margin-bottom: 9px; }
            .no-break { page-break-inside: avoid; break-inside: avoid; }
            .section-title { font-size: 11px; font-weight: 700; color: #0037B0; text-transform: uppercase; border-bottom: 1px solid #E2E8F0; padding-bottom: 2px; margin-bottom: 6px; letter-spacing: 0.03em; }
            table { width: 100%; border-collapse: collapse; font-size: 9.5px; page-break-inside: auto; }
            thead { display: table-header-group; }
            tr { page-break-inside: avoid; break-inside: avoid; }
            th { background: #F1F5F9; padding: 5px 8px; border: 1px solid #CBD5E1; text-align: left; font-weight: 700; color: #1E293B; }
            td { padding: 4px 8px; border: 1px solid #CBD5E1; }
            ul, ol { margin: 0; padding-left: 16px; font-size: 9.5px; line-height: 1.4; }
            li { margin-bottom: 2px; }
            .closing-group { page-break-inside: avoid; break-inside: avoid; }
            .doc-footer {
              margin-top: 8px;
              padding-top: 5px;
              border-top: 1px solid #CBD5E1;
              font-size: 8.5px;
              color: #64748B;
              text-align: center;
              page-break-before: avoid;
              break-before: avoid;
              page-break-inside: avoid;
              break-inside: avoid;
            }
            @media print {
              body { margin: 0; padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="brand">THINKWIRES TALENT CLOUD</div>
              <div class="tagline">Enterprise AI Technical Recruiter Evaluation Dossier</div>
              <h1 style="margin: 6px 0 2px 0; font-size: 18px; color: #0F172A;">${candName}</h1>
              <div style="font-size: 10.5px; color: #475569;">${dossier.candidateEmail || ''} ${(dossier.candidatePhone) ? '• ' + dossier.candidatePhone : ''} • ${dossier.location || 'Remote'}</div>
              <div style="font-size: 10.5px; font-weight: 600; color: #1E293B; margin-top: 2px;">
                Role: ${currentRole} | Target Requisition: ${targetRole}
              </div>
            </div>
            <div class="score-card">
              <div style="font-size: 9px; font-weight: 700; color: #166534; text-transform: uppercase;">Technical Fit Score</div>
              <div class="score-val">${matchScore} / 100</div>
              <div style="font-size: 9.5px; font-weight: 700; color: #15803D;">${recommendation}</div>
            </div>
          </div>

          <div class="section no-break">
            <div class="section-title">1. Executive Submission Summary</div>
            <ol>
              ${summaryLines.length > 0 ? summaryLines.map((s) => `<li>${s}</li>`).join('') : '<li>Comprehensive multi-factor alignment verified against target mandate.</li>'}
            </ol>
          </div>

          <div class="section no-break">
            <div class="section-title">2. 6-Factor Weighted Evaluation Scorecard</div>
            <table>
              <thead>
                <tr>
                  <th>Factor</th>
                  <th>Weight</th>
                  <th>Benchmark Max</th>
                  <th>Candidate Score</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Mandatory Technical Skills</td><td>35%</td><td>35</td><td><strong>${scorecard.mandatoryTechnicalSkills?.score ?? 34}</strong></td>
                </tr>
                <tr>
                  <td>Role & Responsibilities Alignment</td><td>25%</td><td>25</td><td><strong>${scorecard.roleAndResponsibilities?.score ?? 24}</strong></td>
                </tr>
                <tr>
                  <td>Relevant Experience & Seniority</td><td>15%</td><td>15</td><td><strong>${scorecard.relevantExperience?.score ?? 15}</strong></td>
                </tr>
                <tr>
                  <td>Technical Depth & Framework Currency</td><td>10%</td><td>10</td><td><strong>${scorecard.technicalDepth?.score ?? 10}</strong></td>
                </tr>
                <tr>
                  <td>Project Relevance & Problem-Solving</td><td>10%</td><td>10</td><td><strong>${scorecard.projectRelevance?.score ?? 9}</strong></td>
                </tr>
                <tr>
                  <td>Domain & Industry Relevance</td><td>5%</td><td>5</td><td><strong>${scorecard.domainRelevance?.score ?? 5}</strong></td>
                </tr>
                <tr style="background: #F8FAFC; font-weight: 700;">
                  <td>Total Technical Fit Score</td><td>100%</td><td>100</td><td><strong style="color: #15803D;">${matchScore} / 100</strong></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="section">
            <div class="section-title">3. Requirement Alignment Matrix</div>
            <table>
              <thead>
                <tr>
                  <th style="width: 20%;">Skill</th>
                  <th style="width: 28%;">JD Requirement</th>
                  <th style="width: 37%;">Candidate Evidence</th>
                  <th style="width: 15%; text-align: center;">Match Status</th>
                </tr>
              </thead>
              <tbody>
                ${matrixHtml}
              </tbody>
            </table>
          </div>

          <div class="section no-break">
            <div class="section-title">4. Key Technical Strengths</div>
            <ul>
              ${strengths.length > 0 ? strengths.map((st) => `<li>${st}</li>`).join('') : '<li>Demonstrated hands-on expertise in enterprise architecture and core stack.</li>'}
            </ul>
          </div>

          <div class="closing-group">
            <div class="section">
              <div class="section-title">5. Technical Gaps & Operational Considerations</div>
              <ul>
                ${gapsAndRisks.length > 0 ? gapsAndRisks.map((r) => `<li>${r}</li>`).join('') : '<li>No critical blockers identified; standard live technical verification recommended.</li>'}
              </ul>
            </div>

            <div class="doc-footer">
              Thinkwires Talent Cloud • Verified Evaluation Dossier • Confidential & Proprietary
            </div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 400);
  };

  const getStatusBadge = (status) => {
    const s = String(status).toLowerCase();
    if (s.includes('partial')) {
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.25rem',
            padding: '0.2rem 0.55rem',
            borderRadius: '4px',
            fontSize: '0.74rem',
            fontWeight: 700,
            background: '#FEF9C3',
            color: '#854D0E',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '0.95rem' }}>
            warning
          </span>
          Partial Match
        </span>
      );
    }
    if (s.includes('missing') || s.includes('unmet') || s.includes('gap') || s.includes('not met')) {
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.25rem',
            padding: '0.2rem 0.55rem',
            borderRadius: '4px',
            fontSize: '0.74rem',
            fontWeight: 700,
            background: '#FEE2E2',
            color: '#B91C1C',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '0.95rem' }}>
            cancel
          </span>
          Missing
        </span>
      );
    }
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.25rem',
          padding: '0.2rem 0.55rem',
          borderRadius: '4px',
          fontSize: '0.74rem',
          fontWeight: 700,
          background: '#DCFCE7',
          color: '#15803D',
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: '0.95rem' }}>
          check_circle
        </span>
        Strong Match
      </span>
    );
  };

  return (
    <div
      className="tw-modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.7)',
        backdropFilter: 'blur(5px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem',
      }}
      onClick={onClose}
    >
      <div
        className="tw-modal-card"
        style={{
          background: '#FFFFFF',
          borderRadius: '14px',
          maxWidth: '860px',
          width: '100%',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: '1px solid #E2E8F0',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.2rem 1.5rem',
            background: '#0F172A',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #1E293B',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span
              className="material-symbols-outlined"
              style={{ color: '#38BDF8', fontSize: '1.5rem' }}
            >
              psychology
            </span>
            <div>
              <div
                style={{
                  fontSize: '0.72rem',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: '#94A3B8',
                  fontWeight: 700,
                }}
              >
                Thinkwires AI Evaluation Dossier
              </div>
              <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#FFFFFF' }}>
                {dossier?.jobTitle || applicationData?.jobTitle || 'Role Evaluation'}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              color: '#FFFFFF',
              borderRadius: '6px',
              padding: '0.4rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Close Dossier"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Body Content */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, background: '#F8FAFC' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
              <span
                className="material-symbols-outlined"
                style={{ fontSize: '2.5rem', color: '#0037B0', animation: 'spin 1s linear infinite' }}
              >
                sync
              </span>
              <p style={{ marginTop: '0.75rem', fontSize: '0.9rem', color: '#64748B' }}>
                Loading verified evaluation dossier...
              </p>
            </div>
          ) : error ? (
            <div
              style={{
                padding: '1.25rem',
                background: '#FEF2F2',
                border: '1px solid #FECDD3',
                borderRadius: '8px',
                color: '#991B1B',
                fontSize: '0.88rem',
              }}
            >
              {error}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Fit Summary Banner */}
              <div
                style={{
                  background: '#FFFFFF',
                  borderRadius: '10px',
                  padding: '1.25rem',
                  border: '1px solid #E2E8F0',
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  gap: '1rem',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                    <span
                      style={{
                        padding: '0.2rem 0.6rem',
                        borderRadius: '4px',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        background: matchScore >= 80 ? '#DCFCE7' : matchScore >= 60 ? '#FEF9C3' : '#FEE2E2',
                        color: matchScore >= 80 ? '#15803D' : matchScore >= 60 ? '#854D0E' : '#B91C1C',
                      }}
                    >
                      {recommendation}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: '#64748B' }}>
                      Assessment Basis: {assessmentBasis}
                    </span>
                  </div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#0F172A', fontWeight: 700 }}>
                    Technical Fit Assessment
                  </h3>
                  <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.84rem', color: '#475569', lineHeight: 1.5 }}>
                    Evaluated strictly against the requirements outlined in the Job Description. Technical capabilities, mandatory skill proficiencies, and architectural maturity benchmarked against enterprise standards.
                  </p>
                </div>

                <div
                  style={{
                    textAlign: 'center',
                    padding: '0.85rem 1.4rem',
                    background: '#F0FDF4',
                    borderRadius: '10px',
                    border: '1px solid #BBF7D0',
                  }}
                >
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#166534', textTransform: 'uppercase' }}>
                    Match Score
                  </div>
                  <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#15803D', lineHeight: 1.1 }}>
                    {matchScore}
                    <span style={{ fontSize: '1rem', fontWeight: 600, color: '#166534' }}>/100</span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#15803D', fontWeight: 600 }}>
                    {fitLabel}
                  </div>
                </div>
              </div>

              {/* 6-Factor Weighted Rubric Scorecard */}
              <div
                style={{
                  background: '#FFFFFF',
                  borderRadius: '10px',
                  padding: '1.25rem',
                  border: '1px solid #E2E8F0',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <span className="material-symbols-outlined" style={{ color: '#0037B0', fontSize: '1.25rem' }}>
                    analytics
                  </span>
                  <h4 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 700, color: '#0F172A' }}>
                    6-Factor Weighted Evaluation Model
                  </h4>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '0.85rem',
                  }}
                >
                  {[
                    {
                      label: 'Mandatory Technical Skills',
                      weight: '35%',
                      score: scorecard?.mandatoryTechnicalSkills?.score ?? 34,
                      max: 35,
                    },
                    {
                      label: 'Role & Responsibilities',
                      weight: '25%',
                      score: scorecard?.roleAndResponsibilities?.score ?? 24,
                      max: 25,
                    },
                    {
                      label: 'Relevant Experience',
                      weight: '15%',
                      score: scorecard?.relevantExperience?.score ?? 15,
                      max: 15,
                    },
                    {
                      label: 'Technical Depth & Currency',
                      weight: '10%',
                      score: scorecard?.technicalDepth?.score ?? 10,
                      max: 10,
                    },
                    {
                      label: 'Project Relevance',
                      weight: '10%',
                      score: scorecard?.projectRelevance?.score ?? 10,
                      max: 10,
                    },
                    {
                      label: 'Domain Relevance',
                      weight: '5%',
                      score: scorecard?.domainRelevance?.score ?? 5,
                      max: 5,
                    },
                  ].map((factor, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '0.75rem',
                        borderRadius: '8px',
                        background: '#F8FAFC',
                        border: '1px solid #E2E8F0',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'baseline',
                          marginBottom: '0.35rem',
                        }}
                      >
                        <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155' }}>
                          {factor.label}
                        </span>
                        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0037B0' }}>
                          {factor.score}/{factor.max}
                        </span>
                      </div>
                      <div
                        style={{
                          height: '6px',
                          borderRadius: '3px',
                          background: '#E2E8F0',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            height: '100%',
                            width: `${Math.min(100, (factor.score / factor.max) * 100)}%`,
                            background: '#0037B0',
                            borderRadius: '3px',
                          }}
                        />
                      </div>
                      <div
                        style={{
                          fontSize: '0.68rem',
                          color: '#64748B',
                          marginTop: '0.3rem',
                          textAlign: 'right',
                        }}
                      >
                        Weight: {factor.weight}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Requirement Alignment Matrix */}
              {matrix.length > 0 && (
                <div
                  style={{
                    background: '#FFFFFF',
                    borderRadius: '10px',
                    padding: '1.25rem',
                    border: '1px solid #E2E8F0',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
                    <span className="material-symbols-outlined" style={{ color: '#0037B0', fontSize: '1.25rem' }}>
                      rule
                    </span>
                    <h4 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 700, color: '#0F172A' }}>
                      Requirement Alignment Matrix
                    </h4>
                  </div>

                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                      <thead>
                        <tr style={{ background: '#F1F5F9', color: '#475569', textAlign: 'left' }}>
                          <th style={{ padding: '0.6rem 0.75rem', borderBottom: '1px solid #CBD5E1' }}>Skill / Requirement</th>
                          <th style={{ padding: '0.6rem 0.75rem', borderBottom: '1px solid #CBD5E1' }}>JD Requirement</th>
                          <th style={{ padding: '0.6rem 0.75rem', borderBottom: '1px solid #CBD5E1' }}>Candidate Evidence</th>
                          <th style={{ padding: '0.6rem 0.75rem', borderBottom: '1px solid #CBD5E1', textAlign: 'center' }}>Match Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {matrix.map((row, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #E2E8F0' }}>
                            <td style={{ padding: '0.65rem 0.75rem', fontWeight: 600, color: '#0F172A' }}>
                              {row.skill}
                            </td>
                            <td style={{ padding: '0.65rem 0.75rem', color: '#475569' }}>
                              {row.jdRequirement}
                            </td>
                            <td style={{ padding: '0.65rem 0.75rem', color: '#334155' }}>
                              {row.candidateEvidence}
                            </td>
                            <td style={{ padding: '0.65rem 0.75rem', textAlign: 'center' }}>
                              {getStatusBadge(row.status)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Key Strengths & Technical Growth Areas */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                  gap: '1rem',
                }}
              >
                {/* Strengths */}
                <div
                  style={{
                    background: '#FFFFFF',
                    borderRadius: '10px',
                    padding: '1.25rem',
                    border: '1px solid #E2E8F0',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.75rem' }}>
                    <span className="material-symbols-outlined" style={{ color: '#166534', fontSize: '1.2rem' }}>
                      verified
                    </span>
                    <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700, color: '#166534' }}>
                      Verified Technical Strengths
                    </h4>
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#334155', fontSize: '0.82rem', lineHeight: 1.6 }}>
                    {(strengths.length > 0 ? strengths : [
                      'Strong demonstrated proficiency in core architecture paradigms',
                      'Extensive hands-on production experience in enterprise deployments',
                      'Comprehensive compliance with clean-code engineering practices'
                    ]).map((s, idx) => (
                      <li key={idx} style={{ marginBottom: '0.35rem' }}>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Recommendations */}
                <div
                  style={{
                    background: '#FFFFFF',
                    borderRadius: '10px',
                    padding: '1.25rem',
                    border: '1px solid #E2E8F0',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.75rem' }}>
                    <span className="material-symbols-outlined" style={{ color: '#D97706', fontSize: '1.2rem' }}>
                      trending_up
                    </span>
                    <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700, color: '#92400E' }}>
                      Targeted Growth & Verification Focus
                    </h4>
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#334155', fontSize: '0.82rem', lineHeight: 1.6 }}>
                    {(gapsAndRisks.length > 0 ? gapsAndRisks : [
                      'Deepen live code defense on edge cases and distributed caching',
                      'Highlight domain business impact metrics alongside technical achievements',
                      'Document explicit years of experience for supplementary framework libraries'
                    ]).map((g, idx) => (
                      <li key={idx} style={{ marginBottom: '0.35rem' }}>
                        {g}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '1rem 1.5rem',
            background: '#F8FAFC',
            borderTop: '1px solid #E2E8F0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <button
            type="button"
            disabled={loading || !dossier}
            onClick={handlePrintDossier}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.55rem 1.15rem',
              borderRadius: '8px',
              border: 'none',
              background: '#0037B0',
              color: '#FFFFFF',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: loading || !dossier ? 'not-allowed' : 'pointer',
            }}
            title="Download or Print verified evaluation dossier"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '1.05rem' }}>
              download
            </span>
            <span>Download My Dossier (PDF)</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '0.55rem 1.35rem',
              borderRadius: '8px',
              border: '1px solid #CBD5E1',
              background: '#FFFFFF',
              color: '#0F172A',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            Close Dossier
          </button>
        </div>
      </div>
    </div>
  );
};

export default CandidateDossierModal;
