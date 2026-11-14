import React from 'react';
import ScrollReveal from '../common/ScrollReveal';

const EorCapabilities = ({ data }) => {
  if (!data) return null;
  const { eyebrow, heading, description, capabilities = [] } = data;

  return (
    <section
      className="Payroll-sectionShell"
      style={{ backgroundColor: 'var(--color-surface-container-low, #f3f2fe)' }}
    >
      <div className="Payroll-sectionContainer Eor-capabilitiesContainer">
        <ScrollReveal direction="up">
          <div
            style={{
              textAlign: 'center',
              maxWidth: '780px',
              margin: '0 auto 3.5rem auto',
            }}
          >
            <span className="Payroll-sectionEyebrow secondary">{eyebrow}</span>
            <h2 className="Payroll-sectionTitle">{heading}</h2>
            <p className="Payroll-sectionDesc">{description}</p>
          </div>
        </ScrollReveal>

        <div className="Eor-capabilitiesGrid">
          {capabilities.map((cap, idx) => (
            <ScrollReveal key={idx} direction="up" delay={idx * 0.12}>
              <div className="Payroll-pillarCard" style={{ height: '100%' }}>
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <div className={`Payroll-pillarIconBox`}>
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: '28px' }}
                    >
                      {cap.icon}
                    </span>
                  </div>
                  <div className="Payroll-pillarStep">{cap.tag}</div>
                  <h3 className="Payroll-pillarTitle">{cap.title}</h3>
                  <p
                    className="Payroll-pillarDesc"
                    style={{ marginBottom: '1.25rem' }}
                  >
                    {cap.description}
                  </p>

                  <ul
                    style={{
                      listStyle: 'none',
                      padding: 0,
                      margin: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.625rem',
                      marginTop: 'auto',
                    }}
                  >
                    {(cap.bullets || []).map((b, i) => (
                      <li
                        key={i}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          fontSize: '0.8125rem',
                          color: 'var(--color-secondary, #49607e)',
                        }}
                      >
                        <span
                          className="material-symbols-outlined text-emerald-accent"
                          style={{ fontSize: '18px' }}
                        >
                          check
                        </span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div
                  className={`Eor-cardFooter ${idx === 1 ? 'Eor-cardFooter--second' : ''}`}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '1.5rem',
                    paddingTop: '1rem',
                    borderTop: '1px solid var(--color-card-stroke, #e2e8f0)',
                    fontSize: '0.75rem',
                    color: 'var(--color-outline, #747686)',
                    minHeight: '3.25rem',
                    gap: '0.75rem',
                    ...(idx === 1 ? { gap: '1rem' } : {}),
                  }}
                >
                  <span
                    className={`Eor-cardFooterLeft ${idx === 1 ? 'Eor-cardFooterLeft--second' : ''}`}
                    style={{
                      textAlign: 'left',
                      flex: '1 1 auto',
                      minWidth: 0,
                      lineHeight: 1.4,
                    }}
                  >
                    {idx === 1 && cap.footerLeft === 'Retention Boost: +38% Contract Tenure' ? (
                      <>
                        <span style={{ display: 'block', whiteSpace: 'nowrap' }}>
                          Retention Boost: +38%
                        </span>{' '}
                        <span style={{ display: 'block', whiteSpace: 'nowrap' }}>
                          Contract Tenure
                        </span>
                      </>
                    ) : (
                      cap.footerLeft
                    )}
                  </span>
                  <span
                    className={`Eor-cardFooterRight ${idx === 1 ? 'Eor-cardFooterRight--second' : ''}`}
                    style={{
                      fontWeight: 700,
                      color: 'var(--color-primary, #0037b0)',
                      textAlign: 'right',
                      lineHeight: 1.4,
                      marginLeft: 'auto',
                    }}
                  >
                    {idx === 1 && cap.footerRight === 'Comprehensive Cover' ? (
                      <>
                        <span style={{ display: 'block', whiteSpace: 'nowrap' }}>
                          Comprehensive
                        </span>{' '}
                        <span style={{ display: 'block', whiteSpace: 'nowrap' }}>
                          Cover
                        </span>
                      </>
                    ) : (
                      cap.footerRight
                    )}
                  </span>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default EorCapabilities;
