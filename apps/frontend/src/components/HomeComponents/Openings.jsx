import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchOpenings } from '../../store/slices/homeSlice';
import QuickApplyModal from '../common/QuickApplyModal';
import SectionBadge from '../common/SectionBadge';
import JobSpecModal from '../JobsComponents/JobSpecModal';
import { OpeningsCardSkeleton } from '../common/Skeleton';

const Openings = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { openings, status } = useSelector((state) => state.home);
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedJobForSpec, setSelectedJobForSpec] = useState(null);

  useEffect(() => {
    if (status.openings === 'idle') {
      dispatch(fetchOpenings());
    }
  }, [dispatch, status.openings]);

  // Sort by latest posted date (descending), then priority
  const sortedOpenings = [...openings].sort((a, b) => {
    const timeA = new Date(a.postedDate || 0).getTime();
    const timeB = new Date(b.postedDate || 0).getTime();
    if (timeB !== timeA) return timeB - timeA;
    return (a.priority || 99) - (b.priority || 99);
  });

  // Display ONLY the latest 4 job role application cards
  const displayOpenings = sortedOpenings.slice(0, 4);

  const handleApplyClick = (job) => {
    setSelectedJob(job);
  };

  return (
    <section className={'Openings-openingsSection'} id="hot-jobs">
      <div className={'Openings-container'}>
        <div className={'Openings-headerTop'}>
          <div className={'Openings-headerLeft'}>
            <SectionBadge text="Live Deployment Pipeline" />
            <h2 className={'Openings-title'}>High Priority Openings</h2>
            <p className={'Openings-subtext'}>
              Explore verified openings ready for immediate hire. Direct
              interview routing with client engineering leadership.
            </p>
          </div>
          <div className={'Openings-headerRight'}>
            <span
              className="material-symbols-outlined"
              style={{ color: 'var(--color-emerald-accent)', fontSize: '24px' }}
            >
              bolt
            </span>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                lineHeight: 1.2,
              }}
            >
              <span
                style={{
                  fontWeight: 800,
                  fontSize: '1.25rem',
                  color: 'var(--color-navy-dark)',
                }}
              >
                130+
              </span>
              <span
                style={{
                  fontWeight: 500,
                  fontSize: '0.75rem',
                  color: '#64748b',
                }}
              >
                Verified Tech Roles
              </span>
            </div>
          </div>
        </div>



        {status.openings === 'loading' || (status.openings === 'idle' && openings.length === 0) ? (
          <div className="Openings-grid">
            <OpeningsCardSkeleton count={4} />
          </div>
        ) : (
          <>
            <div className={'Openings-grid'}>
              {displayOpenings.map((job) => (
                <div key={job.id} className={'Openings-card'}>
                  <div className={'Openings-cardHeader'}>
                    <div className={'Openings-companyInfo'}>
                      <div className={'Openings-companyLogo'}>TW</div>
                      <div className={'Openings-companyText'}>
                        <span className={'Openings-companyName'}>
                          Enterprise Client (Confidential)
                        </span>
                        <h3 className={'Openings-jobTitle'}>{job.title}</h3>
                      </div>
                    </div>
                    <div
                      className={`Openings-badge Openings-${job.tagColor || job.badgeColor || 'green'}`}
                    >
                      <span className="Openings-pulseDot"></span>
                      <span>{job.tag || job.badge || 'Active Opening'}</span>
                    </div>
                  </div>

                  <div className={'Openings-metaInfo'}>
                    <div className={'Openings-metaRow Openings-metaRowPrimary'}>
                      <div className={'Openings-metaItem Openings-metaItemLocation'}>
                        <span
                          className="material-symbols-outlined Openings-metaIcon"
                        >
                          {job.workMode === 'Work From Home'
                            ? 'home'
                            : job.workMode === 'Work From Office'
                              ? 'domain'
                              : 'location_on'}
                        </span>
                        <span className={'Openings-metaText'}>
                          {job.location} ({job.workMode || 'Hybrid'})
                        </span>
                      </div>
                      <div className={'Openings-metaItem Openings-metaItemExp'}>
                        <span
                          className="material-symbols-outlined Openings-metaIcon"
                        >
                          schedule
                        </span>
                        <span className={'Openings-metaText'}>
                          {job.experience} • {job.jobMode || 'Permanent'}
                        </span>
                      </div>
                      <div className={'Openings-metaItem Openings-metaItemSalary'}>
                        <span
                          className="material-symbols-outlined Openings-metaIcon"
                        >
                          payments
                        </span>
                        <span className={'Openings-metaText'}>{job.salary}</span>
                      </div>
                    </div>
                    <div className={'Openings-metaRow Openings-metaRowSecondary'}>
                      <div className={'Openings-metaItem Openings-metaItemNotice'}>
                        <span
                          className="material-symbols-outlined Openings-metaIcon"
                        >
                          timer
                        </span>
                        <span className={'Openings-metaText'}>
                          Notice: {job.noticePeriod || job.joining || 'Immediate'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className={'Openings-desc'}>{job.description}</p>

                  <div className={'Openings-skills'}>
                    {job.skills &&
                      job.skills.map((skill) => (
                        <span key={skill} className={'Openings-skillBadge'}>
                          {skill}
                        </span>
                      ))}
                  </div>

                  <div className={'Openings-cardFooter'}>
                    <span className={'Openings-postedDate'}>
                      Posted:{' '}
                      {job.postedDate
                        ? new Date(job.postedDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : 'Recently'}
                    </span>
                    <div className={'Openings-footerActions'}>
                      <button
                        type="button"
                        onClick={() => setSelectedJobForSpec(job)}
                        className={'Openings-viewSpecBtn'}
                      >
                        View Job Spec
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplyClick(job)}
                        className={'Openings-applyBtn'}
                      >
                        <span
                          className="material-symbols-outlined Openings-btnIcon"
                        >
                          bolt
                        </span>
                        <span>Quick Apply</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                marginTop: '2rem',
                marginBottom: '1rem',
              }}
            >
              <Link
                to="/jobs"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.75rem',
                  borderRadius: '9999px',
                  backgroundColor: '#0f172a',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '0.9375rem',
                  textDecoration: 'none',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 12px rgba(15, 23, 42, 0.12)',
                }}
              >
                <span>Explore All 130+ Tech Openings</span>
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: '18px' }}
                >
                  arrow_forward
                </span>
              </Link>
            </div>
          </>
        )}

        <div className={'Openings-uploadCtaBanner'}>
          <div className={'Openings-uploadLeft'}>
            <div className={'Openings-uploadIcon'}>
              <span
                className="material-symbols-outlined"
                style={{ fontSize: '30px' }}
              >
                folder_special
              </span>
            </div>
            <div className={'Openings-uploadText'}>
              <h4>Looking for unlisted or confidential enterprise openings?</h4>
              <p>
                Drop your technical resume into our active executive talent
                registry.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() =>
              handleApplyClick({
                title: 'General Engineering Candidate Pool',
                jobId: 'general-pool',
                department: 'Global Talent Cloud',
                location: 'Remote / Hybrid',
                employmentType: 'Permanent',
                postingDate: new Date().toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                }),
              })
            }
            className={'Openings-uploadBtn'}
          >
            Quick Apply / Upload CV
          </button>
        </div>
      </div>
      {/* Complete Job Specifications Modal */}
      {selectedJobForSpec && (
        <JobSpecModal
          job={selectedJobForSpec}
          onClose={() => setSelectedJobForSpec(null)}
          onApply={(j) => {
            setSelectedJobForSpec(null);
            handleApplyClick(j);
          }}
        />
      )}

      <QuickApplyModal
        isOpen={!!selectedJob}
        onClose={() => setSelectedJob(null)}
        jobData={selectedJob}
        roleTitle={
          typeof selectedJob === 'string'
            ? selectedJob
            : selectedJob?.title || ''
        }
      />
    </section>
  );
};

export default Openings;
