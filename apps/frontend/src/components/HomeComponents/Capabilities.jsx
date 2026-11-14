import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchCapabilities } from '../../store/slices/homeSlice';
import SectionBadge from '../common/SectionBadge';
import ScopeCallModal from '../common/ScopeCallModal';
import { CapabilityCardSkeleton } from '../common/Skeleton';

const getCapabilityRoute = (cap) => {
  const title = (cap.title || '').toLowerCase();
  if (title.includes('staff') || title.includes('augmentation'))
    return '/services/staff-augmentation';
  if (title.includes('eor') || title.includes('employer'))
    return '/services/eor';
  if (title.includes('permanent') || title.includes('search'))
    return '/services/permanent-staffing';
  if (title.includes('payroll')) return '/services/payroll';
  return '/services';
};

const getCapabilityMaterialIcon = (iconName) => {
  switch (iconName) {
    case 'users':
      return 'group_add';
    case 'globe':
      return 'apartment';
    case 'star':
      return 'badge';
    case 'document':
      return 'receipt_long';
    default:
      return 'verified';
  }
};

const Capabilities = () => {
  const dispatch = useDispatch();
  const { capabilities, status } = useSelector((state) => state.home);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (status.capabilities === 'idle') {
      dispatch(fetchCapabilities());
    }
  }, [dispatch, status.capabilities]);

  return (
    <section className="Capabilities-capabilitiesSection">
      <div className="Capabilities-container">
        <div className="Capabilities-header">
          <div className="Capabilities-headerLeft">
            <span className="Capabilities-tag">CAPABILITIES</span>
            <h2 className="Capabilities-title">
              Fully Integrated HR &amp; Staffing Services
            </h2>
            <p className="Capabilities-subtitle">
              From flexible staff augmentation to comprehensive Employer of
              Record infrastructure, Thinkwires powers your end-to-end talent
              lifecycle.
            </p>
          </div>
          <div className="Capabilities-headerRight">
            <span className="Capabilities-enterpriseText">
              Enterprise Custom Solutions
            </span>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="Capabilities-scopeCallBtn"
            >
              Schedule Scope Call
            </button>
          </div>
        </div>

        <div className="Capabilities-cardsGrid">
          {status.capabilities === 'loading' || (status.capabilities === 'idle' && capabilities.length === 0) ? (
            <CapabilityCardSkeleton count={4} />
          ) : (
            capabilities.map((cap) => (
              <div key={cap.id} className="Capabilities-card group">
                <div className="Capabilities-cardBody">
                  <div
                    className="Capabilities-iconWrapper"
                    style={{
                      backgroundColor: cap.iconBg,
                      color: cap.iconColor,
                    }}
                  >
                    <span className="material-symbols-outlined text-[26px]">
                      {getCapabilityMaterialIcon(cap.icon)}
                    </span>
                  </div>
                  <div className="Capabilities-cardHeader">
                    <span
                      className="Capabilities-cardEyebrow"
                      style={{ color: cap.eyebrowColor }}
                    >
                      {cap.eyebrow}
                    </span>
                    <h3 className="Capabilities-cardTitle">{cap.title}</h3>
                    <p className="Capabilities-cardDesc">{cap.description}</p>
                  </div>
                  <ul className="Capabilities-featureList">
                    {cap.features.map((feature, i) => (
                      <li key={i}>
                        <span className="material-symbols-outlined text-emerald-accent text-[16px]">
                          check
                        </span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <Link
                  to={getCapabilityRoute(cap)}
                  className="Capabilities-cardFooter"
                  style={{ textDecoration: 'none' }}
                >
                  <span
                    className="Capabilities-footerLinkText"
                    style={{ color: cap.linkColor }}
                  >
                    {cap.linkText}
                  </span>
                  <span
                    className="material-symbols-outlined text-[18px] Capabilities-footerArrow"
                    style={{ color: cap.linkColor }}
                  >
                    arrow_forward
                  </span>
                </Link>
              </div>
            ))
          )}
        </div>
      </div>
      <ScopeCallModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </section>
  );
};

export default Capabilities;
