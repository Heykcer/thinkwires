import React, { useState, useEffect } from 'react';
import { getApiBaseUrl, getCandidateAuthHeaders } from '../../utils/apiConfig';

/**
 * ScreeningAssessmentModal
 *
 * Proctored 10-Question AI Screening Assessment Gatekeeper:
 * - 7 Multiple Choice Questions (MCQs)
 * - 2 Situational System Design / Trade-off Scenarios
 * - 1 Practical Code Exercise
 *
 * Connects directly to backend assessment endpoints:
 * - GET  /api/candidate/applications/:applicationId/assessment
 * - POST /api/candidate/applications/:applicationId/assessment/submit
 */
const ScreeningAssessmentModal = ({
  isOpen = true,
  onClose,
  applicationId,
  initialAssessment = null,
  onComplete,
  onCompleted,
}) => {
  const [assessment, setAssessment] = useState(initialAssessment);
  const [loading, setLoading] = useState(!initialAssessment);
  const [error, setError] = useState('');
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(20 * 60); // 20 minutes in seconds

  // Fetch assessment if not provided initially
  useEffect(() => {
    if (!applicationId) return;

    if (initialAssessment && initialAssessment.questions?.length) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAssessment(initialAssessment);
      setLoading(false);
      return;
    }

    let isMounted = true;
    const fetchAssessment = async () => {
      setLoading(true);
      setError('');
      try {
        const apiBase = getApiBaseUrl();
        const res = await fetch(
          `${apiBase}/candidate/applications/${applicationId}/assessment`,
          {
            headers: getCandidateAuthHeaders({ Accept: 'application/json' }),
            credentials: 'include',
          }
        );
        const data = await res.json();
        if (res.ok && isMounted) {
          setAssessment(data.assessment);
          if (data.assessment?.timeLimitMinutes) {
            setTimeLeft(data.assessment.timeLimitMinutes * 60);
          }
        } else if (isMounted) {
          setError(data.error || 'Failed to load assessment.');
        }
      } catch (err) {
        if (isMounted) setError('Network error loading assessment.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAssessment();
    return () => {
      isMounted = false;
    };
  }, [isOpen, applicationId, initialAssessment]);

  // Proctored Countdown Timer
  useEffect(() => {
    if (!isOpen || result || loading || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, result, loading, timeLeft]);

  if (!isOpen) return null;

  const questions = assessment?.questions || [];
  const currentQ = questions[currentQuestionIndex];
  const totalQuestions = questions.length;
  const currentQType = (
    currentQ?.type ||
    currentQ?.question_type ||
    (currentQ?.options && currentQ.options.length > 0
      ? 'mcq'
      : currentQ?.starter_code
        ? 'practical'
        : 'scenario')
  ).toLowerCase();
  const currentQId = currentQ?.id || `q_${currentQuestionIndex}`;

  const handleSelectMCQ = (questionId, optionIndex) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const handleTextChange = (questionId, text) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: text,
    }));
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError('');

    try {
      const apiBase = getApiBaseUrl();
      const res = await fetch(
        `${apiBase}/candidate/applications/${applicationId}/assessment/submit`,
        {
          method: 'POST',
          headers: getCandidateAuthHeaders({ 'Content-Type': 'application/json' }),
          credentials: 'include',
          body: JSON.stringify({ answers }),
        }
      );

      const data = await res.json();
      if (res.ok) {
        setResult(data.evaluation);
        if (typeof onComplete === 'function') onComplete(data.evaluation);
        if (typeof onCompleted === 'function') onCompleted(data.evaluation);
      } else {
        setError(data.error || 'Failed to submit assessment.');
      }
    } catch {
      setError('Network error submitting assessment.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div
      className="tw-modal-backdrop ScreeningAssessmentModal-overlay"
      data-lenis-prevent="true"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        padding: '1rem',
        overscrollBehavior: 'contain',
      }}
    >
      <div
        className="tw-modal-card ScreeningAssessmentModal-card"
        data-lenis-prevent="true"
        onWheel={(e) => e.stopPropagation()}
        style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '820px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          border: '1px solid #E2E8F0',
          overscrollBehavior: 'contain',
        }}
      >
        {/* Modal Header */}
        <div
          className="ScreeningAssessmentModal-header"
          style={{
            padding: '1.25rem 1.75rem',
            background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <div>
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <span
                style={{
                  background: '#008F68',
                  color: '#FFFFFF',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '0.2rem 0.5rem',
                  borderRadius: '4px',
                  textTransform: 'uppercase',
                }}
              >
                AI Gatekeeper
              </span>
              <span style={{ fontSize: '0.85rem', color: '#94A3B8' }}>
                Proctored Evaluation
              </span>
            </div>
            <h2
              className="ScreeningAssessmentModal-title"
              style={{
                fontSize: '1.25rem',
                fontWeight: 700,
                margin: '0.35rem 0 0 0',
                color: '#FFFFFF',
              }}
            >
              {assessment?.job_title || 'Technical Assessment'}
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {!result && (
              <div
                className="ScreeningAssessmentModal-timer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  background: timeLeft < 180 ? '#FEF2F2' : '#F8FAFC',
                  color: timeLeft < 180 ? '#DC2626' : '#0F172A',
                  padding: '0.4rem 0.75rem',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '0.92rem',
                  border:
                    timeLeft < 180 ? '1px solid #F87171' : '1px solid #E2E8F0',
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: '18px' }}
                >
                  schedule
                </span>
                <span>{formatTimer(timeLeft)}</span>
              </div>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close Assessment"
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94A3B8',
                cursor: 'pointer',
                padding: '0.25rem',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="ScreeningAssessmentModal-body" style={{ flex: 1, overflowY: 'auto', padding: '1.75rem' }}>
          {loading ? (
            <div
              style={{
                textAlign: 'center',
                padding: '3rem 1rem',
                color: '#64748B',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  marginBottom: '0.75rem',
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{
                    fontSize: '36px',
                    color: '#008F68',
                    animation: 'spin 1.5s linear infinite',
                  }}
                >
                  sync
                </span>
              </div>
              <p style={{ fontWeight: 600 }}>
                Synthesizing personalized AI technical assessment...
              </p>
              <p style={{ fontSize: '0.85rem' }}>
                Tailoring 10 questions to match job requirements and candidate
                background.
              </p>
            </div>
          ) : error ? (
            <div
              style={{
                padding: '1.5rem',
                background: '#FEF2F2',
                borderRadius: '8px',
                color: '#B91C1C',
              }}
            >
              <strong>Error:</strong> {error}
            </div>
          ) : result ? (
            /* ── ASSESSMENT RESULT VIEW ── */
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div
                style={{
                  width: '90px',
                  height: '90px',
                  borderRadius: '50%',
                  background: result.passed ? '#DCFCE7' : '#FEE2E2',
                  color: result.passed ? '#15803D' : '#B91C1C',
                  fontSize: '1.1rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.25rem auto',
                }}
              >
                {result.passed ? 'PASSED' : 'UNMET'}
              </div>

              <span
                style={{
                  display: 'inline-block',
                  background: result.passed ? '#008F68' : '#DC2626',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  padding: '0.35rem 0.85rem',
                  borderRadius: '9999px',
                  fontSize: '0.85rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '0.75rem',
                }}
              >
                {result.gatekeeper_status}
              </span>

              <h2
                style={{
                  fontSize: '1.75rem',
                  fontWeight: 800,
                  color: '#0F172A',
                  margin: '0 0 0.5rem 0',
                }}
              >
                Your Score: {result.total_score}%
              </h2>
              <p
                style={{
                  color: '#64748B',
                  maxWidth: '500px',
                  margin: '0 auto 1.5rem auto',
                  fontSize: '0.92rem',
                }}
              >
                {result.passed
                  ? `Congratulations! You satisfied the ${result.passing_threshold}% passing threshold. Your application has been expedited to 'Accepted - Screened' status and is now visible to client recruiters.`
                  : `Your score is below the required passing threshold of ${result.passing_threshold}%. Your application has been logged for review.`}
              </p>

              <div
                style={{
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '12px',
                  padding: '1.25rem',
                  textAlign: 'left',
                  marginBottom: '1.5rem',
                }}
              >
                <h4
                  style={{
                    margin: '0 0 0.75rem 0',
                    color: '#1E293B',
                    fontSize: '0.95rem',
                  }}
                >
                  Detailed Evaluation Breakdown
                </h4>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '0.75rem',
                  }}
                >
                  {result.detailed_feedback?.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '0.65rem 0.85rem',
                        background: '#FFFFFF',
                        border: '1px solid #E2E8F0',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '0.82rem',
                          fontWeight: 600,
                          color: '#475569',
                        }}
                      >
                        Q{idx + 1} ({(item?.type || item?.question_type || 'question').toUpperCase()})
                      </span>
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: '0.82rem',
                          color: item.earned_points > 0 ? '#16A34A' : '#DC2626',
                        }}
                      >
                        +{item.earned_points} / {item.possible_points} pts
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                style={{
                  background: '#008F68',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  padding: '0.75rem 2rem',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                }}
              >
                Return to Candidate Portal
              </button>
            </div>
          ) : (
            /* ── QUESTION DISPLAY VIEW ── */
            <div>
              {/* Question Navigation Pill Strip */}
              <div
                style={{
                  display: 'flex',
                  gap: '0.4rem',
                  overflowX: 'auto',
                  paddingBottom: '0.75rem',
                  marginBottom: '1.5rem',
                  borderBottom: '1px solid #F1F5F9',
                }}
              >
                {questions.map((q, idx) => {
                  const isAnswered =
                    answers[q.id] !== undefined && answers[q.id] !== '';
                  const isCurrent = idx === currentQuestionIndex;
                  return (
                    <button
                      key={q.id || idx}
                      type="button"
                      onClick={() => setCurrentQuestionIndex(idx)}
                      style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '8px',
                        border: isCurrent
                          ? '2px solid #008F68'
                          : '1px solid #CBD5E1',
                        background: isCurrent
                          ? '#E6F4F0'
                          : isAnswered
                            ? '#F0FDF4'
                            : '#FFFFFF',
                        color: isCurrent
                          ? '#006548'
                          : isAnswered
                            ? '#16A34A'
                            : '#475569',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                        flexShrink: 0,
                      }}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              {currentQ && (
                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '0.5rem',
                    }}
                  >
                    <span
                      style={{
                        background:
                          currentQType === 'mcq'
                            ? '#EFF6FF'
                            : currentQType === 'scenario'
                              ? '#FAF5FF'
                              : '#FFFBEB',
                        color:
                          currentQType === 'mcq'
                            ? '#2563EB'
                            : currentQType === 'scenario'
                              ? '#7E22CE'
                              : '#B45309',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '0.2rem 0.6rem',
                        borderRadius: '6px',
                        textTransform: 'uppercase',
                      }}
                    >
                      Question {currentQuestionIndex + 1} of {totalQuestions} •{' '}
                      {currentQType.toUpperCase()} ({currentQ.points || 10}{' '}
                      pts)
                    </span>
                  </div>

                  <h3
                    style={{
                      fontSize: '1.1rem',
                      fontWeight: 700,
                      color: '#0F172A',
                      lineHeight: 1.5,
                      margin: '0 0 1.25rem 0',
                    }}
                  >
                    {currentQ.question || currentQ.title}
                  </h3>

                  {/* Render based on Question Type */}
                  {currentQType === 'mcq' && (
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.75rem',
                      }}
                    >
                      {currentQ.options?.map((opt, optIdx) => {
                        const isSelected = answers[currentQId] === optIdx;
                        return (
                          <label
                            key={optIdx}
                            onClick={() => handleSelectMCQ(currentQId, optIdx)}
                            style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: '0.75rem',
                              padding: '0.85rem 1rem',
                              borderRadius: '8px',
                              border: isSelected
                                ? '2px solid #008F68'
                                : '1px solid #E2E8F0',
                              background: isSelected ? '#E6F4F0' : '#FFFFFF',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <input
                              type="radio"
                              name={currentQId}
                              checked={isSelected}
                              onChange={() =>
                                handleSelectMCQ(currentQId, optIdx)
                              }
                              style={{ marginTop: '0.2rem' }}
                            />
                            <span
                              style={{
                                fontSize: '0.92rem',
                                color: '#1E293B',
                                lineHeight: 1.45,
                              }}
                            >
                              {opt}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}

                  {currentQType === 'scenario' && (
                    <div>
                      {currentQ.scenario && (
                        <div
                          style={{
                            padding: '1rem',
                            background: '#F8FAFC',
                            border: '1px solid #E2E8F0',
                            borderRadius: '8px',
                            marginBottom: '1rem',
                            fontSize: '0.88rem',
                            color: '#334155',
                            lineHeight: 1.5,
                          }}
                        >
                          <strong>Context:</strong> {currentQ.scenario}
                        </div>
                      )}
                      <textarea
                        rows={6}
                        placeholder="Detail your architectural strategy, mitigation steps, and trade-off considerations..."
                        value={answers[currentQId] || ''}
                        onChange={(e) =>
                          handleTextChange(currentQId, e.target.value)
                        }
                        style={{
                          width: '100%',
                          padding: '0.85rem',
                          borderRadius: '8px',
                          border: '1px solid #CBD5E1',
                          fontSize: '0.9rem',
                          fontFamily: 'inherit',
                          outline: 'none',
                          resize: 'vertical',
                        }}
                      />
                    </div>
                  )}

                  {currentQType === 'practical' && (
                    <div>
                      <div
                        style={{
                          padding: '0.85rem',
                          background: '#F8FAFC',
                          borderRadius: '8px',
                          marginBottom: '1rem',
                          fontSize: '0.88rem',
                          color: '#334155',
                        }}
                      >
                        <strong>Instructions:</strong> {currentQ.instructions}
                      </div>
                      <textarea
                        rows={10}
                        placeholder="Implement your solution here..."
                        value={
                          answers[currentQId] !== undefined
                            ? answers[currentQId]
                            : currentQ.starter_code || ''
                        }
                        onChange={(e) =>
                          handleTextChange(currentQId, e.target.value)
                        }
                        style={{
                          width: '100%',
                          padding: '0.85rem',
                          borderRadius: '8px',
                          border: '1px solid #CBD5E1',
                          fontSize: '0.85rem',
                          fontFamily: 'monospace',
                          background: '#0F172A',
                          color: '#F8FAFC',
                          outline: 'none',
                          resize: 'vertical',
                        }}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        {!result && !loading && (
          <div
            className="ScreeningAssessmentModal-footer"
            style={{
              padding: '1rem 1.75rem',
              background: '#F8FAFC',
              borderTop: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <button
              type="button"
              disabled={currentQuestionIndex === 0}
              onClick={() =>
                setCurrentQuestionIndex((prev) => Math.max(prev - 1, 0))
              }
              style={{
                background: '#FFFFFF',
                border: '1px solid #CBD5E1',
                padding: '0.6rem 1.1rem',
                borderRadius: '8px',
                cursor: currentQuestionIndex === 0 ? 'not-allowed' : 'pointer',
                opacity: currentQuestionIndex === 0 ? 0.5 : 1,
                fontWeight: 600,
                fontSize: '0.88rem',
                color: '#475569',
              }}
            >
              ← Previous
            </button>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {currentQuestionIndex < totalQuestions - 1 ? (
                <button
                  type="button"
                  onClick={() =>
                    setCurrentQuestionIndex((prev) =>
                      Math.min(prev + 1, totalQuestions - 1)
                    )
                  }
                  style={{
                    background: '#008F68',
                    color: '#FFFFFF',
                    border: 'none',
                    padding: '0.6rem 1.25rem',
                    borderRadius: '8px',
                    fontWeight: 600,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                  }}
                >
                  Next Question →
                </button>
              ) : (
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleSubmit}
                  style={{
                    background: '#008F68',
                    color: '#FFFFFF',
                    border: 'none',
                    padding: '0.6rem 1.5rem',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 6px -1px rgba(0, 143, 104, 0.4)',
                  }}
                >
                  {submitting ? 'Evaluating Answers...' : 'Submit Assessment'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScreeningAssessmentModal;
