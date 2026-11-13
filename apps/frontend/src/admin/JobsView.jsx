import React, { useState, useEffect } from 'react';
import { useOutletContext, useSearchParams, useLocation, Link } from 'react-router-dom';
import { adminApi } from './adminService';
import {
  PlusIcon,
  EditIcon,
  TrashIcon,
  CloseIcon,
  AlertCircleIcon,
  LocationIcon,
  BuildingIcon,
  DownloadIcon,
  UploadIcon,
} from './AdminIcons';

import {
  INDUSTRY_SECTORS,
  JOB_MODES,
  WORK_MODES,
  NOTICE_PERIODS,
} from './jobConstants';
import SkillTagInput from '../components/common/SkillTagInput';
import SkillSearchInput from '../components/common/SkillSearchInput';
import DataImportModal from './components/DataImportModal';
import { exportToExcel, JOB_REQUIREMENT_COLUMNS } from './utils/excelDataUtils';

const formatPriority = (p) => {
  if (typeof p === 'number') {
    if (p <= 5) return 'Urgent';
    if (p <= 10) return 'High';
    if (p <= 20) return 'Medium';
    return 'Low';
  }
  return String(p || 'Medium');
};

const renderJobModeBadge = (mode) => {
  const m = mode || 'Permanent';
  if (m === 'Permanent') {
    return (
      <span
        style={{
          fontSize: '0.68rem',
          padding: '0.15rem 0.45rem',
          borderRadius: '4px',
          background: '#ECFDF5',
          color: '#047857',
          border: '1px solid #A7F3D0',
          fontWeight: 600,
        }}
      >
        Permanent
      </span>
    );
  }
  if (m === 'Contract') {
    return (
      <span
        style={{
          fontSize: '0.68rem',
          padding: '0.15rem 0.45rem',
          borderRadius: '4px',
          background: '#FEF3C7',
          color: '#B45309',
          border: '1px solid #FDE68A',
          fontWeight: 600,
        }}
      >
        Contract
      </span>
    );
  }
  return (
    <span
      style={{
        fontSize: '0.68rem',
        padding: '0.15rem 0.45rem',
        borderRadius: '4px',
        background: '#EEF2FF',
        color: '#4F46E5',
        border: '1px solid #C7D2FE',
        fontWeight: 600,
      }}
    >
      Contract to Hire
    </span>
  );
};

const renderNoticeBadge = (np, other) => {
  const val = np || 'Immediate';
  if (val === 'Immediate') {
    return (
      <span
        style={{
          fontSize: '0.72rem',
          padding: '0.2rem 0.5rem',
          borderRadius: '4px',
          background: '#D1FAE5',
          color: '#065F46',
          fontWeight: 600,
          display: 'inline-flex',
          alignItems: 'center',
          whiteSpace: 'nowrap',
        }}
      >
        Immediate
      </span>
    );
  }
  if (val === 'On Notice Period') {
    return (
      <span
        style={{
          fontSize: '0.72rem',
          padding: '0.2rem 0.5rem',
          borderRadius: '4px',
          background: '#FEF3C7',
          color: '#92400E',
          fontWeight: 600,
          display: 'inline-flex',
          alignItems: 'center',
          whiteSpace: 'nowrap',
        }}
      >
        On Notice
      </span>
    );
  }
  if (val === '< 30 Days') {
    return (
      <span
        style={{
          fontSize: '0.72rem',
          padding: '0.2rem 0.5rem',
          borderRadius: '4px',
          background: '#DBEAFE',
          color: '#1E40AF',
          fontWeight: 600,
          display: 'inline-flex',
          alignItems: 'center',
          whiteSpace: 'nowrap',
        }}
      >
        &lt; 30 Days
      </span>
    );
  }
  return (
    <span
      style={{
        fontSize: '0.72rem',
        padding: '0.2rem 0.5rem',
        borderRadius: '4px',
        background: '#F3E8FF',
        color: '#6B21A8',
        fontWeight: 600,
        display: 'inline-flex',
        alignItems: 'center',
        whiteSpace: 'nowrap',
      }}
    >
      {other || val || 'Other'}
    </span>
  );
};

const renderWorkModeBadge = (wm, officeLoc, loc) => {
  const mode = wm || 'Work From Home';
  const displayLoc = officeLoc || loc || '';
  if (mode === 'Work From Office') {
    return (
      <div>
        <span
          style={{
            fontSize: '0.72rem',
            padding: '0.15rem 0.45rem',
            borderRadius: '4px',
            background: '#F1F5F9',
            color: '#0F172A',
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
          }}
        >
          Work From Office
        </span>
        {displayLoc && (
          <div
            style={{
              fontSize: '0.72rem',
              color: '#475569',
              marginTop: '0.2rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
            }}
          >
            <LocationIcon size={12} color="#64748B" />
            <span>{displayLoc}</span>
          </div>
        )}
      </div>
    );
  }
  if (mode === 'Hybrid') {
    return (
      <div>
        <span
          style={{
            fontSize: '0.72rem',
            padding: '0.15rem 0.45rem',
            borderRadius: '4px',
            background: '#E0F2FE',
            color: '#0369A1',
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
          }}
        >
          Hybrid
        </span>
        {displayLoc && (
          <div
            style={{
              fontSize: '0.72rem',
              color: '#475569',
              marginTop: '0.2rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
            }}
          >
            <LocationIcon size={12} color="#64748B" />
            <span>{displayLoc}</span>
          </div>
        )}
      </div>
    );
  }
  return (
    <div>
      <span
        style={{
          fontSize: '0.72rem',
          padding: '0.15rem 0.45rem',
          borderRadius: '4px',
          background: '#ECFDF5',
          color: '#047857',
          fontWeight: 600,
          display: 'inline-flex',
          alignItems: 'center',
        }}
      >
        Work From Home
      </span>
    </div>
  );
};

const JobsView = ({ defaultFilter }) => {
  const { showToast, activeRole } = useOutletContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();

  const initialStatus =
    defaultFilter || searchParams.get('status') || 'All';

  const [jobs, setJobs] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [industryFilter, setIndustryFilter] = useState('All');
  const [jobModeFilter, setJobModeFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');

  const [modalOpen, setModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    client: '',
    industry: 'Information Technology & Cloud',
    jobMode: 'Permanent',
    workMode: 'Work From Office',
    officeLocation: '',
    noticePeriod: 'Immediate',
    noticePeriodOther: '',
    requiredSkills: '',
    experienceRequired: 5,
    openingsCount: 1,
    priority: 'Medium',
    status: 'Open',
    budget: '₹28-35 LPA ($45-55k)',
    location: '',
    description: '',
    requirements: '',
  });

  const [formError, setFormError] = useState('');
  const [isCustomClient, setIsCustomClient] = useState(false);

  const fetchJobs = () => {
    setLoading(true);
    adminApi
      .getJobs({
        search,
        priority: priorityFilter,
        status: statusFilter,
        industry: industryFilter,
        jobMode: jobModeFilter,
        category: categoryFilter,
        type: 'jobs',
      })
      .then((res) => {
        setJobs(res.jobs || []);
        setLoading(false);
      })
      .catch((err) => {
        setLoading(false);
        showToast(`Failed to load jobs: ${err.message}`);
      });
  };

  useEffect(() => {
    let isMounted = true;
    adminApi
      .getJobs({
        search,
        priority: priorityFilter,
        status: statusFilter,
        industry: industryFilter,
        jobMode: jobModeFilter,
        category: categoryFilter,
      })
      .then((res) => {
        if (isMounted) {
          setJobs(res.jobs || []);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setLoading(false);
          showToast(`Failed to load jobs: ${err.message}`);
        }
      });
    adminApi.getClients().then((res) => {
      if (isMounted) setClients(res.clients || []);
    });
    return () => {
      isMounted = false;
    };
  }, [
    search,
    priorityFilter,
    statusFilter,
    industryFilter,
    jobModeFilter,
    categoryFilter,
    showToast,
  ]);

  const openAddModal = () => {
    if (activeRole === 'viewer') {
      showToast('Viewer accounts cannot post requisitions.');
      return;
    }
    setEditingJob(null);
    setIsCustomClient(false);
    setFormData({
      title: '',
      client: clients[0]?.companyName || '',
      industry: 'Information Technology & Cloud',
      jobMode: 'Permanent',
      workMode: 'Work From Office',
      officeLocation: '',
      noticePeriod: 'Immediate',
      noticePeriodOther: '',
      requiredSkills: '',
      experienceRequired: 5,
      openingsCount: 1,
      priority: 'High',
      status: 'Open',
      budget: '₹28-35 LPA ($45-55k)',
      location: '',
      description: '',
      requirements: '',
    });
    setFormError('');
    setModalOpen(true);
  };

  const openEditModal = (job) => {
    if (activeRole === 'viewer') {
      showToast('Viewer accounts cannot edit requisitions.');
      return;
    }
    setEditingJob(job);

    const matchesClient = clients.some((c) => c.companyName === job.client);
    setIsCustomClient(!matchesClient && Boolean(job.client));

    let wm = job.workMode || 'Work From Office';
    if (wm === 'Remote') wm = 'Work From Home';
    if (wm === 'On-site' || wm === 'Office') wm = 'Work From Office';

    let np = job.noticePeriod || job.joining || 'Immediate';
    let npOther = job.noticePeriodOther || '';
    if (
      !['Immediate', 'On Notice Period', '< 30 Days', 'Others'].includes(np)
    ) {
      npOther = np;
      np = 'Others';
    }

    setFormData({
      title: job.title || '',
      client: job.client || '',
      industry: job.industry || 'Information Technology & Cloud',
      jobMode: job.jobMode || 'Permanent',
      workMode: wm,
      officeLocation:
        job.officeLocation ||
        (wm === 'Work From Office' || wm === 'Hybrid' ? job.location : ''),
      noticePeriod: np,
      noticePeriodOther: npOther,
      requiredSkills: Array.isArray(job.requiredSkills)
        ? job.requiredSkills.join(', ')
        : Array.isArray(job.skills)
          ? job.skills.join(', ')
          : job.requiredSkills || '',
      experienceRequired: job.experienceRequired || 3,
      openingsCount: job.openingsCount || job.openings || 1,
      priority: formatPriority(job.priority),
      status: String(job.status || 'Open'),
      budget: job.budget || job.salary || '',
      location: job.location || '',
      description: job.description || '',
      requirements: Array.isArray(job.requirements)
        ? job.requirements.join('\n')
        : job.requirements || '',
    });
    setFormError('');
    setModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.client.trim()) {
      setFormError('Please enter Requisition Title and Client Name.');
      return;
    }

    if (
      (formData.workMode === 'Work From Office' ||
        formData.workMode === 'Hybrid') &&
      !formData.officeLocation.trim()
    ) {
      setFormError(
        `Please specify the office location for ${formData.workMode}.`
      );
      return;
    }

    if (
      formData.noticePeriod === 'Others' &&
      !formData.noticePeriodOther.trim()
    ) {
      setFormError(
        'Please specify the notice period requirement (e.g. 60 Days, 90 Days).'
      );
      return;
    }

    const payload = {
      ...formData,
      description: formData.description.trim(),
      requirements: formData.requirements.trim(),
      location:
        formData.workMode === 'Work From Office'
          ? formData.officeLocation
          : formData.workMode === 'Hybrid'
            ? `Hybrid (${formData.officeLocation})`
            : 'Work From Home (Remote)',
      requiredSkills: formData.requiredSkills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    };

    if (editingJob) {
      adminApi
        .updateJob(editingJob.id || editingJob._id, payload)
        .then(() => {
          showToast(`Requisition '${formData.title}' updated.`);
          setModalOpen(false);
          fetchJobs();
        })
        .catch((err) => setFormError(err.message));
    } else {
      adminApi
        .createJob(payload)
        .then(() => {
          showToast(`Requisition '${formData.title}' posted.`);
          setModalOpen(false);
          fetchJobs();
        })
        .catch((err) => setFormError(err.message));
    }
  };

  const handleDelete = (id) => {
    if (activeRole === 'viewer') {
      showToast('Viewer accounts cannot close requisitions.');
      return;
    }
    adminApi
      .deleteJob(id)
      .then(() => {
        showToast('Requisition removed.');
        setDeleteConfirmId(null);
        fetchJobs();
      })
      .catch((err) => showToast(`Delete failed: ${err.message}`));
  };

  const handleExport = (format = 'xlsx') => {
    try {
      if (!jobs || jobs.length === 0) {
        showToast('No job requirements available to export.');
        return;
      }
      const filename = `thinkwires_job_requirements_${new Date().toISOString().split('T')[0]}`;
      exportToExcel({
        data: jobs,
        columns: JOB_REQUIREMENT_COLUMNS,
        filename,
        format,
      });
      showToast(
        `Exported ${jobs.length} job requirement(s) as ${format.toUpperCase()}.`
      );
    } catch (err) {
      showToast(`Export failed: ${err.message}`);
    }
  };

  return (
    <div>
      <div className="tw-view-header">
        <div className="tw-view-title-group">
          <h1>Staffing Requisitions & Job Requirements</h1>
          <p className="tw-view-subtitle">
            Manage active client job requirements, employment modes (Permanent,
            Contract, C2H), office locations, and notice period constraints.
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            gap: '0.65rem',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', gap: '0.35rem' }}>
            <button
              type="button"
              className="tw-btn-secondary"
              onClick={() => handleExport('xlsx')}
              title="Export current job requirements as Excel (.xlsx)"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.82rem',
                padding: '0.5rem 0.8rem',
              }}
            >
              <DownloadIcon size={14} />
              <span>Export Excel</span>
            </button>
            <button
              type="button"
              className="tw-btn-secondary"
              onClick={() => handleExport('csv')}
              title="Export current job requirements as CSV (.csv)"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.82rem',
                padding: '0.5rem 0.8rem',
              }}
            >
              <DownloadIcon size={14} />
              <span>Export CSV</span>
            </button>
          </div>

          <button
            type="button"
            className="tw-btn-secondary"
            onClick={() => {
              if (activeRole === 'viewer') {
                showToast('Viewer accounts cannot import job requirements.');
                return;
              }
              setImportModalOpen(true);
            }}
            title="Import job requirements from Excel or CSV"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.82rem',
              padding: '0.5rem 0.85rem',
            }}
          >
            <UploadIcon size={14} />
            <span>Import</span>
          </button>

          <button
            className="tw-btn-primary"
            onClick={openAddModal}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
            }}
          >
            <PlusIcon size={15} />
            <span>Post Job Requirement</span>
          </button>
        </div>
      </div>

      <div className="tw-table-container">
        <div
          className="tw-table-toolbar"
          style={{ flexWrap: 'wrap', gap: '0.65rem' }}
        >
          <div
            className="tw-table-filters"
            style={{ flexWrap: 'wrap', gap: '0.5rem' }}
          >
            <SkillSearchInput
              id="jobs-filter-search"
              className="tw-filter-input"
              placeholder="Search title, client, skill, industry..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onSelect={(skill) => setSearch(skill)}
              wrapperClassName="tw-filter-search-wrap"
            />

            <select
              className="tw-filter-select"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{ maxWidth: '170px' }}
            >
              <option value="All">All Job Sources</option>
              <option value="Client Requisition">Client Requisitions</option>
              <option value="Internal">Internal Openings</option>
            </select>

            <select
              className="tw-filter-select"
              value={industryFilter}
              onChange={(e) => setIndustryFilter(e.target.value)}
              style={{ maxWidth: '180px' }}
            >
              <option value="All">All Industries</option>
              {INDUSTRY_SECTORS.map((ind) => (
                <option key={ind} value={ind}>
                  {ind}
                </option>
              ))}
            </select>

            <select
              className="tw-filter-select"
              value={jobModeFilter}
              onChange={(e) => setJobModeFilter(e.target.value)}
            >
              <option value="All">All Job Modes</option>
              {JOB_MODES.map((mode) => (
                <option key={mode} value={mode}>
                  {mode}
                </option>
              ))}
            </select>

            <select
              className="tw-filter-select"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="All">All Priorities</option>
              <option value="Urgent">Urgent</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>

            <select
              className="tw-filter-select"
              value={statusFilter}
              onChange={(e) => {
                const val = e.target.value;
                setStatusFilter(val);
                if (val !== 'All') {
                  setSearchParams({ status: val });
                } else {
                  setSearchParams({});
                }
              }}
            >
              <option value="All">All Statuses</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Fulfilled">Fulfilled</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          <div
            style={{ fontSize: '0.8rem', color: '#64748B', marginLeft: 'auto' }}
          >
            Active orders: <strong>{jobs.length}</strong>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="tw-table">
            <thead>
              <tr>
                <th style={{ minWidth: '220px' }}>Job Requisition & Sector</th>
                <th style={{ minWidth: '150px' }}>Client Partner</th>
                <th style={{ minWidth: '180px' }}>Work Mode & Location</th>
                <th style={{ minWidth: '130px' }}>Notice Period</th>
                <th style={{ minWidth: '160px' }}>Target Skills</th>
                <th style={{ minWidth: '80px' }}>Openings</th>
                <th style={{ minWidth: '110px' }}>Priority</th>
                <th style={{ minWidth: '100px' }}>Status</th>
                <th style={{ minWidth: '130px' }}>Budget / CTC</th>
                <th style={{ textAlign: 'right', minWidth: '80px' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan="10"
                    style={{
                      textAlign: 'center',
                      padding: '2rem',
                      color: '#64748B',
                    }}
                  >
                    Loading requisitions...
                  </td>
                </tr>
              ) : jobs.length === 0 ? (
                <tr>
                  <td
                    colSpan="10"
                    style={{
                      textAlign: 'center',
                      padding: '2rem',
                      color: '#64748B',
                    }}
                  >
                    No job requirements found matching your criteria.
                  </td>
                </tr>
              ) : (
                jobs.map((job) => {
                  const priorityStr = formatPriority(job.priority);
                  const statusStr = String(job.status || 'Open');
                  const skillsList =
                    Array.isArray(job.requiredSkills) &&
                    job.requiredSkills.length > 0
                      ? job.requiredSkills
                      : Array.isArray(job.skills)
                        ? job.skills
                        : [];
                  const openings = job.openingsCount || job.openings || 1;
                  const fulfilled = job.fulfilledCount || 0;
                  const budgetText = job.budget || job.salary || 'Competitive';

                  return (
                    <tr key={job.id || job._id}>
                      <td>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.45rem',
                            marginBottom: '0.25rem',
                            flexWrap: 'wrap',
                          }}
                        >
                          <span
                            style={{
                              fontWeight: 600,
                              color: '#0F172A',
                            }}
                          >
                            {job.title}
                          </span>
                          {(job.isRequisition ||
                            job.category === 'Client Requisition' ||
                            job.source === 'Client Inbound Requisition' ||
                            (job.jobId && String(job.jobId).startsWith('REQ-'))) && (
                            <Link
                              to={`/admin/requisitions?search=${encodeURIComponent(job.client || job.title)}`}
                              style={{
                                fontSize: '0.65rem',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                padding: '0.12rem 0.45rem',
                                borderRadius: '4px',
                                backgroundColor: '#EDE9FE',
                                color: '#6D28D9',
                                border: '1px solid #DDD6FE',
                                textDecoration: 'none',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                              }}
                              title="Mandate originated from Client Requisition. Click to view SLA desk."
                            >
                              <span>Mandate: {job.jobId || 'REQ'}</span>
                            </Link>
                          )}
                          {job.jobId && !String(job.jobId).startsWith('REQ-') && (
                            <span
                              style={{
                                fontSize: '0.67rem',
                                fontWeight: 700,
                                padding: '0.1rem 0.4rem',
                                borderRadius: '4px',
                                backgroundColor: '#F0FDF4',
                                color: '#15803D',
                                border: '1px solid #DCFCE7',
                              }}
                              title="Job Identifier"
                            >
                              {job.jobId}
                            </span>
                          )}
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            gap: '0.35rem',
                            flexWrap: 'wrap',
                            alignItems: 'center',
                          }}
                        >
                          <span
                            style={{
                              fontSize: '0.67rem',
                              padding: '0.1rem 0.4rem',
                              borderRadius: '4px',
                              backgroundColor: '#F1F5F9',
                              color: '#475569',
                              border: '1px solid #E2E8F0',
                              fontWeight: 500,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                            }}
                          >
                            <BuildingIcon size={11} color="#64748B" />
                            <span>{job.industry || 'IT & Cloud'}</span>
                          </span>
                          {renderJobModeBadge(job.jobMode)}
                          <span
                            style={{ fontSize: '0.7rem', color: '#94A3B8' }}
                          >
                            {job.experienceRequired || 3}+ yrs
                          </span>
                          {(job.jobCreationDate || job.createdAt) && (
                            <span
                              style={{
                                fontSize: '0.67rem',
                                color: '#64748B',
                                padding: '0.05rem 0.35rem',
                                backgroundColor: '#F8FAFC',
                                borderRadius: '3px',
                                border: '1px solid #F1F5F9',
                              }}
                              title="Job Creation Date"
                            >
                              Created: {String(job.jobCreationDate || job.createdAt).split('T')[0]}
                            </span>
                          )}
                        </div>
                        {job.description && (
                          <div
                            style={{
                              fontSize: '0.72rem',
                              color: '#64748B',
                              marginTop: '0.35rem',
                              lineHeight: '1.4',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              maxWidth: '300px',
                            }}
                            title={job.description}
                          >
                            {job.description}
                          </div>
                        )}
                      </td>

                      <td>
                        <div style={{ fontWeight: 600, color: '#1E293B' }}>
                          {job.client || 'Enterprise Client'}
                        </div>
                        {job.contactPerson && (
                          <div
                            style={{
                              fontSize: '0.75rem',
                              color: '#475569',
                              marginTop: '0.1rem',
                            }}
                          >
                            {job.contactPerson}
                          </div>
                        )}
                        {job.contactEmail ? (
                          <div
                            style={{
                              fontSize: '0.7rem',
                              color: '#2563EB',
                              marginTop: '0.1rem',
                            }}
                          >
                            {job.contactEmail}
                          </div>
                        ) : (
                          <div
                            style={{
                              fontSize: '0.72rem',
                              color: '#64748B',
                              marginTop: '0.15rem',
                            }}
                          >
                            Verified Client
                          </div>
                        )}
                      </td>

                      <td>
                        {renderWorkModeBadge(
                          job.workMode,
                          job.officeLocation,
                          job.location
                        )}
                      </td>

                      <td>
                        {renderNoticeBadge(
                          job.noticePeriod,
                          job.noticePeriodOther
                        )}
                        {job.expectedJoiningDate && (
                          <div
                            style={{
                              fontSize: '0.67rem',
                              color: '#0F766E',
                              fontWeight: 600,
                              marginTop: '0.2rem',
                            }}
                            title="Expected Joining Date"
                          >
                            Joining: {job.expectedJoiningDate}
                          </div>
                        )}
                      </td>

                      <td>
                        <div
                          style={{
                            display: 'flex',
                            gap: '0.2rem',
                            flexWrap: 'wrap',
                            maxWidth: '200px',
                          }}
                        >
                          {skillsList.slice(0, 4).map((sk, idx) => (
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
                          {skillsList.length > 4 && (
                            <span
                              style={{
                                fontSize: '0.65rem',
                                color: '#64748B',
                                padding: '0.1rem 0.2rem',
                              }}
                            >
                              +{skillsList.length - 4}
                            </span>
                          )}
                        </div>
                      </td>

                      <td>
                        <strong>
                          {fulfilled} / {openings}
                        </strong>
                      </td>

                      <td>
                        <span
                          className={`tw-badge ${priorityStr.toLowerCase()}`}
                        >
                          {priorityStr}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`tw-badge ${statusStr.toLowerCase().replace(/\s+/g, '-')}`}
                        >
                          {statusStr}
                        </span>
                      </td>

                      <td>
                        <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>
                          {budgetText}
                        </span>
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <div
                          className="tw-action-btn-group"
                          style={{ justifyContent: 'flex-end', alignItems: 'center' }}
                        >
                          {(job.status === 'Inbound Request' ||
                            job.status === 'Inbound Requisition') && (
                            <button
                              className="tw-btn-primary"
                              onClick={() => {
                                adminApi
                                  .updateJob(job.id || job._id, { status: 'Open' })
                                  .then(() => {
                                    showToast(
                                      `Requisition "${job.title}" approved and opened.`
                                    );
                                    fetchJobs();
                                  })
                                  .catch((err) =>
                                    showToast(`Update failed: ${err.message}`)
                                  );
                              }}
                              title="Approve and open mandate"
                              style={{
                                padding: '0.2rem 0.5rem',
                                fontSize: '0.7rem',
                                background: '#008F68',
                                marginRight: '0.25rem',
                              }}
                            >
                              Approve
                            </button>
                          )}
                          <button
                            className="tw-action-icon-btn"
                            onClick={() => openEditModal(job)}
                            title="Edit Requisition"
                          >
                            <EditIcon size={14} />
                          </button>
                          <button
                            className="tw-action-icon-btn delete"
                            onClick={() =>
                              setDeleteConfirmId(job.id || job._id)
                            }
                            title="Close Requisition"
                          >
                            <TrashIcon size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Job Modal */}
      {modalOpen && (
        <div className="tw-modal-overlay">
          <div className="tw-modal" style={{ maxWidth: '720px' }}>
            <div className="tw-modal-header">
              <h2 className="tw-modal-title">
                {editingJob
                  ? `Edit Requisition: ${editingJob.title}`
                  : 'Post New Staffing Requirement'}
              </h2>
              <button
                className="tw-modal-close-btn"
                onClick={() => setModalOpen(false)}
                title="Close"
              >
                <CloseIcon size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
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

                {/* Row 1: Title and Client */}
                <div className="tw-form-row">
                  <div className="tw-form-group">
                    <label className="tw-form-label">Job Title *</label>
                    <input
                      type="text"
                      className="tw-form-input"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      placeholder="e.g. Lead Full Stack & Cloud Architect"
                      required
                    />
                  </div>
                  <div className="tw-form-group">
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '0.35rem',
                      }}
                    >
                      <label
                        className="tw-form-label"
                        style={{ marginBottom: 0 }}
                      >
                        Corporate Client *
                      </label>
                      {clients.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsCustomClient((prev) => {
                              const next = !prev;
                              if (next) {
                                setFormData((fd) => ({ ...fd, client: '' }));
                              } else {
                                setFormData((fd) => ({
                                  ...fd,
                                  client: clients[0]?.companyName || '',
                                }));
                              }
                              return next;
                            });
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#2563EB',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            padding: 0,
                            textDecoration: 'underline',
                          }}
                        >
                          {isCustomClient
                            ? 'Select from registered clients'
                            : '+ Enter client manually'}
                        </button>
                      )}
                    </div>

                    {isCustomClient || clients.length === 0 ? (
                      <div>
                        <input
                          type="text"
                          className="tw-form-input"
                          value={formData.client}
                          onChange={(e) =>
                            setFormData({ ...formData, client: e.target.value })
                          }
                          placeholder="Type client partner name manually (e.g. Acme Tech Global)"
                          required
                          autoFocus={isCustomClient}
                        />
                        <div
                          style={{
                            fontSize: '0.72rem',
                            color: '#64748B',
                            marginTop: '0.25rem',
                          }}
                        >
                          Client details are strictly internal and will never be
                          exposed on the public website.
                        </div>
                      </div>
                    ) : (
                      <select
                        className="tw-form-select"
                        value={formData.client}
                        onChange={(e) => {
                          if (e.target.value === '__custom__') {
                            setIsCustomClient(true);
                            setFormData({ ...formData, client: '' });
                          } else {
                            setFormData({
                              ...formData,
                              client: e.target.value,
                            });
                          }
                        }}
                        required
                      >
                        <option value="">Select Client Partner...</option>
                        {clients.map((c) => (
                          <option key={c.id || c._id} value={c.companyName}>
                            {c.companyName}
                          </option>
                        ))}
                        <option value="__custom__">
                          + Enter Unlisted Client Name Manually...
                        </option>
                      </select>
                    )}
                  </div>
                </div>

                {/* Row 2: Industry Sector and Job Mode */}
                <div className="tw-form-row">
                  <div className="tw-form-group">
                    <label className="tw-form-label">Industry / Sector *</label>
                    <select
                      className="tw-form-select"
                      value={formData.industry}
                      onChange={(e) =>
                        setFormData({ ...formData, industry: e.target.value })
                      }
                      required
                    >
                      {INDUSTRY_SECTORS.map((ind) => (
                        <option key={ind} value={ind}>
                          {ind}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="tw-form-group">
                    <label className="tw-form-label">Job Mode *</label>
                    <select
                      className="tw-form-select"
                      value={formData.jobMode}
                      onChange={(e) =>
                        setFormData({ ...formData, jobMode: e.target.value })
                      }
                      required
                    >
                      {JOB_MODES.map((mode) => (
                        <option key={mode} value={mode}>
                          {mode}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Row 3: Work Mode and Conditional Office Location */}
                <div className="tw-form-row">
                  <div className="tw-form-group">
                    <label className="tw-form-label">Work Mode *</label>
                    <select
                      className="tw-form-select"
                      value={formData.workMode}
                      onChange={(e) =>
                        setFormData({ ...formData, workMode: e.target.value })
                      }
                      required
                    >
                      {WORK_MODES.map((wm) => (
                        <option key={wm.value} value={wm.value}>
                          {wm.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {formData.workMode === 'Work From Office' ||
                  formData.workMode === 'Hybrid' ? (
                    <div className="tw-form-group">
                      <label className="tw-form-label">
                        {formData.workMode === 'Work From Office'
                          ? 'Office Location (City / Campus) *'
                          : 'Office Base Location (Hybrid) *'}
                      </label>
                      <input
                        type="text"
                        className="tw-form-input"
                        value={formData.officeLocation}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            officeLocation: e.target.value,
                          })
                        }
                        placeholder="e.g. Bangalore - Whitefield Tech Hub"
                        required
                      />
                    </div>
                  ) : (
                    <div className="tw-form-group">
                      <label className="tw-form-label">
                        Work Location Coverage
                      </label>
                      <input
                        type="text"
                        className="tw-form-input"
                        value="Remote / Pan-India / Global"
                        disabled
                        style={{ backgroundColor: '#F8FAFC', color: '#64748B' }}
                      />
                    </div>
                  )}
                </div>

                {/* Row 4: Notice Period and Conditional Other Specify */}
                <div className="tw-form-row">
                  <div className="tw-form-group">
                    <label className="tw-form-label">
                      Notice Period Requirement *
                    </label>
                    <select
                      className="tw-form-select"
                      value={formData.noticePeriod}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          noticePeriod: e.target.value,
                        })
                      }
                      required
                    >
                      {NOTICE_PERIODS.map((np) => (
                        <option key={np.value} value={np.value}>
                          {np.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {formData.noticePeriod === 'Others' ? (
                    <div className="tw-form-group">
                      <label className="tw-form-label">
                        Specify Notice Period *
                      </label>
                      <input
                        type="text"
                        className="tw-form-input"
                        value={formData.noticePeriodOther}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            noticePeriodOther: e.target.value,
                          })
                        }
                        placeholder="e.g. 60 Days, 90 Days, or Buyout Negotiable"
                        required
                      />
                    </div>
                  ) : (
                    <div className="tw-form-group">
                      <label className="tw-form-label">
                        Expected Joining Timeline
                      </label>
                      <input
                        type="text"
                        className="tw-form-input"
                        value={
                          formData.noticePeriod === 'Immediate'
                            ? 'Immediate joining (0 - 7 calendar days)'
                            : formData.noticePeriod === 'On Notice Period'
                              ? 'Actively serving official notice'
                              : 'Within 30 calendar days'
                        }
                        disabled
                        style={{ backgroundColor: '#F8FAFC', color: '#64748B' }}
                      />
                    </div>
                  )}
                </div>

                {/* Row 5: Skills */}
                <div className="tw-form-group">
                  <label className="tw-form-label">
                    Required Technical Skills *
                  </label>
                  <SkillTagInput
                    id="job-form-skills"
                    placeholder="Type to search and add skills (e.g. React, TypeScript, Node.js, AWS)..."
                    value={formData.requiredSkills}
                    onChange={(val) =>
                      setFormData({
                        ...formData,
                        requiredSkills: val,
                      })
                    }
                  />
                </div>

                {/* Row 6: Experience & Openings */}
                <div className="tw-form-row">
                  <div className="tw-form-group">
                    <label className="tw-form-label">
                      Experience Required (Years)
                    </label>
                    <input
                      type="number"
                      className="tw-form-input"
                      value={formData.experienceRequired}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          experienceRequired: Number(e.target.value),
                        })
                      }
                      min="0"
                    />
                  </div>
                  <div className="tw-form-group">
                    <label className="tw-form-label">
                      Open Headcount Positions
                    </label>
                    <input
                      type="number"
                      className="tw-form-input"
                      value={formData.openingsCount}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          openingsCount: Number(e.target.value),
                        })
                      }
                      min="1"
                    />
                  </div>
                </div>

                {/* Row 7: Priority & Status */}
                <div className="tw-form-row">
                  <div className="tw-form-group">
                    <label className="tw-form-label">Priority</label>
                    <select
                      className="tw-form-select"
                      value={formData.priority}
                      onChange={(e) =>
                        setFormData({ ...formData, priority: e.target.value })
                      }
                    >
                      <option value="Urgent">Urgent (48-hour SLA)</option>
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>
                  <div className="tw-form-group">
                    <label className="tw-form-label">Status</label>
                    <select
                      className="tw-form-select"
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({ ...formData, status: e.target.value })
                      }
                    >
                      <option value="Open">Open</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Fulfilled">Fulfilled</option>
                      <option value="Closed">Closed</option>
                    </select>
                  </div>
                </div>

                {/* Row 8: Budget */}
                <div className="tw-form-group">
                  <label className="tw-form-label">
                    Budget / Compensation Band
                  </label>
                  <input
                    type="text"
                    className="tw-form-input"
                    value={formData.budget}
                    onChange={(e) =>
                      setFormData({ ...formData, budget: e.target.value })
                    }
                    placeholder="₹28-35 LPA ($45-55k)"
                  />
                </div>

                {/* Row 9: Job Description */}
                <div className="tw-form-group">
                  <label className="tw-form-label">Job Description *</label>
                  <textarea
                    className="tw-form-textarea"
                    rows="4"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Provide a comprehensive overview of the role, day-to-day engineering responsibilities, architectural scope, and project expectations..."
                    required
                  ></textarea>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      color: '#64748B',
                      marginTop: '0.25rem',
                      display: 'block',
                    }}
                  >
                    Full job description displayed across public job boards,
                    applicant intake, and client requisition cards.
                  </span>
                </div>

                {/* Row 10: Requirements & Qualifications */}
                <div className="tw-form-group">
                  <label className="tw-form-label">
                    Requirements &amp; Qualifications
                  </label>
                  <textarea
                    className="tw-form-textarea"
                    rows="4"
                    value={formData.requirements}
                    onChange={(e) =>
                      setFormData({ ...formData, requirements: e.target.value })
                    }
                    placeholder="Enter candidate qualifications, prerequisites, and education (e.g.&#10;• Bachelor's/Master's degree in Computer Science or related technical discipline&#10;• 5+ years building and deploying scalable distributed systems&#10;• Proven experience with system architecture, CI/CD, and agile engineering&#10;• Strong problem-solving, communication, and client collaboration skills)"
                  ></textarea>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      color: '#64748B',
                      marginTop: '0.25rem',
                      display: 'block',
                    }}
                  >
                    Key candidate qualifications, experience benchmarks, and
                    domain prerequisites.
                  </span>
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
                  {editingJob ? 'Save Requisition' : 'Publish Requisition'}
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
              <h2 className="tw-modal-title">Close Requisition</h2>
              <button
                className="tw-modal-close-btn"
                onClick={() => setDeleteConfirmId(null)}
                title="Close"
              >
                <CloseIcon size={16} />
              </button>
            </div>
            <div className="tw-modal-body">
              Are you sure you want to close and archive this staffing
              requirement?
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
                Confirm Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Import Modal */}
      <DataImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        title="Import Job Requirements"
        subtitle="Bulk import staffing requisitions & job requirements from an Excel (.xlsx, .xls) or CSV file."
        columns={JOB_REQUIREMENT_COLUMNS}
        templateFilename="thinkwires_job_requirements_template"
        entityName="job requirements"
        apiImportFn={async (validRows) => {
          const res = await adminApi.bulkImportJobs(validRows);
          return res;
        }}
        onImportSuccess={(res) => {
          showToast(res.message || 'Job requirements imported successfully!');
          fetchJobs();
        }}
      />
    </div>
  );
};

export default JobsView;
