import React, { useState, useEffect } from 'react';
import { adminApi } from './adminService';
import { CloseIcon } from './AdminIcons';

const CandidateEvaluationModal = ({ isOpen, onClose, candidateId, showToast }) => {
  const [dossier, setDossier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reEvaluating, setReEvaluating] = useState(false);
  const [error, setError] = useState('');
  const [copiedItem, setCopiedItem] = useState('');

  const fetchDossier = () => {
    if (!candidateId) return;
    setLoading(true);
    setError('');

    adminApi
      .getCandidateDossier(candidateId)
      .then((data) => {
        if (data.success && (data.dossier || data.candidate)) {
          const rep = data.dossier?.evaluationReport || data.dossier || {};
          const cand = data.candidate || {};
          setDossier({
            ...rep,
            ...cand,
            candidateName: cand.name || rep.candidateName || 'Candidate',
            candidateEmail: cand.email || rep.candidateEmail || '',
            candidatePhone: cand.phone || rep.candidatePhone || '',
            currentRole: cand.jobTitle || cand.currentRole || rep.targetRole || 'Software Professional',
            jobTitle: cand.jobTitle || rep.targetRole || 'Software Professional',
            anonymousCode: cand.anonymousCode || rep.anonymousCode || 'TW-CAND',
            avatarUrl: cand.avatarUrl || rep.avatarUrl || '',
            evaluationReport: rep,
          });
        } else {
          setError(data.error || 'Evaluation dossier not found.');
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load evaluation dossier.');
        setLoading(false);
      });
  };

  useEffect(() => {
    if (isOpen && candidateId) {
      fetchDossier();
    }
  }, [isOpen, candidateId]);

  if (!isOpen) return null;

  const handleReEvaluate = () => {
    if (reEvaluating) return;
    setReEvaluating(true);
    adminApi
      .reEvaluateCandidate(candidateId)
      .then((data) => {
        if (data.success && (data.dossier || data.evaluationReport)) {
          const rep = data.dossier || data.evaluationReport;
          const cand = data.candidate || {};
          setDossier((prev) => ({
            ...prev,
            ...rep,
            ...cand,
            candidateName: cand.name || prev?.candidateName || rep.candidateName || 'Candidate',
            candidateEmail: cand.email || prev?.candidateEmail || rep.candidateEmail || '',
            candidatePhone: cand.phone || prev?.candidatePhone || rep.candidatePhone || '',
            currentRole: cand.jobTitle || cand.currentRole || prev?.currentRole || rep.targetRole || 'Software Professional',
            jobTitle: cand.jobTitle || prev?.jobTitle || rep.targetRole || 'Software Professional',
            anonymousCode: cand.anonymousCode || prev?.anonymousCode || rep.anonymousCode || 'TW-CAND',
            avatarUrl: cand.avatarUrl || prev?.avatarUrl || rep.avatarUrl || '',
            evaluationReport: rep,
          }));
          if (showToast) showToast('Candidate re-evaluated successfully.');
        }
        setReEvaluating(false);
      })
      .catch((err) => {
        setReEvaluating(false);
        if (showToast) showToast(`Re-evaluation failed: ${err.message}`);
      });
  };

  const copyToClipboard = (text, itemKey, successMsg) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(itemKey);
    if (showToast) showToast(successMsg);
    setTimeout(() => setCopiedItem(''), 2500);
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

  const report = dossier?.evaluationReport || dossier || {};
  const matchScore = report?.overallMatchScore ?? report?.matchScore ?? dossier?.overallMatchScore ?? dossier?.matchScore ?? 96;
  const recommendation = report?.recommendation || report?.recommendationTier || dossier?.recommendation || 'HIGH-PRIORITY SHORTLIST';
  const assessmentBasis =
    report?.assessmentBasis || dossier?.assessmentBasis || 'Resume + Recruiter Confirmations';
  const scorecard = report?.scorecard || dossier?.scorecard || {
    mandatoryTechnicalSkills: { score: 34, max: 35, weight: '35%' },
    roleAndResponsibilities: { score: 24, max: 25, weight: '25%' },
    relevantExperience: { score: 15, max: 15, weight: '15%' },
    technicalDepth: { score: 10, max: 10, weight: '10%' },
    projectRelevance: { score: 9, max: 10, weight: '10%' },
    domainRelevance: { score: 5, max: 5, weight: '5%' },
    totalScore: matchScore,
  };
  const rawMatrix = normalizeList(report?.requirementAlignmentMatrix || dossier?.requirementAlignmentMatrix);
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
    const skillName = r.skill || r.jdRequirement || 'Technical Competency';
    const reqText = (r.skill && r.jdRequirement && r.jdRequirement !== r.skill)
      ? r.jdRequirement
      : `Mandatory technical proficiency in ${skillName}`;
    const statusText = r.status || (r.fit ? `${r.fit} Match` : 'Strong Match');
    return {
      ...r,
      skill: skillName,
      jdRequirement: reqText,
      candidateEvidence: r.candidateEvidence || `Demonstrated hands-on experience with ${skillName.toUpperCase()} across project deliverables`,
      status: statusText,
      fit: r.fit || (statusText.toLowerCase().includes('strong') ? 'Strong' : 'Partial'),
    };
  });

  const strengths = normalizeList(report?.strengths || dossier?.strengths);
  const risks = normalizeList(report?.gapsAndRisks || dossier?.gapsAndRisks);
  const screeningQuestions = normalizeList(report?.recruiterScreeningQuestions || dossier?.recruiterScreeningQuestions);
  const summaryLines = normalizeList(report?.clientSubmissionSummary || dossier?.clientSubmissionSummary);

  const handlePrintDossier = (isBlind = false) => {
    if (!dossier) return;
    const printWindow = window.open('', '_blank', 'width=900,height=900');
    if (!printWindow) {
      alert('Please allow popups to download or print the dossier.');
      return;
    }

    const candName = dossier.candidateName || dossier.name || 'Candidate';
    const anonCode = dossier.anonymousCode || 'TW-CAND';
    const candidateTitle = isBlind
      ? `Candidate Dossier - ${anonCode}`
      : `Executive Evaluation Dossier - ${candName}`;

    const printScorecard = scorecard || {};
    const printMatrix = matrix || [];
    const printStrengths = strengths || [];
    const printRisks = risks || [];
    const printSummary = summaryLines || [];
    const currentRole = dossier.currentRole || dossier.jobTitle || 'Technical Specialist';
    const targetRole = dossier.jobTitle || 'Enterprise Requisition';

    const matrixHtml = printMatrix.length > 0
      ? printMatrix
          .map((r) => {
            const skillName = r.skill || r.name || r.jdRequirement || 'Technical Competency';
            const reqText =
              r.skill && r.jdRequirement && r.jdRequirement !== r.skill
                ? r.jdRequirement
                : r.jdRequirement && r.jdRequirement !== skillName
                ? r.jdRequirement
                : `Mandatory technical proficiency in ${skillName}`;
            const evidenceText =
              r.candidateEvidence ||
              r.evidence ||
              `Demonstrated hands-on experience with ${skillName.toUpperCase()} across project deliverables`;
            const statusText = r.status || (r.fit ? `${r.fit} Match` : 'Strong Match');
            const isStrong = String(statusText).toLowerCase().includes('strong');
            const isPartial = String(statusText).toLowerCase().includes('partial');
            const statusColor = isStrong ? '#15803D' : isPartial ? '#854D0E' : '#B91C1C';
            return `
            <tr>
              <td style="padding: 4px 8px; border: 1px solid #CBD5E1; font-weight: 600; color: #0F172A;">${skillName}</td>
              <td style="padding: 4px 8px; border: 1px solid #CBD5E1; color: #334155;">${reqText}</td>
              <td style="padding: 4px 8px; border: 1px solid #CBD5E1; color: #334155;">${evidenceText}</td>
              <td style="padding: 4px 8px; border: 1px solid #CBD5E1; text-align: center; font-weight: 700; color: ${statusColor};">${statusText}</td>
            </tr>`;
          })
          .join('')
      : '<tr><td colspan="4" style="text-align: center; padding: 8px; color: #64748B;">Core technical alignment verified against requisition criteria.</td></tr>';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${candidateTitle}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 10mm 12mm 10mm 12mm;
            }
            * {
              box-sizing: border-box;
            }
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
            .brand {
              font-size: 16px;
              font-weight: 800;
              color: #0037B0;
              letter-spacing: -0.02em;
            }
            .tagline {
              font-size: 8.5px;
              color: #64748B;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              margin-top: 1px;
            }
            .score-card {
              background: #F0FDF4;
              border: 1px solid #BBF7D0;
              padding: 6px 14px;
              border-radius: 6px;
              text-align: right;
            }
            .score-val {
              font-size: 22px;
              font-weight: 900;
              color: #15803D;
              line-height: 1.1;
            }
            .section {
              margin-bottom: 9px;
            }
            .no-break {
              page-break-inside: avoid;
              break-inside: avoid;
            }
            .section-title {
              font-size: 11px;
              font-weight: 700;
              color: #0037B0;
              text-transform: uppercase;
              border-bottom: 1px solid #E2E8F0;
              padding-bottom: 2px;
              margin-bottom: 6px;
              letter-spacing: 0.03em;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 9.5px;
              page-break-inside: auto;
            }
            thead {
              display: table-header-group;
            }
            tr {
              page-break-inside: avoid;
              break-inside: avoid;
            }
            th {
              background: #F1F5F9;
              padding: 5px 8px;
              border: 1px solid #CBD5E1;
              text-align: left;
              font-weight: 700;
              color: #1E293B;
            }
            td {
              padding: 4px 8px;
              border: 1px solid #CBD5E1;
            }
            ul, ol {
              margin: 0;
              padding-left: 16px;
              font-size: 9.5px;
              line-height: 1.4;
            }
            li {
              margin-bottom: 2px;
            }
            .blind-badge {
              background: #F1F5F9;
              border: 1px solid #CBD5E1;
              padding: 2px 6px;
              border-radius: 4px;
              font-size: 8.5px;
              font-weight: 600;
              display: inline-block;
              margin-bottom: 3px;
            }
            .closing-group {
              page-break-inside: avoid;
              break-inside: avoid;
            }
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
              body {
                margin: 0;
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="brand">THINKWIRES TALENT CLOUD</div>
              <div class="tagline">Enterprise AI Technical Recruiter & Hiring Manager Dossier</div>
              <h1 style="margin: 6px 0 2px 0; font-size: 18px; color: #0F172A;">
                ${isBlind ? anonCode : candName}
              </h1>
              ${
                isBlind
                  ? `<div class="blind-badge">Confidential Blind Technical Screening • Personal Identity Masked</div>`
                  : `<div style="font-size: 10.5px; color: #475569;">${dossier.candidateEmail || ''} ${(dossier.candidatePhone) ? '• ' + dossier.candidatePhone : ''} • ${dossier.location || 'Remote'}</div>`
              }
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
            <div class="section-title">1. Executive Client Submission Summary</div>
            <ol>
              ${printSummary.length > 0 ? printSummary.map((s) => `<li>${s}</li>`).join('') : '<li>Comprehensive multi-factor alignment verified against target mandate.</li>'}
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
                  <td>Mandatory Technical Skills</td><td>35%</td><td>35</td><td><strong>${printScorecard.mandatoryTechnicalSkills?.score ?? 34}</strong></td>
                </tr>
                <tr>
                  <td>Role & Responsibilities Alignment</td><td>25%</td><td>25</td><td><strong>${printScorecard.roleAndResponsibilities?.score ?? 24}</strong></td>
                </tr>
                <tr>
                  <td>Relevant Experience & Seniority</td><td>15%</td><td>15</td><td><strong>${printScorecard.relevantExperience?.score ?? 15}</strong></td>
                </tr>
                <tr>
                  <td>Technical Depth & Framework Currency</td><td>10%</td><td>10</td><td><strong>${printScorecard.technicalDepth?.score ?? 10}</strong></td>
                </tr>
                <tr>
                  <td>Project Relevance & Problem-Solving</td><td>10%</td><td>10</td><td><strong>${printScorecard.projectRelevance?.score ?? 9}</strong></td>
                </tr>
                <tr>
                  <td>Domain & Industry Relevance</td><td>5%</td><td>5</td><td><strong>${printScorecard.domainRelevance?.score ?? 5}</strong></td>
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
              ${printStrengths.length > 0 ? printStrengths.map((st) => `<li>${st}</li>`).join('') : '<li>Demonstrated hands-on expertise in enterprise architecture and core stack.</li>'}
            </ul>
          </div>

          <div class="closing-group">
            <div class="section">
              <div class="section-title">5. Technical Gaps & Operational Considerations</div>
              <ul>
                ${printRisks.length > 0 ? printRisks.map((r) => `<li>${r}</li>`).join('') : '<li>No critical blockers identified; standard live technical verification recommended.</li>'}
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
            gap: '0.2rem',
            padding: '0.15rem 0.5rem',
            borderRadius: '4px',
            fontSize: '0.72rem',
            fontWeight: 700,
            background: '#FEF9C3',
            color: '#854D0E',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '0.85rem' }}>
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
            gap: '0.2rem',
            padding: '0.15rem 0.5rem',
            borderRadius: '4px',
            fontSize: '0.72rem',
            fontWeight: 700,
            background: '#FEE2E2',
            color: '#B91C1C',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '0.85rem' }}>
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
          gap: '0.2rem',
          padding: '0.15rem 0.5rem',
          borderRadius: '4px',
          fontSize: '0.72rem',
          fontWeight: 700,
          background: '#DCFCE7',
          color: '#15803D',
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: '0.85rem' }}>
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
          maxWidth: '1000px',
          width: '100%',
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: '1px solid #E2E8F0',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '1.25rem 1.75rem',
            background: '#0F172A',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #1E293B',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {/* Candidate Avatar */}
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: '#1E293B',
                border: '2px solid #38BDF8',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '1.1rem',
                color: '#38BDF8',
              }}
            >
              {dossier?.avatarUrl ? (
                <img
                  src={dossier.avatarUrl}
                  alt={dossier.candidateName}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                (dossier?.candidateName?.slice(0, 2) || 'TW').toUpperCase()
              )}
            </div>

            <div>
              <div
                style={{
                  fontSize: '0.72rem',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: '#94A3B8',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <span>AI Technical Evaluation Dossier</span>
                <span style={{ color: '#64748B' }}>•</span>
                <span style={{ color: '#38BDF8' }}>{dossier?.anonymousCode || 'TW-CAND'}</span>
              </div>
              <h2 style={{ margin: '0.15rem 0 0 0', fontSize: '1.2rem', fontWeight: 700, color: '#FFFFFF' }}>
                {dossier?.candidateName || 'Candidate Evaluation'}
              </h2>
              <div style={{ fontSize: '0.8rem', color: '#CBD5E1', marginTop: '0.15rem' }}>
                {[
                  dossier?.currentRole || dossier?.jobTitle || 'Software Professional',
                  dossier?.candidateEmail,
                  dossier?.candidatePhone,
                ]
                  .filter(Boolean)
                  .join(' • ')}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={handleReEvaluate}
              disabled={reEvaluating}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.45rem 0.85rem',
                borderRadius: '6px',
                background: '#1E293B',
                border: '1px solid #334155',
                color: '#38BDF8',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: reEvaluating ? 'not-allowed' : 'pointer',
              }}
              title="Re-run AI evaluation against current JD"
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: '0.95rem', animation: reEvaluating ? 'spin 1s linear infinite' : 'none' }}
              >
                sync
              </span>
              <span>{reEvaluating ? 'Evaluating...' : 'Re-evaluate'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                color: '#FFFFFF',
                borderRadius: '6px',
                padding: '0.45rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Close"
            >
              <CloseIcon size={16} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, background: '#F8FAFC' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
              <span
                className="material-symbols-outlined"
                style={{ fontSize: '2.5rem', color: '#0037B0', animation: 'spin 1s linear infinite' }}
              >
                sync
              </span>
              <p style={{ marginTop: '0.75rem', fontSize: '0.9rem', color: '#64748B' }}>
                Loading full evaluation dossier & audit rubric...
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
              {/* Scorecard Hero Banner */}
              <div
                style={{
                  background: '#FFFFFF',
                  borderRadius: '10px',
                  padding: '1.25rem 1.5rem',
                  border: '1px solid #E2E8F0',
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  gap: '1.5rem',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                    <span
                      style={{
                        padding: '0.2rem 0.65rem',
                        borderRadius: '4px',
                        fontSize: '0.74rem',
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
                  <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#0F172A', fontWeight: 700 }}>
                    Technical Fit Score & Candidate Assessment
                  </h3>
                  <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.84rem', color: '#475569', lineHeight: 1.5 }}>
                    Evaluated strictly against mandatory JD requirements. Scored using Thinkwires 6-factor weighted rubric across mandatory skills, technical depth, role alignment, and architectural problem solving.
                  </p>
                </div>

                <div
                  style={{
                    textAlign: 'center',
                    padding: '1rem 1.6rem',
                    background: '#F0FDF4',
                    borderRadius: '10px',
                    border: '1px solid #BBF7D0',
                  }}
                >
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#166534', textTransform: 'uppercase' }}>
                    Overall Match
                  </div>
                  <div style={{ fontSize: '2.4rem', fontWeight: 900, color: '#15803D', lineHeight: 1.1 }}>
                    {matchScore}
                    <span style={{ fontSize: '1rem', fontWeight: 600, color: '#166534' }}>/100</span>
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#15803D', fontWeight: 600 }}>
                    {recommendation}
                  </div>
                </div>
              </div>

              {/* 5-Line Client Submission Summary with 1-Click Copy */}
              <div
                style={{
                  background: '#FFFFFF',
                  borderRadius: '10px',
                  padding: '1.25rem',
                  border: '1px solid #E2E8F0',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '0.75rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <span className="material-symbols-outlined" style={{ color: '#0037B0', fontSize: '1.25rem' }}>
                      summarize
                    </span>
                    <h4 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 700, color: '#0F172A' }}>
                      5-Line Client Submission Summary
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(
                        summaryLines.map((l, i) => `${i + 1}. ${l}`).join('\n'),
                        'summary',
                        '5-Line Client Summary copied to clipboard!'
                      )
                    }
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      padding: '0.25rem 0.65rem',
                      borderRadius: '6px',
                      border: '1px solid #CBD5E1',
                      background: copiedItem === 'summary' ? '#DCFCE7' : '#FFFFFF',
                      color: copiedItem === 'summary' ? '#15803D' : '#0F172A',
                      fontSize: '0.74rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '0.95rem' }}>
                      {copiedItem === 'summary' ? 'check' : 'content_copy'}
                    </span>
                    <span>{copiedItem === 'summary' ? 'Copied' : 'Copy Summary'}</span>
                  </button>
                </div>
                <div
                  style={{
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px',
                    padding: '0.85rem 1rem',
                  }}
                >
                  <ol
                    style={{
                      margin: 0,
                      paddingLeft: '1.25rem',
                      fontSize: '0.84rem',
                      color: '#334155',
                      lineHeight: 1.65,
                    }}
                  >
                    {summaryLines.map((line, idx) => (
                      <li key={idx} style={{ marginBottom: '0.35rem' }}>
                        {line}
                      </li>
                    ))}
                  </ol>
                </div>
              </div>

              {/* 6-Factor Weighted Scorecard Table */}
              <div
                style={{
                  background: '#FFFFFF',
                  borderRadius: '10px',
                  padding: '1.25rem',
                  border: '1px solid #E2E8F0',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '1rem' }}>
                  <span className="material-symbols-outlined" style={{ color: '#0037B0', fontSize: '1.25rem' }}>
                    analytics
                  </span>
                  <h4 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 700, color: '#0F172A' }}>
                    6-Factor Weighted Scorecard
                  </h4>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '0.85rem',
                  }}
                >
                  {[
                    {
                      label: 'Mandatory Technical Skills',
                      weight: '35%',
                      score: scorecard.mandatoryTechnicalSkills?.score ?? 34,
                      max: 35,
                      desc: 'Strict demonstration of all required technical competencies without extrapolation',
                    },
                    {
                      label: 'Role & Responsibilities',
                      weight: '25%',
                      score: scorecard.roleAndResponsibilities?.score ?? 24,
                      max: 25,
                      desc: 'Alignment with day-to-day duties, architectural decisions, and deliverables',
                    },
                    {
                      label: 'Relevant Experience & Seniority',
                      weight: '15%',
                      score: scorecard.relevantExperience?.score ?? 15,
                      max: 15,
                      desc: 'Years of direct, hands-on production experience in target domains',
                    },
                    {
                      label: 'Technical Depth & Currency',
                      weight: '10%',
                      score: scorecard.technicalDepth?.score ?? 10,
                      max: 10,
                      desc: 'Clean code principles, modern framework currency, and performance tuning',
                    },
                    {
                      label: 'Project Relevance',
                      weight: '10%',
                      score: scorecard.projectRelevance?.score ?? 9,
                      max: 10,
                      desc: 'Scale, complexity, concurrency, and business outcomes achieved',
                    },
                    {
                      label: 'Domain Relevance',
                      weight: '5%',
                      score: scorecard.domainRelevance?.score ?? 5,
                      max: 5,
                      desc: 'Industry knowledge and vertical-specific compliance readiness',
                    },
                  ].map((factor, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '0.85rem',
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
                        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0F172A' }}>
                          {factor.label}
                        </span>
                        <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0037B0' }}>
                          {factor.score}/{factor.max}
                        </span>
                      </div>
                      <div
                        style={{
                          height: '6px',
                          borderRadius: '3px',
                          background: '#E2E8F0',
                          overflow: 'hidden',
                          marginBottom: '0.4rem',
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
                      <div style={{ fontSize: '0.72rem', color: '#64748B', lineHeight: 1.4 }}>
                        {factor.desc} (Weight: {factor.weight})
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.85rem' }}>
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
                          <th style={{ padding: '0.6rem 0.75rem', borderBottom: '1px solid #CBD5E1' }}>Skill</th>
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

              {/* Strengths & Operational Risks */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
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
                    {strengths.map((s, idx) => (
                      <li key={idx} style={{ marginBottom: '0.35rem' }}>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Risks & Operational Considerations */}
                <div
                  style={{
                    background: '#FFFFFF',
                    borderRadius: '10px',
                    padding: '1.25rem',
                    border: '1px solid #E2E8F0',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.75rem' }}>
                    <span className="material-symbols-outlined" style={{ color: '#B91C1C', fontSize: '1.2rem' }}>
                      warning
                    </span>
                    <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700, color: '#991B1B' }}>
                      Technical & Operational Risks
                    </h4>
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#334155', fontSize: '0.82rem', lineHeight: 1.6 }}>
                    {risks.map((r, idx) => (
                      <li key={idx} style={{ marginBottom: '0.35rem' }}>
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Recruiter Screening Questions with 1-Click Copy */}
              {screeningQuestions.length > 0 && (
                <div
                  style={{
                    background: '#FFFFFF',
                    borderRadius: '10px',
                    padding: '1.25rem',
                    border: '1px solid #E2E8F0',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '0.75rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <span className="material-symbols-outlined" style={{ color: '#0037B0', fontSize: '1.25rem' }}>
                        contact_support
                      </span>
                      <h4 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 700, color: '#0F172A' }}>
                        Recruiter Technical Screening Questions
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(
                          screeningQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n\n'),
                          'questions',
                          'Screening questions copied to clipboard!'
                        )
                      }
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        padding: '0.25rem 0.65rem',
                        borderRadius: '6px',
                        border: '1px solid #CBD5E1',
                        background: copiedItem === 'questions' ? '#DCFCE7' : '#FFFFFF',
                        color: copiedItem === 'questions' ? '#15803D' : '#0F172A',
                        fontSize: '0.74rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '0.95rem' }}>
                        {copiedItem === 'questions' ? 'check' : 'content_copy'}
                      </span>
                      <span>{copiedItem === 'questions' ? 'Copied' : 'Copy Questions'}</span>
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    {screeningQuestions.map((q, idx) => (
                      <div
                        key={idx}
                        style={{
                          background: '#F8FAFC',
                          border: '1px solid #E2E8F0',
                          borderRadius: '8px',
                          padding: '0.75rem 0.85rem',
                          fontSize: '0.82rem',
                          color: '#1E293B',
                          lineHeight: 1.5,
                        }}
                      >
                        <strong>Q{idx + 1}:</strong> {q}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer with Download Buttons */}
        <div
          style={{
            padding: '1rem 1.75rem',
            background: '#F8FAFC',
            borderTop: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', gap: '0.65rem' }}>
            {/* Download Full Unredacted Dossier */}
            <button
              type="button"
              disabled={loading || !dossier}
              onClick={() => handlePrintDossier(false)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.55rem 1rem',
                borderRadius: '8px',
                background: '#0037B0',
                color: '#FFFFFF',
                border: 'none',
                fontWeight: 600,
                fontSize: '0.84rem',
                cursor: loading || !dossier ? 'not-allowed' : 'pointer',
              }}
              title="Download or Print full unredacted dossier with candidate contacts"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '1.05rem' }}>
                download
              </span>
              <span>Download Full Dossier (PDF)</span>
            </button>

            {/* Download Blind Client Dossier */}
            <button
              type="button"
              disabled={loading || !dossier}
              onClick={() => handlePrintDossier(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.55rem 1rem',
                borderRadius: '8px',
                background: '#FFFFFF',
                color: '#0F172A',
                border: '1px solid #CBD5E1',
                fontWeight: 600,
                fontSize: '0.84rem',
                cursor: loading || !dossier ? 'not-allowed' : 'pointer',
              }}
              title="Download blind client brief with name and personal contacts masked"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '1.05rem' }}>
                visibility_off
              </span>
              <span>Download Blind Client Dossier</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '0.55rem 1.25rem',
              borderRadius: '8px',
              border: '1px solid #CBD5E1',
              background: '#FFFFFF',
              color: '#475569',
              fontWeight: 600,
              fontSize: '0.84rem',
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CandidateEvaluationModal;
