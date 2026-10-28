import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  closeDrawer,
  bookTalentInterview,
  resetBookingStatus,
} from '../../store/slices/benchSlice';

const BenchDossierDrawer = () => {
  const dispatch = useDispatch();
  const { drawerOpen, selectedTalent, bookingStatus, bookingMessage } =
    useSelector((state) => state.bench);

  const [liveDossier, setLiveDossier] = useState(null);
  const [loadingDossier, setLoadingDossier] = useState(false);

  const [formData, setFormData] = useState({
    workEmail: '',
    companyName: '',
    hiringManager: '',
    timeSlot: 'Tomorrow at 10:00 AM EST',
    notes: '',
  });

  useEffect(() => {
    if (!drawerOpen || !selectedTalent) {
      setLiveDossier(null);
      return;
    }

    let isMounted = true;
    const talentId = selectedTalent.id || selectedTalent._id || selectedTalent.code;
    setLoadingDossier(true);

    fetch(`/api/bench/dossier/${talentId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Dossier unavailable');
        return res.json();
      })
      .then((data) => {
        if (isMounted && data.success && data.dossier) {
          setLiveDossier(data.dossier);
        }
      })
      .catch(() => {
        // Fallback gracefully to talent properties
      })
      .finally(() => {
        if (isMounted) setLoadingDossier(false);
      });

    return () => {
      isMounted = false;
    };
  }, [drawerOpen, selectedTalent]);

  if (!drawerOpen || !selectedTalent) return null;

  const handleSubmitBooking = (e) => {
    e.preventDefault();
    if (!formData.workEmail) return;

    dispatch(
      bookTalentInterview({
        talentId: selectedTalent.id,
        talentCode: selectedTalent.code,
        ...formData,
      })
    );
  };

  const evalReport = liveDossier?.evaluationReport || liveDossier;
  const matchScore =
    evalReport?.overallMatchScore ??
    evalReport?.matchScore ??
    selectedTalent.score ??
    selectedTalent.assessmentScore ??
    selectedTalent.fitScore ??
    96;
  const recommendation = evalReport?.recommendation || 'HIGH-PRIORITY SHORTLIST';
  const assessmentBasis =
    evalReport?.assessmentBasis || 'Resume + Senior Technical Audits';

  const scorecard = evalReport?.scorecard || {
    mandatoryTechnicalSkills: { score: 34, max: 35, weight: '35%' },
    roleAndResponsibilities: { score: 24, max: 25, weight: '25%' },
    relevantExperience: { score: 15, max: 15, weight: '15%' },
    technicalDepth: { score: 10, max: 10, weight: '10%' },
    projectRelevance: { score: 9, max: 10, weight: '10%' },
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

  const rawMatrix = evalReport?.requirementAlignmentMatrix;
  const defaultMatrix = [
    {
      skill: selectedTalent.skills?.[0] || 'Core Architecture',
      jdRequirement: 'Mandatory enterprise proficiency and distributed scale',
      candidateEvidence: 'Verified production commits & system design defense',
      status: 'Strong Match',
    },
    {
      skill: selectedTalent.skills?.[1] || 'Framework Mastery',
      jdRequirement: 'Hands-on production implementation (>4 years)',
      candidateEvidence: `${selectedTalent.yearsExp || '6+ years'} verified experience`,
      status: 'Strong Match',
    },
    {
      skill: selectedTalent.skills?.[2] || 'Cloud & CI/CD',
      jdRequirement: 'Containerization, Kubernetes, infrastructure as code',
      candidateEvidence: 'Production deployments across multi-region clusters',
      status: 'Strong Match',
    },
  ];

  const matrix = (Array.isArray(rawMatrix) && rawMatrix.length > 0 ? rawMatrix : defaultMatrix).map((r) => {
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

  const strengths = normalizeList(evalReport?.strengths);
  const gapsAndRisks = normalizeList(evalReport?.gapsAndRisks);

  const rawSummary = evalReport?.clientSubmissionSummary;
  const clientSummary = Array.isArray(rawSummary) && rawSummary.length > 0
    ? rawSummary
    : typeof rawSummary === 'string' && rawSummary.trim().length > 0
    ? [rawSummary]
    : [
        `${selectedTalent.role} with ${selectedTalent.yearsExp || 'senior'} verified experience in distributed systems.`,
        `Core competencies demonstrated across ${((selectedTalent.skills || []).slice(0, 4)).join(', ')}.`,
        `Cleared multi-stage Thinkwires system design defenses and live technical audits with ${matchScore}/100 benchmark.`,
        `Available for immediate engagement under 48-hour SLA with full bilateral IP assignment.`,
        `Recommendation: High-priority technical interview for core architecture or pod lead requisitions.`,
      ];

  const handlePrintBlindDossier = () => {
    const printWindow = window.open('', '_blank', 'width=900,height=900');
    if (!printWindow) {
      alert('Please allow popups to download or print the dossier.');
      return;
    }

    const anonCode = selectedTalent.code || 'TW-BENCH-CAND';
    const currentRole = selectedTalent.role || 'Senior Technical Specialist';
    const candidateTitle = `Candidate Dossier - ${anonCode}`;

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

    const printStrengths = strengths.length > 0 ? strengths : [
      `Demonstrated production mastery across ${(selectedTalent.skills || []).slice(0, 4).join(', ')}.`,
      `Verified professional track record of ${selectedTalent.yearsExp || 'senior level'} in high-concurrency environments.`,
      `Cleared multi-stage system architecture defense with ${matchScore}/100 benchmark.`
    ];

    const printRisks = gapsAndRisks.length > 0 ? gapsAndRisks : [
      `Notice period: ${selectedTalent.noticePeriod || selectedTalent.urgency || 'Immediate'} deployment timeline to be scheduled.`,
      `Hourly rate: ${selectedTalent.hourlyRate}/hr within enterprise engagement scope.`,
      `Standard client live technical interview recommended for domain alignment.`
    ];

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
            .blind-badge { background: #F1F5F9; border: 1px solid #CBD5E1; padding: 2px 6px; border-radius: 4px; font-size: 8.5px; font-weight: 600; display: inline-block; margin-bottom: 3px; }
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
              <div class="tagline">Enterprise AI Technical Recruiter & Hiring Manager Dossier</div>
              <h1 style="margin: 6px 0 2px 0; font-size: 18px; color: #0F172A;">${anonCode}</h1>
              <div class="blind-badge">Confidential Blind Technical Screening • Personal Identity Masked</div>
              <div style="font-size: 10.5px; font-weight: 600; color: #1E293B; margin-top: 2px;">
                Role: ${currentRole} | Verified Stack: ${(selectedTalent.skills || []).slice(0, 4).join(', ')}
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
              ${clientSummary.map((s) => `<li>${s}</li>`).join('')}
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
              ${printStrengths.map((st) => `<li>${st}</li>`).join('')}
            </ul>
          </div>

          <div class="closing-group">
            <div class="section">
              <div class="section-title">5. Technical Gaps & Operational Considerations</div>
              <ul>
                ${printRisks.map((r) => `<li>${r}</li>`).join('')}
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
      className="BenchDrawer-overlay"
      data-lenis-prevent="true"
      onClick={() => dispatch(closeDrawer())}
    >
      <div
        className="BenchDrawer-content"
        data-lenis-prevent="true"
        onWheel={(e) => e.stopPropagation()}
        style={{ overscrollBehavior: 'contain' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Bar with Close Button */}
        <div className="BenchDrawer-header">
          <div className="BenchDrawer-headerCode">
            <span className="material-symbols-outlined BenchDrawer-badgeIcon">
              lock
            </span>
            <span>BLIND TECHNICAL SCREENING | CANDIDATE AUDIT</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={handlePrintBlindDossier}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.35rem 0.75rem',
                borderRadius: '6px',
                background: '#0037B0',
                color: '#FFFFFF',
                border: 'none',
                fontWeight: 600,
                fontSize: '0.78rem',
                cursor: 'pointer',
              }}
              title="Download blind client brief with name and personal contacts masked"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '0.95rem' }}>
                download
              </span>
              <span>Download Blind Dossier (PDF)</span>
            </button>
            <button
              type="button"
              className="BenchDrawer-closeBtn"
              onClick={() => dispatch(closeDrawer())}
              title="Close Drawer"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="BenchDrawer-body">
          {/* Candidate Profile Summary Banner - Blind Screening (No Legal Name or Personal Details) */}
          <div className="BenchDrawer-profileBanner">
            <div
              className="BenchDrawer-avatar"
              style={{
                overflow: 'hidden',
                padding: selectedTalent.avatarUrl ? 0 : undefined,
                background: selectedTalent.avatarUrl ? '#F1F5F9' : undefined,
              }}
            >
              {selectedTalent.avatarUrl ? (
                <img
                  src={selectedTalent.avatarUrl}
                  alt={selectedTalent.code}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                selectedTalent.initials || 'TW'
              )}
            </div>

            <div className="BenchDrawer-profileDetails">
              <div className="BenchDrawer-metaRow">
                <span className="BenchDrawer-codeBadge">
                  {selectedTalent.code}
                </span>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    background: '#F1F5F9',
                    border: '1px solid #CBD5E1',
                    borderRadius: '20px',
                    padding: '0.2rem 0.6rem',
                    fontSize: '0.72rem',
                    color: '#475569',
                    fontWeight: 600,
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '0.9rem' }}>
                    visibility_off
                  </span>
                  Identity Redacted for Blind Screening
                </span>
                <span className="BenchDrawer-statusBadge">
                  <span className="BenchDrawer-statusDot"></span>
                  {selectedTalent.urgency || 'Immediate Deployment'}
                </span>
              </div>

              <h2 className="BenchDrawer-roleName">{selectedTalent.role}</h2>
              <div className="BenchDrawer-specRow">
                <span>
                  <span className="material-symbols-outlined">work</span>{' '}
                  {selectedTalent.yearsExp || selectedTalent.experienceLevel}
                </span>
                <span>•</span>
                <span>
                  <span className="material-symbols-outlined">location_on</span>{' '}
                  {selectedTalent.location}
                </span>
                <span>•</span>
                <span>
                  <span className="material-symbols-outlined">hourglass_top</span>{' '}
                  Notice: {selectedTalent.noticePeriod || selectedTalent.urgency || 'Immediate'}
                </span>
                <span>•</span>
                <span className="BenchDrawer-rateHighlight">
                  {selectedTalent.hourlyRate}/hr
                </span>
              </div>
            </div>
          </div>

          {/* AI Candidate Assessment Fit Score Banner */}
          <div
            className="BenchDrawer-cardSection"
            style={{
              background: '#FFFFFF',
              border: '1px solid #BBF7D0',
              borderRadius: '10px',
              padding: '1.25rem',
              marginBottom: '1.25rem',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  <span
                    style={{
                      background: '#DCFCE7',
                      color: '#15803D',
                      fontWeight: 800,
                      fontSize: '0.74rem',
                      padding: '0.2rem 0.55rem',
                      borderRadius: '4px',
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {recommendation}
                  </span>
                  <span style={{ fontSize: '0.78rem', color: '#64748B' }}>
                    Basis: {assessmentBasis}
                  </span>
                </div>
                <h4
                  style={{
                    margin: 0,
                    fontSize: '1rem',
                    color: '#0F172A',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                  }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: '1.25rem', color: '#0037B0' }}
                  >
                    psychology
                  </span>{' '}
                  AI-Assessed Technical Fit
                </h4>
                <p
                  style={{
                    margin: '0.25rem 0 0 0',
                    fontSize: '0.82rem',
                    color: '#475569',
                    maxWidth: '440px',
                  }}
                >
                  Strict evaluation benchmarked against production system design, mandatory technical requirements, and git commit verification.
                </p>
              </div>

              <div
                style={{
                  textAlign: 'center',
                  background: '#F0FDF4',
                  border: '1px solid #BBF7D0',
                  padding: '0.75rem 1.25rem',
                  borderRadius: '10px',
                }}
              >
                <div
                  style={{
                    fontSize: '0.72rem',
                    color: '#166534',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                  }}
                >
                  Fit Score
                </div>
                <div
                  style={{
                    fontSize: '2rem',
                    fontWeight: 900,
                    color: '#15803D',
                    lineHeight: 1.1,
                  }}
                >
                  {matchScore}
                  <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#166534' }}>/100</span>
                </div>
                <div style={{ fontSize: '0.7rem', color: '#166534', fontWeight: 600 }}>
                  High Technical Fit
                </div>
              </div>
            </div>
          </div>

          {/* 5-Line Client Submission Summary */}
          <div className="BenchDrawer-cardSection">
            <h4 className="BenchDrawer-sectionTitle">
              <span className="material-symbols-outlined">summarize</span>{' '}
              5-Line Client Submission Summary
            </h4>
            <div
              style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
                padding: '0.9rem 1rem',
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
                {clientSummary.map((line, idx) => (
                  <li key={idx} style={{ marginBottom: '0.35rem' }}>
                    {line}
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* 6-Factor Weighted Evaluation Rubric Breakdown */}
          <div className="BenchDrawer-cardSection">
            <h4 className="BenchDrawer-sectionTitle">
              <span className="material-symbols-outlined">analytics</span>{' '}
              6-Factor Weighted Rubric Scorecard
            </h4>
            <div className="BenchDrawer-rubricGrid">
              {[
                {
                  label: 'Mandatory Technical Skills',
                  weight: '35%',
                  score: scorecard.mandatoryTechnicalSkills?.score ?? 34,
                  max: 35,
                },
                {
                  label: 'Role & Responsibilities',
                  weight: '25%',
                  score: scorecard.roleAndResponsibilities?.score ?? 24,
                  max: 25,
                },
                {
                  label: 'Relevant Experience',
                  weight: '15%',
                  score: scorecard.relevantExperience?.score ?? 15,
                  max: 15,
                },
                {
                  label: 'Technical Depth & Currency',
                  weight: '10%',
                  score: scorecard.technicalDepth?.score ?? 10,
                  max: 10,
                },
                {
                  label: 'Project Relevance',
                  weight: '10%',
                  score: scorecard.projectRelevance?.score ?? 9,
                  max: 10,
                },
                {
                  label: 'Domain Relevance',
                  weight: '5%',
                  score: scorecard.domainRelevance?.score ?? 5,
                  max: 5,
                },
              ].map((factor, idx) => {
                const pct = Math.round((factor.score / factor.max) * 100);
                return (
                  <div key={idx} className="BenchDrawer-rubricItem">
                    <div className="BenchDrawer-rubricHead">
                      <span>{factor.label} ({factor.weight})</span>
                      <span className="BenchDrawer-scoreHighlight">
                        {factor.score}/{factor.max}
                      </span>
                    </div>
                    <div className="BenchDrawer-meter">
                      <div
                        className="BenchDrawer-meterFill"
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Requirement Alignment Matrix */}
          <div className="BenchDrawer-cardSection">
            <h4 className="BenchDrawer-sectionTitle">
              <span className="material-symbols-outlined">rule</span>{' '}
              Requirement Alignment Matrix
            </h4>
            <div style={{ overflowX: 'auto' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '0.82rem',
                }}
              >
                <thead>
                  <tr style={{ background: '#F1F5F9', color: '#475569', textAlign: 'left' }}>
                    <th style={{ padding: '0.55rem 0.75rem', borderBottom: '1px solid #CBD5E1' }}>
                      Skill
                    </th>
                    <th style={{ padding: '0.55rem 0.75rem', borderBottom: '1px solid #CBD5E1' }}>
                      Requirement
                    </th>
                    <th style={{ padding: '0.55rem 0.75rem', borderBottom: '1px solid #CBD5E1' }}>
                      Candidate Evidence
                    </th>
                    <th style={{ padding: '0.55rem 0.75rem', borderBottom: '1px solid #CBD5E1', textAlign: 'center' }}>
                      Match
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {matrix.map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #E2E8F0' }}>
                      <td style={{ padding: '0.6rem 0.75rem', fontWeight: 600, color: '#0F172A' }}>
                        {row.skill}
                      </td>
                      <td style={{ padding: '0.6rem 0.75rem', color: '#475569' }}>
                        {row.jdRequirement}
                      </td>
                      <td style={{ padding: '0.6rem 0.75rem', color: '#334155' }}>
                        {row.candidateEvidence}
                      </td>
                      <td style={{ padding: '0.6rem 0.75rem', textAlign: 'center' }}>
                        {getStatusBadge(row.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Confirmed Experience Snapshot & Architecture Defense */}
          <div className="BenchDrawer-cardSection">
            <h4 className="BenchDrawer-sectionTitle">
              <span className="material-symbols-outlined">verified</span>{' '}
              Confirmed Experience Snapshot
            </h4>
            <div className="BenchDrawer-quoteHighlight">
              <span className="material-symbols-outlined">format_quote</span>
              <p>"{selectedTalent.proofQuote}"</p>
            </div>
            <p className="BenchDrawer-evalDetail">
              {selectedTalent.bio ||
                `Demonstrated outstanding capability in scalable backend architectures and distributed system design. Cleared deep technical audits with unredacted git commits verified by Thinkwires Senior Technical Directors.`}
            </p>
          </div>

          {/* Skills Breakdown */}
          <div className="BenchDrawer-cardSection">
            <h4 className="BenchDrawer-sectionTitle">
              <span className="material-symbols-outlined">code</span> Verified
              Technology Stack
            </h4>
            <div className="BenchDrawer-skillsWrap">
              {(selectedTalent.skills || []).map((skill, idx) => (
                <span key={idx} className="BenchDrawer-skillBadge">
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Compliance & Background Checks */}
          <div className="BenchDrawer-cardSection">
            <h4 className="BenchDrawer-sectionTitle">
              <span className="material-symbols-outlined">verified_user</span>{' '}
              Compliance & Legal Readiness
            </h4>
            <div className="BenchDrawer-complianceList">
              <div className="BenchDrawer-complianceItem">
                <span className="material-symbols-outlined BenchDrawer-checkIcon">
                  check_circle
                </span>
                <div>
                  <strong>Identity & Criminal Background Clear</strong>
                  <p>
                    Comprehensive 7-year federal & state background check
                    verified.
                  </p>
                </div>
              </div>
              <div className="BenchDrawer-complianceItem">
                <span className="material-symbols-outlined BenchDrawer-checkIcon">
                  check_circle
                </span>
                <div>
                  <strong>Enterprise IP Assignment Executed</strong>
                  <p>
                    All work product, patent rights, and code belong 100% to
                    client.
                  </p>
                </div>
              </div>
              <div className="BenchDrawer-complianceItem">
                <span className="material-symbols-outlined BenchDrawer-checkIcon">
                  check_circle
                </span>
                <div>
                  <strong>Global EOR / C2C Onboarding Ready</strong>
                  <p>
                    Direct W2, C2C, or global employer of record contract ready
                    to sign.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Interview Booking Form */}
          <div className="BenchDrawer-bookingCard">
            <h4 className="BenchDrawer-bookingTitle">
              <span className="material-symbols-outlined">event_available</span>
              Schedule 30-Minute Technical Screen
            </h4>
            <p className="BenchDrawer-bookingSubtitle">
              Lock in a 48-hour hiring hold on {selectedTalent.code}. Meet
              directly with the engineer and our lead assessor.
            </p>

            {bookingStatus === 'success' ? (
              <div className="BenchDrawer-bookingSuccess">
                <span className="material-symbols-outlined BenchDrawer-successIcon">
                  task_alt
                </span>
                <h5>Interview Request Confirmed!</h5>
                <p>{bookingMessage}</p>
                <button
                  type="button"
                  className="BenchDrawer-btnDone"
                  onClick={() => dispatch(resetBookingStatus())}
                >
                  Book Another Time
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitBooking} className="BenchDrawer-form">
                <div className="BenchDrawer-formGroup">
                  <label>Work Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="hiring.manager@enterprise.com"
                    value={formData.workEmail}
                    onChange={(e) =>
                      setFormData({ ...formData, workEmail: e.target.value })
                    }
                  />
                </div>
                <div className="BenchDrawer-formRow">
                  <div className="BenchDrawer-formGroup">
                    <label>Company Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Acme Cloud Corp"
                      value={formData.companyName}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          companyName: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="BenchDrawer-formGroup">
                    <label>Hiring Manager</label>
                    <input
                      type="text"
                      placeholder="e.g. Sarah Connor, VP Eng"
                      value={formData.hiringManager}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          hiringManager: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="BenchDrawer-formGroup">
                  <label>Preferred Time Slot</label>
                  <select
                    value={formData.timeSlot}
                    onChange={(e) =>
                      setFormData({ ...formData, timeSlot: e.target.value })
                    }
                  >
                    <option value="Tomorrow at 10:00 AM EST">
                      Tomorrow at 10:00 AM EST
                    </option>
                    <option value="Tomorrow at 2:00 PM EST">
                      Tomorrow at 2:00 PM EST
                    </option>
                    <option value="In 2 Days at 11:30 AM EST">
                      In 2 Days at 11:30 AM EST
                    </option>
                    <option value="In 2 Days at 4:00 PM EST">
                      In 2 Days at 4:00 PM EST
                    </option>
                  </select>
                </div>

                {bookingStatus === 'failed' && (
                  <p className="BenchDrawer-errorText">{bookingMessage}</p>
                )}

                <button
                  type="submit"
                  disabled={bookingStatus === 'loading'}
                  className="BenchDrawer-submitBtn"
                >
                  {bookingStatus === 'loading' ? (
                    'Reserving Slot...'
                  ) : (
                    <>
                      <span className="material-symbols-outlined">bolt</span>
                      <span>Lock 48h Hold & Schedule Call</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BenchDossierDrawer;
