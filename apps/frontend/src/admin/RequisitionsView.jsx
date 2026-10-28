import React, { useState, useEffect } from 'react';
import { useOutletContext, useSearchParams, Link } from 'react-router-dom';
import { adminApi } from './adminService';
import {
  PlusIcon,
  EditIcon,
  TrashIcon,
  CloseIcon,
  CheckIcon,
  BuildingIcon,
  FileTextIcon,
  TargetIcon,
  SearchIcon,
  SparklesIcon,
  AlertCircleIcon,
  ClockIcon,
} from './AdminIcons';

const ENGAGEMENT_MODELS = [
  'Staff Augmentation',
  'Dedicated Pod',
  'Permanent Placement',
  'Contract to Hire',
  'Executive Search',
];

const SENIORITY_LEVELS = [
  'Principal / Lead (8+ yrs)',
  'Senior (5-8 yrs)',
  'Mid-level (3-5 yrs)',
  'Junior / Associate (1-3 yrs)',
];

const URGENCY_OPTIONS = [
  { value: 'immediate', label: 'Immediate (5-Hour SLA)' },
  { value: 'within_14_days', label: 'High (Within 14 Days)' },
  { value: 'flexible', label: 'Flexible (Standard Sourcing)' },
];

const RequisitionsView = () => {
  const { showToast, activeRole } = useOutletContext();
  const [searchParams, setSearchParams] = useSearchParams();

  const [requisitions, setRequisitions] = useState([]);
  const [clients, setClients] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [activeTab, setActiveTab] = useState(
    searchParams.get('status') || 'All'
  );
  const [urgencyFilter, setUrgencyFilter] = useState('All');
  const [modelFilter, setModelFilter] = useState('All');

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingReq, setEditingReq] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [matchModalRequisition, setMatchModalRequisition] = useState(null);
  const [approvalModalReq, setApprovalModalReq] = useState(null);
  const [approvalParams, setApprovalParams] = useState({
    status: 'Approved',
    noticePeriod: 'Immediate',
    priority: 'Urgent',
    workMode: 'Remote',
    recruiterNotes: '',
  });

  // Form state for creating / editing client requisition
  const [formData, setFormData] = useState({
    title: '',
    client: '',
    contactPerson: '',
    contactEmail: '',
    contactPhone: '',
    engagementModel: 'Staff Augmentation',
    seniority: 'Senior (5-8 yrs)',
    experienceRequired: 5,
    openingsCount: 1,
    requiredSkills: '',
    deploymentUrgency: 'immediate',
    workMode: 'Remote',
    officeLocation: '',
    budget: '$8,000 - $12,000 / mo',
    status: 'Inbound Request',
    description: '',
    requirements: '',
  });

  const [formError, setFormError] = useState('');
  const [isCustomClient, setIsCustomClient] = useState(false);

  const fetchRequisitions = () => {
    setLoading(true);
    adminApi
      .getRequisitions({
        search,
      })
      .then((res) => {
        setRequisitions(res.jobs || []);
        setLoading(false);
      })
      .catch((err) => {
        setLoading(false);
        showToast(`Failed to load requisitions: ${err.message}`);
      });
  };

  useEffect(() => {
    fetchRequisitions();
  }, [search]);

  useEffect(() => {
    adminApi
      .getClients()
      .then((res) => setClients(res.clients || []))
      .catch(() => {});
    adminApi
      .getCandidates()
      .then((res) => setCandidates(res.candidates || []))
      .catch(() => {});
  }, []);

  // Filtered requisitions list based on tab and dropdown filters
  const filteredRequisitions = requisitions.filter((req) => {
    // Status tab filter
    if (activeTab === 'Inbound Request') {
      if (
        req.status !== 'Inbound Request' &&
        req.status !== 'Inbound Requisition'
      ) {
        return false;
      }
    } else if (activeTab === 'Approved') {
      if (
        req.status !== 'Open' &&
        req.status !== 'Approved' &&
        req.status !== 'In Progress'
      ) {
        return false;
      }
    } else if (activeTab === 'Fulfilled') {
      if (req.status !== 'Fulfilled') return false;
    } else if (activeTab === 'Closed') {
      if (req.status !== 'Closed') return false;
    }

    // Urgency filter
    if (urgencyFilter !== 'All') {
      if (urgencyFilter === 'immediate') {
        if (
          req.deploymentUrgency !== 'immediate' &&
          req.priority !== 'Urgent'
        ) {
          return false;
        }
      } else if (urgencyFilter === 'within_14_days') {
        if (
          req.deploymentUrgency !== 'within_14_days' &&
          req.priority !== 'High'
        ) {
          return false;
        }
      } else if (urgencyFilter === 'flexible') {
        if (
          req.deploymentUrgency !== 'flexible' &&
          req.priority !== 'Medium' &&
          req.priority !== 'Low'
        ) {
          return false;
        }
      }
    }

    // Model filter
    if (modelFilter !== 'All') {
      if (
        req.engagementModel?.toLowerCase() !== modelFilter.toLowerCase() &&
        req.jobMode?.toLowerCase() !== modelFilter.toLowerCase()
      ) {
        return false;
      }
    }

    return true;
  });

  // Counters for tabs and stat cards
  const totalCount = requisitions.length;
  const inboundCount = requisitions.filter(
    (r) =>
      r.status === 'Inbound Request' || r.status === 'Inbound Requisition'
  ).length;
  const approvedCount = requisitions.filter(
    (r) =>
      r.status === 'Open' ||
      r.status === 'Approved' ||
      r.status === 'In Progress'
  ).length;
  const fulfilledCount = requisitions.filter(
    (r) => r.status === 'Fulfilled'
  ).length;
  const closedCount = requisitions.filter((r) => r.status === 'Closed').length;

  const openApproveModal = (reqItem) => {
    if (activeRole === 'viewer') {
      showToast('Viewer accounts cannot approve client requisitions.');
      return;
    }
    setApprovalModalReq(reqItem);
    setApprovalParams({
      status: 'Approved',
      noticePeriod: reqItem.noticePeriod || 'Immediate',
      priority: reqItem.priority || 'Urgent',
      workMode: reqItem.workMode || 'Remote',
      recruiterNotes: '',
    });
  };

  const handleConfirmApprove = (e) => {
    e.preventDefault();
    if (!approvalModalReq) return;

    const payload = {
      status: approvalParams.status,
      noticePeriod: approvalParams.noticePeriod,
      priority: approvalParams.priority,
      workMode: approvalParams.workMode,
      description: approvalParams.recruiterNotes
        ? `${approvalModalReq.description || ''}\n\n[Recruitment Briefing]: ${approvalParams.recruiterNotes}`.trim()
        : approvalModalReq.description,
      approvedAt: new Date().toISOString(),
    };

    const targetId =
      approvalModalReq._id || approvalModalReq.id || approvalModalReq.jobId;

    adminApi
      .approveRequisition(targetId, payload)
      .then((res) => {
        showToast(
          `Mandate "${approvalModalReq.title}" for ${approvalModalReq.client} approved as "${approvalParams.status}"! Position is now live in Job Requirements.`
        );
        setApprovalModalReq(null);
        setRequisitions((prev) =>
          prev.map((r) =>
            (r._id && r._id === targetId) ||
            (r.id && r.id === targetId) ||
            (r.jobId && r.jobId === targetId) ||
            (approvalModalReq.id && r.id === approvalModalReq.id) ||
            (approvalModalReq._id && r._id === approvalModalReq._id)
              ? { ...r, ...payload, ...(res?.job || {}) }
              : r
          )
        );
        fetchRequisitions();
      })
      .catch((err) => {
        showToast(`Approval failed: ${err.message}`);
      });
  };

  const openAddModal = () => {
    if (activeRole === 'viewer') {
      showToast('Viewer accounts cannot log requisitions.');
      return;
    }
    setEditingReq(null);
    setIsCustomClient(false);
    setFormData({
      title: '',
      client: clients[0]?.companyName || '',
      contactPerson: '',
      contactEmail: '',
      contactPhone: '',
      engagementModel: 'Staff Augmentation',
      seniority: 'Senior (5-8 yrs)',
      experienceRequired: 5,
      openingsCount: 1,
      requiredSkills: '',
      deploymentUrgency: 'immediate',
      workMode: 'Remote',
      officeLocation: '',
      budget: '$8,000 - $12,000 / mo',
      status: 'Inbound Request',
      description: '',
      requirements: '',
    });
    setFormError('');
    setCreateModalOpen(true);
  };

  const openEditModal = (reqItem) => {
    if (activeRole === 'viewer') {
      showToast('Viewer accounts cannot edit requisitions.');
      return;
    }
    setEditingReq(reqItem);
    const matchesClient = clients.some(
      (c) => c.companyName === reqItem.client
    );
    setIsCustomClient(!matchesClient && Boolean(reqItem.client));

    const skills = Array.isArray(reqItem.requiredSkills)
      ? reqItem.requiredSkills.join(', ')
      : Array.isArray(reqItem.skills)
        ? reqItem.skills.join(', ')
        : reqItem.requiredSkills || '';

    setFormData({
      title: reqItem.title || '',
      client: reqItem.client || '',
      contactPerson: reqItem.contactPerson || '',
      contactEmail: reqItem.contactEmail || '',
      contactPhone: reqItem.contactPhone || '',
      engagementModel: reqItem.engagementModel || 'Staff Augmentation',
      seniority: reqItem.seniority || 'Senior (5-8 yrs)',
      experienceRequired: reqItem.experienceRequired || 5,
      openingsCount: reqItem.openingsCount || reqItem.openings || 1,
      requiredSkills: skills,
      deploymentUrgency: reqItem.deploymentUrgency || 'immediate',
      workMode: reqItem.workMode || 'Remote',
      officeLocation: reqItem.officeLocation || '',
      budget: reqItem.budget || reqItem.salary || '$8,000 - $12,000 / mo',
      status: reqItem.status || 'Inbound Request',
      description: reqItem.description || '',
      requirements: reqItem.requirements || '',
    });
    setFormError('');
    setCreateModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.client.trim()) {
      setFormError('Please enter Target Role and Enterprise Client Name.');
      return;
    }

    const payload = {
      ...formData,
      isRequisition: true,
      category: 'Client Requisition',
      source: 'Client Mandate',
      requiredSkills: formData.requiredSkills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      skills: formData.requiredSkills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      priority:
        formData.deploymentUrgency === 'immediate'
          ? 'Urgent'
          : formData.deploymentUrgency === 'within_14_days'
            ? 'High'
            : 'Medium',
      location:
        formData.workMode === 'Work From Office' && formData.officeLocation
          ? formData.officeLocation
          : formData.workMode === 'Hybrid'
            ? `Hybrid (${formData.officeLocation || 'Office'})`
            : 'Remote (Global)',
    };

    if (editingReq) {
      adminApi
        .updateJob(editingReq.id || editingReq._id, payload)
        .then(() => {
          showToast(`Requisition "${formData.title}" updated successfully.`);
          setCreateModalOpen(false);
          fetchRequisitions();
        })
        .catch((err) => setFormError(err.message));
    } else {
      adminApi
        .createRequisition(payload)
        .then(() => {
          showToast(
            `Client Requisition "${formData.title}" logged successfully.`
          );
          setCreateModalOpen(false);
          fetchRequisitions();
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
        showToast('Client requisition archived.');
        setDeleteConfirmId(null);
        fetchRequisitions();
      })
      .catch((err) => showToast(`Action failed: ${err.message}`));
  };

  return (
    <div>
      {/* View Header */}
      <div className="tw-view-header">
        <div className="tw-view-title-group">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              marginBottom: '0.25rem',
            }}
          >
            <h1 style={{ margin: 0 }}>
              Enterprise Requisition Requests & Client Mandates
            </h1>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                backgroundColor: '#7C3AED',
                color: '#ffffff',
                padding: '0.15rem 0.6rem',
                borderRadius: '9999px',
                letterSpacing: '0.03em',
              }}
            >
              5-HOUR SLA ACTIVE
            </span>
          </div>
          <p className="tw-view-subtitle">
            Corporate talent orders dispatched via the Find Talent intake
            portal. Track SLA response compliance, review candidate bench
            matches, and approve mandates into active job requirements.
          </p>
        </div>

        <button
          className="tw-btn-primary"
          onClick={openAddModal}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            background: '#7C3AED',
            borderColor: '#6D28D9',
          }}
        >
          <PlusIcon size={15} />
          <span>Log Client Requisition</span>
        </button>
      </div>

      {/* Requisitions Lifecycle Stat Cards */}
      <div className="tw-kpi-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="tw-kpi-card">
          <div className="tw-kpi-header">
            <span className="tw-kpi-label">TOTAL MANDATES</span>
            <div
              className="tw-kpi-icon-wrap"
              style={{ backgroundColor: '#EDE9FE', color: '#7C3AED' }}
            >
              <FileTextIcon size={18} />
            </div>
          </div>
          <div className="tw-kpi-value">{totalCount}</div>
          <div className="tw-kpi-caption">
            Enterprise orders recorded across all pipeline stages
          </div>
        </div>

        <div className="tw-kpi-card">
          <div className="tw-kpi-header">
            <span className="tw-kpi-label">PENDING REVIEW & SLA</span>
            <span className="tw-sla-pill urgent">5-Hour SLA</span>
          </div>
          <div className="tw-kpi-value" style={{ color: '#7C3AED' }}>
            {inboundCount}
          </div>
          <div className="tw-kpi-caption">
            Inbound requests requiring candidate evaluation & review
          </div>
        </div>

        <div className="tw-kpi-card">
          <div className="tw-kpi-header">
            <span className="tw-kpi-label">APPROVED & ACTIVE SOURCING</span>
            <div
              className="tw-kpi-icon-wrap"
              style={{ backgroundColor: '#DCFCE7', color: '#16A34A' }}
            >
              <CheckIcon size={18} />
            </div>
          </div>
          <div className="tw-kpi-value" style={{ color: '#008F68' }}>
            {approvedCount}
          </div>
          <div className="tw-kpi-caption">
            Mandates live in active recruitment & candidate submission
          </div>
        </div>

        <div className="tw-kpi-card">
          <div className="tw-kpi-header">
            <span className="tw-kpi-label">FULFILLED PLACEMENTS</span>
            <div
              className="tw-kpi-icon-wrap"
              style={{ backgroundColor: '#DBEAFE', color: '#2563EB' }}
            >
              <TargetIcon size={18} />
            </div>
          </div>
          <div className="tw-kpi-value">{fulfilledCount}</div>
          <div className="tw-kpi-caption">
            Mandates fully staffed with deployed engineers
          </div>
        </div>
      </div>

      {/* Main Table Container with Status Tabs */}
      <div className="tw-table-container">
        {/* Navigation Tabs */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid #E2E8F0',
            padding: '0 1rem',
            background: '#FAFBFD',
            gap: '0.5rem',
            overflowX: 'auto',
          }}
        >
          {[
            { id: 'All', label: 'All Requisitions', count: totalCount },
            {
              id: 'Inbound Request',
              label: 'Pending Review (Inbound)',
              count: inboundCount,
              badgeColor: '#7C3AED',
            },
            {
              id: 'Approved',
              label: 'Approved & Sourcing',
              count: approvedCount,
              badgeColor: '#008F68',
            },
            {
              id: 'Fulfilled',
              label: 'Fulfilled',
              count: fulfilledCount,
            },
            {
              id: 'Closed',
              label: 'Closed',
              count: closedCount,
            },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.id !== 'All') {
                    setSearchParams({ status: tab.id });
                  } else {
                    setSearchParams({});
                  }
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '0.85rem 0.95rem',
                  fontSize: '0.85rem',
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? '#0F172A' : '#64748B',
                  borderBottom: isActive
                    ? '2.5px solid #7C3AED'
                    : '2.5px solid transparent',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>{tab.label}</span>
                <span
                  style={{
                    fontSize: '0.72rem',
                    padding: '0.1rem 0.45rem',
                    borderRadius: '9999px',
                    backgroundColor: isActive
                      ? tab.badgeColor || '#0F172A'
                      : '#E2E8F0',
                    color: isActive ? '#FFFFFF' : '#475569',
                    fontWeight: 700,
                  }}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Toolbar with Filters */}
        <div
          className="tw-table-toolbar"
          style={{ flexWrap: 'wrap', gap: '0.65rem' }}
        >
          <div
            className="tw-table-filters"
            style={{ flexWrap: 'wrap', gap: '0.5rem' }}
          >
            <div style={{ position: 'relative', width: '260px' }}>
              <input
                type="text"
                className="tw-filter-input"
                placeholder="Search role, client, contact, skill..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: '100%', paddingLeft: '2rem' }}
              />
              <span
                style={{
                  position: 'absolute',
                  left: '0.65rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#94A3B8',
                  pointerEvents: 'none',
                }}
              >
                <SearchIcon size={14} />
              </span>
            </div>

            <select
              className="tw-filter-select"
              value={urgencyFilter}
              onChange={(e) => setUrgencyFilter(e.target.value)}
              style={{ maxWidth: '190px' }}
            >
              <option value="All">All Urgency & SLAs</option>
              <option value="immediate">Immediate (5-Hour SLA)</option>
              <option value="within_14_days">Within 14 Days</option>
              <option value="flexible">Flexible / Standard</option>
            </select>

            <select
              className="tw-filter-select"
              value={modelFilter}
              onChange={(e) => setModelFilter(e.target.value)}
              style={{ maxWidth: '190px' }}
            >
              <option value="All">All Engagement Models</option>
              {ENGAGEMENT_MODELS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div
            style={{ fontSize: '0.8rem', color: '#64748B', marginLeft: 'auto' }}
          >
            Showing <strong>{filteredRequisitions.length}</strong> client
            mandates
          </div>
        </div>

        {/* Requisitions Table (Desktop: >768px) */}
        <div className="RequisitionsTable" style={{ overflowX: 'auto' }}>
          <table className="tw-table">
            <thead>
              <tr>
                <th style={{ minWidth: '240px' }}>Requisition ID & Target Role</th>
                <th style={{ minWidth: '200px' }}>Enterprise Client & Contact</th>
                <th style={{ minWidth: '170px' }}>Required Tech Stack</th>
                <th style={{ minWidth: '130px' }}>Urgency & SLA</th>
                <th style={{ minWidth: '140px' }}>Budget Envelope</th>
                <th style={{ minWidth: '110px' }}>Status</th>
                <th style={{ textAlign: 'right', minWidth: '190px' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan="7"
                    style={{
                      textAlign: 'center',
                      padding: '2.5rem',
                      color: '#64748B',
                    }}
                  >
                    Loading client requisitions...
                  </td>
                </tr>
              ) : filteredRequisitions.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    style={{
                      textAlign: 'center',
                      padding: '2.5rem',
                      color: '#64748B',
                    }}
                  >
                    <div style={{ marginBottom: '0.5rem', fontWeight: 600 }}>
                      No client requisitions found in this view.
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
                      Try adjusting your search query or status tab filter.
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRequisitions.map((reqItem) => {
                  const skillsList =
                    Array.isArray(reqItem.requiredSkills) &&
                    reqItem.requiredSkills.length > 0
                      ? reqItem.requiredSkills
                      : Array.isArray(reqItem.skills)
                        ? reqItem.skills
                        : [];

                  const isInbound =
                    reqItem.status === 'Inbound Request' ||
                    reqItem.status === 'Inbound Requisition';

                  const isApproved =
                    reqItem.status === 'Open' ||
                    reqItem.status === 'Approved' ||
                    reqItem.status === 'In Progress';

                  const displayId =
                    reqItem.jobId ||
                    `REQ-${(reqItem.id || '').toString().slice(-6)}`;

                  const isImmediate =
                    reqItem.deploymentUrgency === 'immediate' ||
                    reqItem.priority === 'Urgent';

                  return (
                    <tr key={reqItem.id || reqItem._id}>
                      {/* Target Role & Requisition ID */}
                      <td data-label="Target Role">
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
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              padding: '0.15rem 0.45rem',
                              borderRadius: '4px',
                              backgroundColor: '#EDE9FE',
                              color: '#6D28D9',
                              border: '1px solid #DDD6FE',
                            }}
                          >
                            {displayId}
                          </span>
                          <span
                            style={{
                              fontWeight: 700,
                              fontSize: '0.88rem',
                              color: '#0F172A',
                            }}
                          >
                            {reqItem.title}
                          </span>
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
                              color: '#334155',
                              fontWeight: 600,
                            }}
                          >
                            {reqItem.openingsCount || reqItem.openings || 1}{' '}
                            Positions
                          </span>
                          <span
                            style={{
                              fontSize: '0.67rem',
                              padding: '0.1rem 0.4rem',
                              borderRadius: '4px',
                              backgroundColor: '#E0F2FE',
                              color: '#0369A1',
                              fontWeight: 600,
                            }}
                          >
                            {reqItem.engagementModel || 'Staff Augmentation'}
                          </span>
                          <span
                            style={{
                              fontSize: '0.67rem',
                              color: '#64748B',
                              marginLeft: '0.2rem',
                            }}
                          >
                            {reqItem.seniority ||
                              `${reqItem.experienceRequired || 5}+ yrs exp`}
                          </span>
                        </div>

                        {reqItem.description && (
                          <div
                            style={{
                              fontSize: '0.73rem',
                              color: '#64748B',
                              marginTop: '0.35rem',
                              lineHeight: '1.4',
                              maxWidth: '320px',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}
                            title={reqItem.description}
                          >
                            {reqItem.description}
                          </div>
                        )}
                      </td>

                      {/* Client Partner & Contact */}
                      <td data-label="Client & Contact">
                        <div
                          style={{
                            fontWeight: 700,
                            color: '#1E293B',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                          }}
                        >
                          <BuildingIcon size={14} color="#64748B" />
                          <span>{reqItem.client || 'Enterprise Partner'}</span>
                        </div>

                        {reqItem.contactPerson && (
                          <div
                            style={{
                              fontSize: '0.76rem',
                              color: '#334155',
                              marginTop: '0.2rem',
                              fontWeight: 500,
                            }}
                          >
                            {reqItem.contactPerson}
                          </div>
                        )}

                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.15rem',
                            marginTop: '0.2rem',
                          }}
                        >
                          {reqItem.contactEmail && (
                            <a
                              href={`mailto:${reqItem.contactEmail}`}
                              style={{
                                fontSize: '0.72rem',
                                color: '#2563EB',
                                textDecoration: 'none',
                              }}
                              title={`Email ${reqItem.contactEmail}`}
                            >
                              {reqItem.contactEmail}
                            </a>
                          )}
                          {reqItem.contactPhone && (
                            <a
                              href={`tel:${reqItem.contactPhone}`}
                              style={{
                                fontSize: '0.7rem',
                                color: '#64748B',
                                textDecoration: 'none',
                              }}
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: '0.8rem', verticalAlign: 'middle' }}>call</span> {reqItem.contactPhone}
                            </a>
                          )}
                        </div>
                      </td>

                      {/* Required Tech Stack */}
                      <td data-label="Required Tech Stack">
                        <div
                          style={{
                            display: 'flex',
                            gap: '0.25rem',
                            flexWrap: 'wrap',
                            maxWidth: '190px',
                          }}
                        >
                          {skillsList.slice(0, 4).map((sk, idx) => (
                            <span
                              key={idx}
                              style={{
                                fontSize: '0.67rem',
                                padding: '0.12rem 0.4rem',
                                borderRadius: '4px',
                                backgroundColor: '#EDE9FE',
                                color: '#6D28D9',
                                fontWeight: 600,
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
                                padding: '0.1rem 0.25rem',
                              }}
                            >
                              +{skillsList.length - 4}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Urgency & SLA */}
                      <td data-label="Urgency & SLA">
                        {isImmediate ? (
                           <span className="tw-sla-pill urgent">5-Hour SLA</span>
                        ) : reqItem.deploymentUrgency === 'within_14_days' ? (
                          <span className="tw-sla-pill warning">14-Day SLA</span>
                        ) : (
                          <span className="tw-sla-pill normal">Flexible SLA</span>
                        )}
                        <div
                          style={{
                            fontSize: '0.7rem',
                            color: '#94A3B8',
                            marginTop: '0.25rem',
                          }}
                        >
                          {reqItem.postedDate ||
                            (reqItem.createdAt
                              ? new Date(reqItem.createdAt).toLocaleDateString()
                              : 'Active')}
                        </div>
                      </td>

                      {/* Budget */}
                      <td data-label="Budget Envelope">
                        <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                          {reqItem.budget || reqItem.salary || 'Competitive'}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#64748B' }}>
                          {reqItem.workMode || 'Remote'}
                        </div>
                      </td>

                      {/* Status */}
                      <td data-label="Status">
                        {isInbound ? (
                          <span
                            className="tw-badge inbound-request"
                            style={{
                              backgroundColor: '#EDE9FE',
                              color: '#6D28D9',
                              border: '1px solid #DDD6FE',
                              fontWeight: 700,
                            }}
                          >
                            Inbound Review
                          </span>
                        ) : isApproved ? (
                          <span
                            className="tw-badge open"
                            style={{
                              backgroundColor: '#DCFCE7',
                              color: '#15803D',
                              border: '1px solid #BBF7D0',
                              fontWeight: 700,
                            }}
                          >
                            Approved & Active
                          </span>
                        ) : (
                          <span
                            className={`tw-badge ${String(reqItem.status || '').toLowerCase().replace(/\s+/g, '-')}`}
                          >
                            {reqItem.status || 'Active'}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td data-label="Actions" style={{ textAlign: 'right' }}>
                        <div
                          className="tw-action-btn-group"
                          style={{
                            justifyContent: 'flex-end',
                            alignItems: 'center',
                            flexWrap: 'nowrap',
                          }}
                        >
                          {/* Approve Mandate */}
                          {isInbound && (
                            <button
                              className="tw-btn-primary"
                              onClick={() => openApproveModal(reqItem)}
                              title="Review and approve client mandate for candidate sourcing"
                              style={{
                                padding: '0.25rem 0.55rem',
                                fontSize: '0.72rem',
                                background: '#008F68',
                                borderColor: '#007A58',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                              }}
                            >
                              <CheckIcon size={12} />
                              <span>Approve</span>
                            </button>
                          )}

                          {/* Link to active job requirement if already approved */}
                          {isApproved && (
                            <Link
                              to={`/admin/jobs?search=${encodeURIComponent(reqItem.client || reqItem.title)}`}
                              className="tw-btn-secondary"
                              title="View active recruitment posting in Job Requirements"
                              style={{
                                padding: '0.25rem 0.55rem',
                                fontSize: '0.7rem',
                                textDecoration: 'none',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              View in Jobs →
                            </Link>
                          )}

                          {/* AI Candidate Matching */}
                          <button
                            className="tw-btn-secondary"
                            onClick={() => setMatchModalRequisition(reqItem)}
                            title="Benchmark active candidates against this requisition"
                            style={{
                              padding: '0.25rem 0.5rem',
                              fontSize: '0.7rem',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              borderColor: '#C7D2FE',
                              color: '#4338CA',
                              backgroundColor: '#EEF2FF',
                            }}
                          >
                            <SparklesIcon size={12} color="#4F46E5" />
                            <span>Match</span>
                          </button>

                          {/* Edit */}
                          <button
                            className="tw-action-icon-btn"
                            onClick={() => openEditModal(reqItem)}
                            title="Edit Requisition Details"
                          >
                            <EditIcon size={14} />
                          </button>

                          {/* Delete / Archive */}
                          <button
                            className="tw-action-icon-btn delete"
                            onClick={() =>
                              setDeleteConfirmId(reqItem.id || reqItem._id)
                            }
                            title="Archive Requisition"
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

        {/* Requisitions Card List (Mobile: <=768px) */}
        <div className="RequisitionsCardList">
          {loading ? (
            <div className="RequisitionsCardList-empty">
              Loading client requisitions...
            </div>
          ) : filteredRequisitions.length === 0 ? (
            <div className="RequisitionsCardList-empty">
              <div style={{ marginBottom: '0.5rem', fontWeight: 600 }}>
                No client requisitions found in this view.
              </div>
              <div style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
                Try adjusting your search query or status tab filter.
              </div>
            </div>
          ) : (
            filteredRequisitions.map((reqItem) => {
              const skillsList =
                Array.isArray(reqItem.requiredSkills) &&
                reqItem.requiredSkills.length > 0
                  ? reqItem.requiredSkills
                  : Array.isArray(reqItem.skills)
                    ? reqItem.skills
                    : [];

              const isInbound =
                reqItem.status === 'Inbound Request' ||
                reqItem.status === 'Inbound Requisition';

              const isApproved =
                reqItem.status === 'Open' ||
                reqItem.status === 'Approved' ||
                reqItem.status === 'In Progress';

              const displayId =
                reqItem.jobId ||
                `REQ-${(reqItem.id || '').toString().slice(-6)}`;

              const isImmediate =
                reqItem.deploymentUrgency === 'immediate' ||
                reqItem.priority === 'Urgent';

              return (
                <div
                  key={reqItem.id || reqItem._id}
                  className="RequisitionCard"
                >
                  {/* Card Header: Role & ID */}
                  <div className="RequisitionCard-header">
                    <div className="RequisitionCard-topRow">
                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          padding: '0.15rem 0.45rem',
                          borderRadius: '4px',
                          backgroundColor: '#EDE9FE',
                          color: '#6D28D9',
                          border: '1px solid #DDD6FE',
                        }}
                      >
                        {displayId}
                      </span>
                      {/* Status */}
                      {isInbound ? (
                        <span
                          className="tw-badge inbound-request"
                          style={{
                            backgroundColor: '#EDE9FE',
                            color: '#6D28D9',
                            border: '1px solid #DDD6FE',
                            fontWeight: 700,
                          }}
                        >
                          Inbound Review
                        </span>
                      ) : isApproved ? (
                        <span
                          className="tw-badge open"
                          style={{
                            backgroundColor: '#DCFCE7',
                            color: '#15803D',
                            border: '1px solid #BBF7D0',
                            fontWeight: 700,
                          }}
                        >
                          Approved & Active
                        </span>
                      ) : (
                        <span
                          className={`tw-badge ${String(reqItem.status || '').toLowerCase().replace(/\s+/g, '-')}`}
                        >
                          {reqItem.status || 'Active'}
                        </span>
                      )}
                    </div>

                    <h3 className="RequisitionCard-role">{reqItem.title}</h3>

                    {/* Client Name & Contact */}
                    <div className="RequisitionCard-clientRow">
                      <BuildingIcon size={14} color="#64748B" />
                      <span>{reqItem.client || 'Enterprise Partner'}</span>
                    </div>

                    {(reqItem.contactPerson || reqItem.contactEmail || reqItem.contactPhone) && (
                      <div className="RequisitionCard-clientDetails">
                        {reqItem.contactPerson && (
                          <span style={{ fontWeight: 500, color: '#334155' }}>
                            Contact: {reqItem.contactPerson}
                          </span>
                        )}
                        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                          {reqItem.contactEmail && (
                            <a
                              href={`mailto:${reqItem.contactEmail}`}
                              style={{ color: '#2563EB', textDecoration: 'none' }}
                            >
                              {reqItem.contactEmail}
                            </a>
                          )}
                          {reqItem.contactPhone && (
                            <a
                              href={`tel:${reqItem.contactPhone}`}
                              style={{ color: '#64748B', textDecoration: 'none' }}
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: '0.8rem', verticalAlign: 'middle' }}>call</span> {reqItem.contactPhone}
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Grid for Headcount, Budget, SLA, and Work Mode */}
                  <div className="RequisitionCard-detailsGrid">
                    <div className="RequisitionCard-detailItem">
                      <span className="RequisitionCard-detailLabel">Headcount</span>
                      <span className="RequisitionCard-detailValue">
                        {reqItem.openingsCount || reqItem.openings || 1} Positions ({reqItem.engagementModel || 'Staff Augmentation'})
                      </span>
                    </div>

                    <div className="RequisitionCard-detailItem">
                      <span className="RequisitionCard-detailLabel">Budget</span>
                      <span className="RequisitionCard-detailValue">
                        {reqItem.budget || reqItem.salary || 'Competitive'}
                      </span>
                    </div>

                    <div className="RequisitionCard-detailItem">
                      <span className="RequisitionCard-detailLabel">SLA & Urgency</span>
                      <span className="RequisitionCard-detailValue">
                        {isImmediate ? (
                          <span className="tw-sla-pill urgent" style={{ display: 'inline-block', fontSize: '0.65rem' }}>5-Hour SLA</span>
                        ) : reqItem.deploymentUrgency === 'within_14_days' ? (
                          <span className="tw-sla-pill warning" style={{ display: 'inline-block', fontSize: '0.65rem' }}>14-Day SLA</span>
                        ) : (
                          <span className="tw-sla-pill normal" style={{ display: 'inline-block', fontSize: '0.65rem' }}>Flexible SLA</span>
                        )}
                      </span>
                    </div>

                    <div className="RequisitionCard-detailItem">
                      <span className="RequisitionCard-detailLabel">Location & Mode</span>
                      <span className="RequisitionCard-detailValue">
                        {reqItem.workMode || 'Remote'}
                        {reqItem.seniority ? ` • ${reqItem.seniority}` : ''}
                      </span>
                    </div>
                  </div>

                  {/* Skills */}
                  {skillsList.length > 0 && (
                    <div className="RequisitionCard-skills">
                      {skillsList.map((sk, idx) => (
                        <span
                          key={idx}
                          style={{
                            fontSize: '0.67rem',
                            padding: '0.12rem 0.4rem',
                            borderRadius: '4px',
                            backgroundColor: '#EDE9FE',
                            color: '#6D28D9',
                            fontWeight: 600,
                          }}
                        >
                          {sk}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Card Actions */}
                  <div className="RequisitionCard-actions">
                    {/* Approve Mandate */}
                    {isInbound && (
                      <button
                        className="tw-btn-primary"
                        onClick={() => openApproveModal(reqItem)}
                        title="Review and approve client mandate for candidate sourcing"
                        style={{
                          padding: '0.28rem 0.65rem',
                          fontSize: '0.75rem',
                          background: '#008F68',
                          borderColor: '#007A58',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                        }}
                      >
                        <CheckIcon size={12} />
                        <span>Approve</span>
                      </button>
                    )}

                    {/* Link to active job requirement if already approved */}
                    {isApproved && (
                      <Link
                        to={`/admin/jobs?search=${encodeURIComponent(reqItem.client || reqItem.title)}`}
                        className="tw-btn-secondary"
                        title="View active recruitment posting in Job Requirements"
                        style={{
                          padding: '0.28rem 0.65rem',
                          fontSize: '0.72rem',
                          textDecoration: 'none',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        View in Jobs →
                      </Link>
                    )}

                    {/* AI Candidate Matching */}
                    <button
                      className="tw-btn-secondary"
                      onClick={() => setMatchModalRequisition(reqItem)}
                      title="Benchmark active candidates against this requisition"
                      style={{
                        padding: '0.28rem 0.65rem',
                        fontSize: '0.72rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        borderColor: '#C7D2FE',
                        color: '#4338CA',
                        backgroundColor: '#EEF2FF',
                      }}
                    >
                      <SparklesIcon size={12} color="#4F46E5" />
                      <span>Match</span>
                    </button>

                    {/* Edit */}
                    <button
                      className="tw-action-icon-btn"
                      onClick={() => openEditModal(reqItem)}
                      title="Edit Requisition Details"
                    >
                      <EditIcon size={14} />
                    </button>

                    {/* Delete / Archive */}
                    <button
                      className="tw-action-icon-btn delete"
                      onClick={() =>
                        setDeleteConfirmId(reqItem.id || reqItem._id)
                      }
                      title="Archive Requisition"
                    >
                      <TrashIcon size={14} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Interactive Mandate Approval Confirmation Modal */}
      {approvalModalReq && (
        <div className="tw-modal-overlay">
          <div className="tw-modal" style={{ maxWidth: '640px' }}>
            <div className="tw-modal-header">
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                }}
              >
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '8px',
                    backgroundColor: '#DCFCE7',
                    color: '#15803D',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CheckIcon size={18} />
                </div>
                <div>
                  <h2
                    className="tw-modal-title"
                    style={{ margin: 0, fontSize: '1.1rem' }}
                  >
                    Approve Client Mandate
                  </h2>
                  <div className="tw-modal-subtitle">
                    Review terms & confirm publishing to active Job Requirements
                  </div>
                </div>
              </div>
              <button
                className="tw-modal-close-btn"
                onClick={() => setApprovalModalReq(null)}
              >
                <CloseIcon size={16} />
              </button>
            </div>

            <form onSubmit={handleConfirmApprove}>
              <div className="tw-modal-body">
                {/* Mandate Summary Card */}
                <div
                  style={{
                    backgroundColor: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px',
                    padding: '0.9rem 1rem',
                    marginBottom: '1.25rem',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '0.4rem',
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: '0.95rem',
                          color: '#0F172A',
                        }}
                      >
                        {approvalModalReq.title}
                      </div>
                      <div
                        style={{
                          fontSize: '0.8rem',
                          color: '#475569',
                          marginTop: '0.15rem',
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '0.85rem', verticalAlign: 'middle', marginRight: '3px' }}>domain</span><strong>{approvalModalReq.client}</strong>
                        {approvalModalReq.contactPerson
                          ? ` • Lead: ${approvalModalReq.contactPerson}`
                          : ''}
                        {approvalModalReq.contactEmail
                          ? ` (${approvalModalReq.contactEmail})`
                          : ''}
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '0.15rem 0.5rem',
                        borderRadius: '4px',
                        backgroundColor: '#EDE9FE',
                        color: '#6D28D9',
                      }}
                    >
                      {approvalModalReq.jobId || 'REQ'}
                    </span>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      gap: '0.4rem',
                      flexWrap: 'wrap',
                      marginTop: '0.5rem',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.7rem',
                        padding: '0.12rem 0.45rem',
                        borderRadius: '4px',
                        backgroundColor: '#E2E8F0',
                        color: '#334155',
                        fontWeight: 600,
                      }}
                    >
                      {approvalModalReq.openingsCount ||
                        approvalModalReq.openings ||
                        1}{' '}
                      Openings
                    </span>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        padding: '0.12rem 0.45rem',
                        borderRadius: '4px',
                        backgroundColor: '#E0F2FE',
                        color: '#0369A1',
                        fontWeight: 600,
                      }}
                    >
                      {approvalModalReq.engagementModel || 'Staff Augmentation'}
                    </span>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        padding: '0.12rem 0.45rem',
                        borderRadius: '4px',
                        backgroundColor: '#FEF3C7',
                        color: '#92400E',
                        fontWeight: 600,
                      }}
                    >
                      {approvalModalReq.budget || 'Competitive Envelope'}
                    </span>
                  </div>
                </div>

                {/* Configurable Approval Options */}
                <div className="tw-form-grid" style={{ marginBottom: '1rem' }}>
                  <div className="tw-form-group">
                    <label className="tw-label">
                      Approval Status Designation
                    </label>
                    <select
                      className="tw-input"
                      value={approvalParams.status}
                      onChange={(e) =>
                        setApprovalParams({
                          ...approvalParams,
                          status: e.target.value,
                        })
                      }
                    >
                      <option value="Approved">
                        Approved (Mandate Sourcing Active)
                      </option>
                      <option value="Open">
                        Open (General Job Requirement)
                      </option>
                    </select>
                    <div
                      style={{
                        fontSize: '0.72rem',
                        color: '#64748B',
                        marginTop: '0.25rem',
                      }}
                    >
                      Status will update to{' '}
                      <strong>{approvalParams.status}</strong> across desks.
                    </div>
                  </div>

                  <div className="tw-form-group">
                    <label className="tw-label">Notice Period Benchmark</label>
                    <select
                      className="tw-input"
                      value={approvalParams.noticePeriod}
                      onChange={(e) =>
                        setApprovalParams({
                          ...approvalParams,
                          noticePeriod: e.target.value,
                        })
                      }
                    >
                      <option value="Immediate">Immediate Joiners</option>
                      <option value="Within 14 Days">Within 14 Days</option>
                      <option value="< 30 Days">&lt; 30 Days Notice</option>
                      <option value="On Notice Period">
                        Currently on Notice Period
                      </option>
                    </select>
                  </div>

                  <div className="tw-form-group">
                    <label className="tw-label">Sourcing Priority</label>
                    <select
                      className="tw-input"
                      value={approvalParams.priority}
                      onChange={(e) =>
                        setApprovalParams({
                          ...approvalParams,
                          priority: e.target.value,
                        })
                      }
                    >
                      <option value="Urgent">Urgent (5-Hour Response SLA)</option>
                      <option value="High">High Priority</option>
                      <option value="Medium">Medium Priority</option>
                    </select>
                  </div>

                  <div className="tw-form-group">
                    <label className="tw-label">
                      Deployment Work Arrangement
                    </label>
                    <select
                      className="tw-input"
                      value={approvalParams.workMode}
                      onChange={(e) =>
                        setApprovalParams({
                          ...approvalParams,
                          workMode: e.target.value,
                        })
                      }
                    >
                      <option value="Remote">
                        Remote (Global / India / US)
                      </option>
                      <option value="Hybrid">Hybrid</option>
                      <option value="Work From Office">Work From Office</option>
                    </select>
                  </div>

                  <div
                    className="tw-form-group"
                    style={{ gridColumn: '1 / -1' }}
                  >
                    <label className="tw-label">
                      Recruitment Briefing Notes / Special Instructions
                    </label>
                    <textarea
                      className="tw-textarea"
                      rows="2"
                      placeholder="Add specific instructions for talent sourcers (e.g., Prioritize AWS certified candidates with multi-region migration experience)..."
                      value={approvalParams.recruiterNotes}
                      onChange={(e) =>
                        setApprovalParams({
                          ...approvalParams,
                          recruiterNotes: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="tw-modal-footer">
                <button
                  type="button"
                  className="tw-btn-secondary"
                  onClick={() => setApprovalModalReq(null)}
                >
                  Cancel
                </button>
                <button
                  id="confirm-approval-btn"
                  type="submit"
                  className="tw-btn-primary"
                  style={{
                    backgroundColor: '#008F68',
                    borderColor: '#007A58',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                  }}
                >
                  <CheckIcon size={14} />
                  <span>Confirm Approval & Publish</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete / Archive Confirmation Modal */}
      {deleteConfirmId && (
        <div className="tw-modal-overlay">
          <div className="tw-modal" style={{ maxWidth: '440px' }}>
            <div className="tw-modal-header">
              <h2 className="tw-modal-title">Archive Client Requisition</h2>
              <button
                className="tw-modal-close-btn"
                onClick={() => setDeleteConfirmId(null)}
              >
                <CloseIcon size={16} />
              </button>
            </div>
            <div className="tw-modal-body">
              <p style={{ fontSize: '0.88rem', color: '#475569', margin: 0 }}>
                Are you sure you want to archive this requisition? This mandate
                will be removed from active SLA queues and recruitment desks.
              </p>
            </div>
            <div className="tw-modal-footer">
              <button
                className="tw-btn-secondary"
                onClick={() => setDeleteConfirmId(null)}
              >
                Cancel
              </button>
              <button
                className="tw-btn-primary"
                onClick={() => handleDelete(deleteConfirmId)}
                style={{ backgroundColor: '#DC2626', borderColor: '#B91C1C' }}
              >
                Yes, Archive Mandate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Client Requisition Modal */}
      {createModalOpen && (
        <div className="tw-modal-overlay">
          <div className="tw-modal" style={{ maxWidth: '720px' }}>
            <div className="tw-modal-header">
              <h2 className="tw-modal-title">
                {editingReq
                  ? `Edit Requisition: ${editingReq.title}`
                  : 'Log New Client Talent Requisition'}
              </h2>
              <button
                className="tw-modal-close-btn"
                onClick={() => setCreateModalOpen(false)}
              >
                <CloseIcon size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="tw-modal-body">
                {formError && (
                  <div className="tw-form-error" style={{ marginBottom: '1rem' }}>
                    <AlertCircleIcon size={16} />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Section 1: Enterprise Client Information */}
                <div
                  style={{
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    color: '#64748B',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '0.75rem',
                  }}
                >
                  1. Enterprise Partner & Contact Lead
                </div>

                <div className="tw-form-grid" style={{ marginBottom: '1rem' }}>
                  <div className="tw-form-group">
                    <label className="tw-label">
                      Client Enterprise <span className="tw-required">*</span>
                    </label>
                    {!isCustomClient ? (
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <select
                          className="tw-input"
                          value={formData.client}
                          onChange={(e) =>
                            setFormData({ ...formData, client: e.target.value })
                          }
                          required
                        >
                          <option value="">Select Existing Enterprise...</option>
                          {clients.map((c) => (
                            <option
                              key={c.id || c._id}
                              value={c.companyName}
                            >
                              {c.companyName}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          className="tw-btn-secondary"
                          onClick={() => {
                            setIsCustomClient(true);
                            setFormData({ ...formData, client: '' });
                          }}
                          style={{ whiteSpace: 'nowrap', fontSize: '0.78rem' }}
                        >
                          + New Enterprise
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input
                          type="text"
                          className="tw-input"
                          placeholder="e.g. Stripe Payments Global"
                          value={formData.client}
                          onChange={(e) =>
                            setFormData({ ...formData, client: e.target.value })
                          }
                          required
                        />
                        <button
                          type="button"
                          className="tw-btn-secondary"
                          onClick={() => {
                            setIsCustomClient(false);
                            setFormData({
                              ...formData,
                              client: clients[0]?.companyName || '',
                            });
                          }}
                          style={{ whiteSpace: 'nowrap', fontSize: '0.78rem' }}
                        >
                          Select Existing
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="tw-form-group">
                    <label className="tw-label">Contact Person Name</label>
                    <input
                      type="text"
                      className="tw-input"
                      placeholder="e.g. Vikramaditya Sengupta (VP Tech)"
                      value={formData.contactPerson}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          contactPerson: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="tw-form-group">
                    <label className="tw-label">Corporate Email Address</label>
                    <input
                      type="email"
                      className="tw-input"
                      placeholder="v.sengupta@stripe-payments.com"
                      value={formData.contactEmail}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          contactEmail: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="tw-form-group">
                    <label className="tw-label">Contact Phone / WhatsApp</label>
                    <input
                      type="text"
                      className="tw-input"
                      placeholder="+91 98201 54321"
                      value={formData.contactPhone}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          contactPhone: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                {/* Section 2: Mandate Role & Technical Requirements */}
                <div
                  style={{
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    color: '#64748B',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '0.75rem',
                  }}
                >
                  2. Mandate Specification & Technical Skills
                </div>

                <div className="tw-form-grid" style={{ marginBottom: '1rem' }}>
                  <div className="tw-form-group">
                    <label className="tw-label">
                      Target Role Title <span className="tw-required">*</span>
                    </label>
                    <input
                      type="text"
                      className="tw-input"
                      placeholder="e.g. Principal Cloud & Kubernetes Architect"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="tw-form-group">
                    <label className="tw-label">Engagement Model</label>
                    <select
                      className="tw-input"
                      value={formData.engagementModel}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          engagementModel: e.target.value,
                        })
                      }
                    >
                      {ENGAGEMENT_MODELS.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="tw-form-group">
                    <label className="tw-label">Seniority Level</label>
                    <select
                      className="tw-input"
                      value={formData.seniority}
                      onChange={(e) =>
                        setFormData({ ...formData, seniority: e.target.value })
                      }
                    >
                      {SENIORITY_LEVELS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="tw-form-group">
                    <label className="tw-label">Headcount / Positions</label>
                    <input
                      type="number"
                      min="1"
                      className="tw-input"
                      value={formData.openingsCount}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          openingsCount: Number(e.target.value),
                        })
                      }
                      required
                    />
                  </div>

                  <div className="tw-form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="tw-label">
                      Required Tech Stack (Comma separated)
                    </label>
                    <input
                      type="text"
                      className="tw-input"
                      placeholder="e.g. AWS, Kubernetes, Terraform, Go, EKS"
                      value={formData.requiredSkills}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          requiredSkills: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                {/* Section 3: SLA, Location & Budget */}
                <div
                  style={{
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    color: '#64748B',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '0.75rem',
                  }}
                >
                  3. SLA Response Terms, Work Mode & Budget
                </div>

                <div className="tw-form-grid" style={{ marginBottom: '1rem' }}>
                  <div className="tw-form-group">
                    <label className="tw-label">Deployment Urgency & SLA</label>
                    <select
                      className="tw-input"
                      value={formData.deploymentUrgency}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          deploymentUrgency: e.target.value,
                        })
                      }
                    >
                      {URGENCY_OPTIONS.map((u) => (
                        <option key={u.value} value={u.value}>
                          {u.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="tw-form-group">
                    <label className="tw-label">Work Arrangement</label>
                    <select
                      className="tw-input"
                      value={formData.workMode}
                      onChange={(e) =>
                        setFormData({ ...formData, workMode: e.target.value })
                      }
                    >
                      <option value="Remote">Remote (Global / India / US)</option>
                      <option value="Hybrid">Hybrid</option>
                      <option value="Work From Office">Work From Office</option>
                    </select>
                  </div>

                  <div className="tw-form-group">
                    <label className="tw-label">Budget Envelope / Bracket</label>
                    <input
                      type="text"
                      className="tw-input"
                      placeholder="e.g. $12,000 - $18,000 / mo"
                      value={formData.budget}
                      onChange={(e) =>
                        setFormData({ ...formData, budget: e.target.value })
                      }
                    />
                  </div>

                  <div className="tw-form-group">
                    <label className="tw-label">Mandate Status</label>
                    <select
                      className="tw-input"
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({ ...formData, status: e.target.value })
                      }
                    >
                      <option value="Inbound Request">
                        Inbound Request (Pending Review)
                      </option>
                      <option value="Open">Approved & Active Sourcing</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Fulfilled">Fulfilled</option>
                      <option value="Closed">Closed</option>
                    </select>
                  </div>

                  <div className="tw-form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="tw-label">Mandate Scope & Instructions</label>
                    <textarea
                      className="tw-textarea"
                      rows="3"
                      placeholder="Detailed project scope, team background, compliance needs, or special hiring constraints..."
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="tw-modal-footer">
                <button
                  type="button"
                  className="tw-btn-secondary"
                  onClick={() => setCreateModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="tw-btn-primary"
                  style={{ background: '#7C3AED', borderColor: '#6D28D9' }}
                >
                  {editingReq ? 'Update Mandate' : 'Save Requisition'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Candidate Matching Modal */}
      {matchModalRequisition && (
        <div className="tw-modal-overlay">
          <div className="tw-modal" style={{ maxWidth: '820px' }}>
            <div className="tw-modal-header">
              <div>
                <h2
                  className="tw-modal-title"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <SparklesIcon size={18} color="#7C3AED" />
                  <span>AI Bench Talent Matching & Shortlist Dossier</span>
                </h2>
                <div className="tw-modal-subtitle">
                  Benchmarking registered candidate pool against{' '}
                  <strong>{matchModalRequisition.title}</strong> for{' '}
                  <strong>{matchModalRequisition.client}</strong>.
                </div>
              </div>
              <button
                className="tw-modal-close-btn"
                onClick={() => setMatchModalRequisition(null)}
              >
                <CloseIcon size={16} />
              </button>
            </div>

            <div className="tw-modal-body">
              {/* Mandate Stack Summary */}
              <div
                style={{
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  padding: '0.85rem 1rem',
                  marginBottom: '1.25rem',
                }}
              >
                <div
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: '#334155',
                    marginBottom: '0.35rem',
                  }}
                >
                  Target Technologies & Mandate Terms:
                </div>
                <div
                  style={{
                    display: 'flex',
                    gap: '0.35rem',
                    flexWrap: 'wrap',
                    marginBottom: '0.5rem',
                  }}
                >
                  {(matchModalRequisition.requiredSkills || []).map(
                    (sk, idx) => (
                      <span
                        key={idx}
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          backgroundColor: '#EDE9FE',
                          color: '#6D28D9',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                        }}
                      >
                        {sk}
                      </span>
                    )
                  )}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                  {matchModalRequisition.description}
                </div>
              </div>

              {/* Matched Candidate Dossiers */}
              <div
                style={{
                  marginBottom: '0.75rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <h4
                  style={{
                    margin: 0,
                    fontSize: '0.9rem',
                    color: '#0F172A',
                    fontWeight: 700,
                  }}
                >
                  Curated Candidate Dossiers (AI Match Scored)
                </h4>
                <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                  Ranked by technical proficiency & availability
                </span>
              </div>

              {/* Match Candidate Cards */}
              {(() => {
                const reqSkills = (
                  matchModalRequisition.requiredSkills || []
                ).map((s) => s.toLowerCase());

                const scored = (candidates || []).map((c) => {
                  const candSkills = (c.technicalSkills || []).map((s) =>
                    s.toLowerCase()
                  );
                  const matches = candSkills.filter((sk) =>
                    reqSkills.some(
                      (reqSk) => reqSk.includes(sk) || sk.includes(reqSk)
                    )
                  );
                  const matchRatio =
                    reqSkills.length > 0
                      ? matches.length / reqSkills.length
                      : 0.5;
                  const calculatedFit = Math.min(
                    98,
                    Math.max(72, Math.round(matchRatio * 100) + 15)
                  );

                  return {
                    ...c,
                    matchedSkillsCount: matches.length,
                    calculatedScore: c.fitScore || calculatedFit,
                    matchBadge:
                      calculatedFit >= 90
                        ? 'Top Match'
                        : calculatedFit >= 80
                          ? 'Strong Fit'
                          : 'Qualified',
                  };
                });

                scored.sort((a, b) => b.calculatedScore - a.calculatedScore);
                const topMatches = scored.slice(0, 5);

                if (topMatches.length === 0) {
                  return (
                    <div
                      style={{
                        textAlign: 'center',
                        padding: '2rem',
                        color: '#64748B',
                      }}
                    >
                      No candidate profiles found in the talent pool matching this
                      requisition.
                    </div>
                  );
                }

                return topMatches.map((cand) => (
                  <div
                    key={cand.id || cand._id}
                    className="tw-candidate-match-card"
                  >
                    <div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          marginBottom: '0.2rem',
                        }}
                      >
                        <span
                          style={{
                            fontWeight: 700,
                            fontSize: '0.9rem',
                            color: '#0F172A',
                          }}
                        >
                          {cand.name}
                        </span>
                        <span className="tw-fit-badge-high" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '0.85rem' }}>bolt</span>
                          <span>{cand.calculatedScore}% {cand.matchBadge}</span>
                        </span>
                        <span
                          style={{
                            fontSize: '0.7rem',
                            padding: '0.15rem 0.45rem',
                            borderRadius: '4px',
                            backgroundColor: '#E2E8F0',
                            color: '#334155',
                          }}
                        >
                          {cand.status || 'Screening'}
                        </span>
                      </div>

                      <div
                        style={{
                          fontSize: '0.75rem',
                          color: '#64748B',
                          marginBottom: '0.35rem',
                        }}
                      >
                        {cand.currentRole ||
                          cand.jobTitle ||
                          'Senior Software Engineer'}{' '}
                        • {cand.experience || 5} yrs exp •{' '}
                        {cand.location || 'Remote'}
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          gap: '0.25rem',
                          flexWrap: 'wrap',
                        }}
                      >
                        {(cand.technicalSkills || [])
                          .slice(0, 5)
                          .map((sk, idx) => {
                            const isMatch = reqSkills.some((reqSk) =>
                              reqSk.includes(sk.toLowerCase())
                            );
                            return (
                              <span
                                key={idx}
                                style={{
                                  fontSize: '0.68rem',
                                  padding: '0.12rem 0.4rem',
                                  borderRadius: '4px',
                                  backgroundColor: isMatch
                                    ? '#DCFCE7'
                                    : '#F1F5F9',
                                  color: isMatch ? '#166534' : '#475569',
                                  fontWeight: isMatch ? 700 : 500,
                                }}
                              >
                                {sk}
                              </span>
                            );
                          })}
                      </div>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.35rem',
                        alignItems: 'flex-end',
                      }}
                    >
                      <Link
                        to="/admin/placements"
                        className="tw-btn-primary"
                        style={{
                          padding: '0.32rem 0.75rem',
                          fontSize: '0.75rem',
                          textDecoration: 'none',
                          whiteSpace: 'nowrap',
                          background: '#008F68',
                        }}
                      >
                        Deploy to Placement →
                      </Link>
                      <button
                        className="tw-btn-secondary"
                        onClick={() => {
                          showToast(
                            `Candidate dossier for ${cand.name} queued for dispatch to ${matchModalRequisition.contactEmail || matchModalRequisition.client}.`
                          );
                        }}
                        style={{
                          padding: '0.25rem 0.65rem',
                          fontSize: '0.72rem',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        Dispatch Dossier
                      </button>
                    </div>
                  </div>
                ));
              })()}
            </div>

            <div className="tw-modal-footer">
              <button
                className="tw-btn-secondary"
                onClick={() => setMatchModalRequisition(null)}
              >
                Close Requisition Review
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequisitionsView;
