import React from 'react';

const PermStaffProcess = ({ data }) => {
  if (!data) return null;
  const { eyebrow, heading, description, steps = [], metricsStrip = {} } = data;

  return (
    <section className="PermStaff-processSection">
      <div className="PermStaff-container">
        {/* Section Header */}
        <div className="PermStaff-sectionHeader">
          <span className="PermStaff-eyebrow primary">{eyebrow}</span>
          <h2 className="PermStaff-title">{heading}</h2>
          <p className="PermStaff-desc">{description}</p>
        </div>

        {/* 4-Step Process Timeline Grid */}
        <div className="PermStaff-processGrid">
          {steps.map((st, idx) => (
            <div key={idx} className="PermStaff-processCard" style={{ height: '100%' }}>
              <div className="step-body">
                <div
                  className={`step-circle ${idx === 3 ? 'emerald' : 'primary'}`}
                >
                  {st.step}
                </div>
                <div className="step-phase">{st.phase}</div>
                <h3 className="step-title">{st.title}</h3>
                <p className="step-desc">{st.description}</p>
              </div>

              <div className="step-deliverable">
                <span className="deliv-label">Deliverable:</span>
                <span className="deliv-val">{st.deliverable}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Process Metric Strip */}
        {metricsStrip && metricsStrip.retention && (
          <div className="PermStaff-processMetricStrip">
            <div className="metric-left">
              <div className="icon-circle">
                <span className="material-symbols-outlined">verified</span>
              </div>
              <div>
                <h4 className="metric-title">
                  {metricsStrip.retention} {metricsStrip.retentionLabel}
                </h4>
                <p className="metric-desc">{metricsStrip.retentionDesc}</p>
              </div>
            </div>

            <div className="metric-right">
              <div className="stat-num">{metricsStrip.acceptance}</div>
              <div className="stat-label">{metricsStrip.acceptanceLabel}</div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default PermStaffProcess;
