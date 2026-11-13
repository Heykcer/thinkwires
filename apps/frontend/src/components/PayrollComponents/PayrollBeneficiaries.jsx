import React from 'react';
import ScrollReveal from '../common/ScrollReveal';

const PayrollBeneficiaries = ({ data }) => {
  if (!data) return null;
  const { eyebrow, heading, description, segments = [] } = data;

  return (
    <section
      className="Payroll-sectionShell"
      style={{ backgroundColor: 'var(--color-background, #faf8ff)' }}
    >
      <div className="Payroll-sectionContainer">
        <ScrollReveal direction="up">
          <div style={{ maxWidth: '820px' }}>
            <span className="Payroll-sectionEyebrow secondary">{eyebrow}</span>
            <h2 className="Payroll-sectionTitle">{heading}</h2>
            <p className="Payroll-sectionDesc">{description}</p>
          </div>
        </ScrollReveal>

        <div className="Payroll-segmentsGrid">
          {segments.map((seg, idx) => (
            <ScrollReveal
              key={idx}
              direction="up"
              delay={idx * 0.1}
              className="Payroll-segmentReveal"
              style={{ display: 'flex', width: '100%', height: '100%' }}
            >
              <div className="Payroll-segmentCard">
                <div className="Payroll-segmentBody">
                  <div className="Payroll-segmentHeader">
                    <span className="Payroll-segmentIndex">{seg.step}</span>
                    <div className="Payroll-segmentIcon">
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: '22px' }}
                      >
                        {seg.icon}
                      </span>
                    </div>
                  </div>

                  <h3 className="Payroll-segmentTitle">{seg.title}</h3>
                  <p className="Payroll-segmentDesc">{seg.description}</p>
                </div>

                <ul className="Payroll-segmentList">
                  {(seg.points || []).map((pt, i) => (
                    <li key={i} className="Payroll-segmentListItem">
                      <span className="Payroll-bulletDot"></span>
                      <span className="Payroll-bulletText">{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PayrollBeneficiaries;
