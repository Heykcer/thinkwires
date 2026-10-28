import React, { useState, useEffect } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { adminApi } from './adminService';
import {
  UsersIcon,
  HandshakeIcon,
  BuildingIcon,
  BriefcaseIcon,
  DollarIcon,
  TargetIcon,
  DashboardIcon,
  TrophyIcon,
  PlusIcon,
  EditIcon,
  BellIcon,
  RefreshIcon,
  CloseIcon,
} from './AdminIcons';

const AdminDashboard = () => {
  const { showToast } = useOutletContext();
  const [period, setPeriod] = useState('month');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [matchModalRequisition, setMatchModalRequisition] = useState(null);
  const [allCandidates, setAllCandidates] = useState([]);

  const fetchStats = (selectedPeriod) => {
    setLoading(true);
    adminApi
      .getDashboardStats(selectedPeriod)
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load stats:', err);
        setLoading(false);
        showToast(`Error: ${err.message}`);
      });
  };

  useEffect(() => {
    fetchStats(period);
  }, [period]);

  useEffect(() => {
    adminApi
      .getCandidates()
      .then((res) => setAllCandidates(res.candidates || []))
      .catch((err) => console.warn('Could not load candidates for requisition matching:', err));
  }, []);

  const handleApproveRequisition = (req) => {
    adminApi
      .updateJob(req.id || req._id, { status: 'Open' })
      .then(() => {
        showToast(`Requisition "${req.title}" converted to Active Opening.`);
        fetchStats(period);
      })
      .catch((err) => showToast(`Failed to update requisition: ${err.message}`));
  };

  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
    showToast(`Metrics filtered by ${newPeriod.toUpperCase()}`);
  };

  if (loading && !data) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>
        <strong>Loading operational dashboard...</strong>
      </div>
    );
  }

  const kpis = data?.kpis || {};
  const charts = data?.charts || {};
  const recentPlacements = data?.recentPlacements || [];
  const recentActivity = data?.recentActivity || [];
  const inboundRequisitions = data?.inboundRequisitions || [];

  return (
    <div>
      {/* Demo Notice Banner */}
      <div className="tw-demo-notice-banner">
        <div className="tw-demo-notice-content">
          <span className="tw-demo-pill">DEMO ENVIRONMENT</span>
          <span>
            {data?.demoNotice ||
              'Active DEMO dataset with dual-mode MongoDB persistence and simulated enterprise metrics.'}
          </span>
        </div>
        <div style={{ fontSize: '0.75rem', color: '#166534', fontWeight: 600 }}>
          Storage: {data?.databaseMode || 'Dual-Mode Store'}
        </div>
      </div>

      {/* View Header with Title and Period Switcher */}
      <div className="tw-view-header">
        <div className="tw-view-title-group">
          <h1>Staffing & Manpower Operations</h1>
          <p className="tw-view-subtitle">
            Executive control panel for engineering deployments, client
            accounts, recruitment pipeline, and CMS.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div className="tw-period-filter-group">
            <button
              className={`tw-period-btn ${period === 'month' ? 'active' : ''}`}
              onClick={() => handlePeriodChange('month')}
            >
              Month
            </button>
            <button
              className={`tw-period-btn ${period === 'quarter' ? 'active' : ''}`}
              onClick={() => handlePeriodChange('quarter')}
            >
              Quarter
            </button>
            <button
              className={`tw-period-btn ${period === 'year' ? 'active' : ''}`}
              onClick={() => handlePeriodChange('year')}
            >
              Year
            </button>
          </div>

          <button
            className="tw-btn-secondary"
            onClick={() => fetchStats(period)}
            title="Refresh metrics"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <RefreshIcon size={14} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* 8 Primary KPI Cards */}
      <div className="tw-kpi-grid">
        {/* 1. Total Employees */}
        <div className="tw-kpi-card">
          <div className="tw-kpi-header">
            <span className="tw-kpi-title">Total Talent Pool</span>
            <div className="tw-kpi-icon-box emerald">
              <UsersIcon size={18} color="#008F68" />
            </div>
          </div>
          <div className="tw-kpi-value">{kpis.totalEmployees || 10}</div>
          <div className="tw-kpi-footer">
            <span className="tw-trend-badge positive">+14%</span>
            <span>Pre-vetted engineers</span>
          </div>
        </div>

        {/* 2. Active Placements */}
        <div className="tw-kpi-card">
          <div className="tw-kpi-header">
            <span className="tw-kpi-title">Active Deployments</span>
            <div className="tw-kpi-icon-box emerald">
              <HandshakeIcon size={18} color="#008F68" />
            </div>
          </div>
          <div className="tw-kpi-value">{kpis.activePlacements || 4}</div>
          <div className="tw-kpi-footer">
            <span className="tw-trend-badge positive">100% On-Track</span>
            <span>Billable client contracts</span>
          </div>
        </div>

        {/* 3. Total Clients */}
        <div className="tw-kpi-card">
          <div className="tw-kpi-header">
            <span className="tw-kpi-title">Corporate Clients</span>
            <div className="tw-kpi-icon-box blue">
              <BuildingIcon size={18} color="#2563EB" />
            </div>
          </div>
          <div className="tw-kpi-value">{kpis.totalClients || 5}</div>
          <div className="tw-kpi-footer">
            <span className="tw-trend-badge positive">+2</span>
            <span>FinTech & HealthTech hubs</span>
          </div>
        </div>

        {/* 4. Open & Inbound Requirements */}
        <div className="tw-kpi-card">
          <div className="tw-kpi-header">
            <span className="tw-kpi-title">Candidate Requisitions</span>
            <div className="tw-kpi-icon-box amber">
              <BriefcaseIcon size={18} color="#D97706" />
            </div>
          </div>
          <div className="tw-kpi-value" style={{ display: 'flex', alignItems: 'baseline', gap: '0.45rem' }}>
            <span>{kpis.openRequirements || 6}</span>
            <span
              style={{
                fontSize: '0.78rem',
                fontWeight: 700,
                color: '#6D28D9',
                background: '#EDE9FE',
                padding: '0.15rem 0.45rem',
                borderRadius: '4px',
              }}
            >
              +{kpis.inboundRequisitionsCount || inboundRequisitions.length || 2} Inbound
            </span>
          </div>
          <div className="tw-kpi-footer">
            <span className="tw-trend-badge negative" style={{ backgroundColor: '#FEE2E2', color: '#B91C1C' }}>
              5h SLA
            </span>
            <span>{kpis.pendingRequisitionsSla || inboundRequisitions.length || 2} Client Mandates Active</span>
          </div>
        </div>

        {/* 5. Period Revenue */}
        <div className="tw-kpi-card">
          <div className="tw-kpi-header">
            <span className="tw-kpi-title">
              Billing Revenue ({period.toUpperCase()})
            </span>
            <div className="tw-kpi-icon-box emerald">
              <DollarIcon size={18} color="#008F68" />
            </div>
          </div>
          <div className="tw-kpi-value">
            ${(kpis.totalRevenue || 36200).toLocaleString()}
          </div>
          <div className="tw-kpi-footer">
            <span className="tw-trend-badge positive">+18.5%</span>
            <span>Margin: ${(kpis.grossMargin || 11584).toLocaleString()}</span>
          </div>
        </div>

        {/* 6. Candidate Pipeline */}
        <div className="tw-kpi-card">
          <div className="tw-kpi-header">
            <span className="tw-kpi-title">Candidate Pipeline</span>
            <div className="tw-kpi-icon-box violet">
              <TargetIcon size={18} color="#7C3AED" />
            </div>
          </div>
          <div className="tw-kpi-value">{kpis.candidatePipelineCount || 8}</div>
          <div className="tw-kpi-footer">
            <span className="tw-trend-badge positive">Active ATS</span>
            <span>Across 6 pipeline stages</span>
          </div>
        </div>

        {/* 7. Recruitment Performance */}
        <div className="tw-kpi-card">
          <div className="tw-kpi-header">
            <span className="tw-kpi-title">Recruitment SLA</span>
            <div className="tw-kpi-icon-box blue">
              <DashboardIcon size={18} color="#2563EB" />
            </div>
          </div>
          <div className="tw-kpi-value">
            {kpis.recruitmentPerformance || 94.6}%
          </div>
          <div className="tw-kpi-footer">
            <span className="tw-trend-badge positive">High Velocity</span>
            <span>Curated profiles in 5h</span>
          </div>
        </div>

        {/* 8. Fulfillment Rate */}
        <div className="tw-kpi-card">
          <div className="tw-kpi-header">
            <span className="tw-kpi-title">Fulfillment Ratio</span>
            <div className="tw-kpi-icon-box emerald">
              <TrophyIcon size={18} color="#008F68" />
            </div>
          </div>
          <div className="tw-kpi-value">{kpis.fulfillmentRate || 88.2}%</div>
          <div className="tw-kpi-footer">
            <span className="tw-trend-badge positive">SLA Compliant</span>
            <span>Zero compliance friction</span>
          </div>
        </div>
      </div>

      {/* Main Charts Section */}
      <div className="tw-charts-grid">
        {/* Chart 1: Revenue vs Costs */}
        <div className="tw-chart-card">
          <div className="tw-card-header">
            <div>
              <h2 className="tw-card-title">
                Billing Revenue vs Operational Costs
              </h2>
              <div className="tw-card-subtitle">
                Financial performance breakdown for{' '}
                {period === 'month'
                  ? 'the current month'
                  : period === 'quarter'
                    ? 'Q3-Q4 quarters'
                    : 'the current fiscal year'}
              </div>
            </div>
            <span className="tw-badge deployed">Gross Margin ~32%</span>
          </div>

          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.revenueVsCosts || []}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#008F68" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#008F68" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3478D4" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3478D4" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="name" stroke="#64748B" fontSize={12} />
                <YAxis
                  stroke="#64748B"
                  fontSize={12}
                  tickFormatter={(v) => `$${v / 1000}k`}
                />
                <Tooltip
                  formatter={(value) => [`$${value.toLocaleString()}`, '']}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  name="Gross Revenue ($)"
                  stroke="#008F68"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorRev)"
                />
                <Area
                  type="monotone"
                  dataKey="costs"
                  name="Direct Costs ($)"
                  stroke="#3478D4"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorCost)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Actual Placements vs Targets */}
        <div className="tw-chart-card">
          <div className="tw-card-header">
            <div>
              <h2 className="tw-card-title">Placements vs Targets</h2>
              <div className="tw-card-subtitle">Quarterly delivery targets</div>
            </div>
          </div>

          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.placementsVsTargets || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="name" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={12} />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="actual"
                  name="Actual Hired"
                  fill="#008F68"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="target"
                  name="Target Quota"
                  fill="#94A3B8"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Chart 3 & Quick Actions */}
      <div
        className="tw-charts-grid"
        style={{ gridTemplateColumns: '1.2fr 1.8fr' }}
      >
        {/* Quick Actions Panel */}
        <div className="tw-chart-card">
          <div className="tw-card-header">
            <div>
              <h2 className="tw-card-title">Quick Actions</h2>
              <div className="tw-card-subtitle">
                Frequent administrative operations
              </div>
            </div>
          </div>

          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
          >
            <Link
              to="/admin/employees"
              className="tw-btn-primary"
              style={{
                justifyContent: 'center',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
              }}
            >
              <PlusIcon size={15} />
              <span>Onboard New Employee</span>
            </Link>
            <Link
              to="/admin/jobs"
              className="tw-btn-secondary"
              style={{
                justifyContent: 'center',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
              }}
            >
              <BriefcaseIcon size={15} />
              <span>Post Staffing Requirement</span>
            </Link>
            <Link
              to="/admin/candidates"
              className="tw-btn-secondary"
              style={{
                justifyContent: 'center',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
              }}
            >
              <TargetIcon size={15} />
              <span>Review Candidate Pipeline</span>
            </Link>
            <Link
              to="/admin/cms/blog"
              className="tw-btn-secondary"
              style={{
                justifyContent: 'center',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
              }}
            >
              <EditIcon size={15} />
              <span>Draft New CMS Article</span>
            </Link>
            <Link
              to="/admin/cms/announcements"
              className="tw-btn-secondary"
              style={{
                justifyContent: 'center',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
              }}
            >
              <BellIcon size={15} />
              <span>Broadcast Announcement</span>
            </Link>
          </div>

          <div
            style={{
              marginTop: '1.25rem',
              padding: '0.85rem',
              backgroundColor: '#F8FAFC',
              borderRadius: '8px',
              fontSize: '0.78rem',
              border: '1px solid #E2E8F0',
            }}
          >
            <strong>Role Permissions:</strong>
            <div
              style={{
                marginTop: '0.25rem',
                color: '#64748B',
                lineHeight: '1.4',
              }}
            >
              Access is determined strictly by your authenticated account.
              Member credentials and RBAC roles are provisioned exclusively by
              the Superadmin.
            </div>
          </div>
        </div>

        {/* Chart 3: Recruitment Performance Trends */}
        <div className="tw-chart-card">
          <div className="tw-card-header">
            <div>
              <h2 className="tw-card-title">
                Recruitment Performance & SLA Trends
              </h2>
              <div className="tw-card-subtitle">
                Speed of delivery vs client satisfaction index
              </div>
            </div>
            <span className="tw-badge available">Top 1% Efficiency</span>
          </div>

          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={charts.performanceTrends || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="name" stroke="#64748B" fontSize={12} />
                <YAxis stroke="#64748B" fontSize={12} domain={[70, 100]} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="velocity"
                  name="Sourcing Velocity (%)"
                  stroke="#3478D4"
                  strokeWidth={2.5}
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="satisfaction"
                  name="Client Satisfaction (%)"
                  stroke="#008F68"
                  strokeWidth={2.5}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Enterprise Candidate Requisition Inbound Desk */}
      <div className="tw-table-container" style={{ marginBottom: '1.75rem' }} id="inbound-requisitions-desk">
        <div className="tw-table-toolbar" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <h2 className="tw-card-title" style={{ margin: 0 }}>
                Enterprise Candidate Requisition Desk
              </h2>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  backgroundColor: '#7C3AED',
                  color: '#ffffff',
                  padding: '0.15rem 0.55rem',
                  borderRadius: '9999px',
                  letterSpacing: '0.04em',
                }}
              >
                {inboundRequisitions.length} INBOUND ORDERS
              </span>
              <span className="tw-sla-pill urgent">5-Hour SLA</span>
            </div>
            <div className="tw-card-subtitle" style={{ marginTop: '0.25rem' }}>
              Client requisitions dispatched through Find Talent portal. Evaluate talent dossiers and match candidates against required stack.
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto' }}>
            <Link
              to="/admin/requisitions"
              className="tw-btn-secondary"
              style={{ padding: '0.4rem 0.85rem', fontSize: '0.78rem' }}
            >
              View All Requisitions Desk →
            </Link>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="tw-table">
            <thead>
              <tr>
                <th style={{ minWidth: '220px' }}>Role Requisition & Seniority</th>
                <th style={{ minWidth: '180px' }}>Enterprise Client & Contact</th>
                <th style={{ minWidth: '150px' }}>Required Tech Stack</th>
                <th style={{ minWidth: '90px' }}>Headcount</th>
                <th style={{ minWidth: '130px' }}>Urgency & SLA</th>
                <th style={{ minWidth: '130px' }}>Budget Envelope</th>
                <th style={{ minWidth: '110px' }}>Status</th>
                <th style={{ textAlign: 'right', minWidth: '170px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {inboundRequisitions.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: '#64748B' }}>
                    No inbound client requisitions currently pending. New requests submitted via /find-talent will appear here in real-time.
                  </td>
                </tr>
              ) : (
                inboundRequisitions.map((req) => {
                  const reqSkills = Array.isArray(req.requiredSkills) && req.requiredSkills.length > 0
                    ? req.requiredSkills
                    : Array.isArray(req.skills)
                      ? req.skills
                      : [];
                  const isPending = req.status === 'Inbound Request' || req.status === 'Inbound Requisition';

                  return (
                    <tr key={req.id || req._id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#7C3AED' }}>
                            {req.jobId || req.id}
                          </span>
                          <span
                            style={{
                              fontSize: '0.65rem',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              padding: '0.1rem 0.4rem',
                              borderRadius: '4px',
                              backgroundColor: '#F3E8FF',
                              color: '#6B21A8',
                            }}
                          >
                            {req.seniority || 'Senior'}
                          </span>
                        </div>
                        <div style={{ fontWeight: 600, color: '#1E293B' }}>{req.title}</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '0.15rem' }}>
                          Model: {req.engagementModel || 'Staff Augmentation'}
                        </div>
                      </td>

                      <td>
                        <div style={{ fontWeight: 600, color: '#0F172A' }}>{req.client || 'Enterprise Partner'}</div>
                        <div style={{ fontSize: '0.75rem', color: '#475569' }}>
                          {req.contactPerson || 'Hiring Lead'}
                        </div>
                        {req.contactEmail && (
                          <div style={{ fontSize: '0.7rem', color: '#64748B' }}>
                            <a href={`mailto:${req.contactEmail}`} style={{ color: '#2563EB', textDecoration: 'none' }}>
                              {req.contactEmail}
                            </a>
                          </div>
                        )}
                      </td>

                      <td>
                        <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap', maxWidth: '240px' }}>
                          {reqSkills.slice(0, 4).map((sk, idx) => (
                            <span
                              key={idx}
                              style={{
                                fontSize: '0.7rem',
                                padding: '0.15rem 0.4rem',
                                borderRadius: '4px',
                                backgroundColor: '#F1F5F9',
                                color: '#334155',
                                fontWeight: 500,
                              }}
                            >
                              {sk}
                            </span>
                          ))}
                          {reqSkills.length > 4 && (
                            <span style={{ fontSize: '0.68rem', color: '#64748B' }}>
                              +{reqSkills.length - 4} more
                            </span>
                          )}
                        </div>
                      </td>

                      <td>
                        <strong>{req.openingsCount || req.headcount || 1}</strong>
                        <div style={{ fontSize: '0.7rem', color: '#64748B' }}>engineers</div>
                      </td>

                      <td>
                        <div style={{ marginBottom: '0.25rem' }}>
                          <span
                            className={`tw-sla-pill ${
                              req.priority === 'Urgent' || req.deploymentUrgency === 'immediate'
                                ? 'urgent'
                                : 'high'
                            }`}
                          >
                            {req.priority || 'Urgent'}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.68rem', color: '#DC2626', fontWeight: 600 }}>
                          ⏱️ 5h Response SLA
                        </div>
                      </td>

                      <td>
                        <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#008F68' }}>
                          {req.budget || '$8,000 - $12,000 / mo'}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#64748B' }}>
                          {req.workMode || 'Remote'}
                        </div>
                      </td>

                      <td>
                        <span
                          className={`tw-badge ${
                            isPending
                              ? 'inbound-request'
                              : String(req.status || 'open').toLowerCase().replace(/\s+/g, '-')
                          }`}
                        >
                          {req.status || 'Inbound Request'}
                        </span>
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                          <button
                            className="tw-btn-secondary"
                            onClick={() => setMatchModalRequisition(req)}
                            title="Find matching candidates from talent pool"
                            style={{
                              padding: '0.28rem 0.65rem',
                              fontSize: '0.75rem',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              borderColor: '#7C3AED',
                              color: '#6D28D9',
                            }}
                          >
                            <TargetIcon size={12} color="#6D28D9" />
                            <span>Match Talent</span>
                          </button>

                          {isPending && (
                            <button
                              className="tw-btn-primary"
                              onClick={() => handleApproveRequisition(req)}
                              title="Approve and open for general recruiting"
                              style={{
                                padding: '0.28rem 0.65rem',
                                fontSize: '0.75rem',
                                background: '#008F68',
                              }}
                            >
                              Approve
                            </button>
                          )}
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

      {/* Two Column Bottom Section: Active Placements & Activity Stream */}
      <div className="tw-bottom-grid">
        {/* Active Placements Table */}
        <div className="tw-table-container">
          <div className="tw-table-toolbar">
            <h2 className="tw-card-title">Recent Billable Placements</h2>
            <Link
              to="/admin/placements"
              className="tw-btn-secondary"
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
            >
              View All Deployments →
            </Link>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="tw-table">
              <thead>
                <tr>
                  <th>Talent Name</th>
                  <th>Client</th>
                  <th>Role</th>
                  <th>Rate</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentPlacements.map((plc) => (
                  <tr key={plc.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>
                        {plc.candidateOrEmployeeName}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
                        {plc.personType}
                      </div>
                    </td>
                    <td>{plc.clientName}</td>
                    <td>{plc.jobTitle}</td>
                    <td>
                      <strong>
                        ${Number(plc.billingRate).toLocaleString()}
                      </strong>
                      <span style={{ fontSize: '0.7rem', color: '#64748B' }}>
                        /mo
                      </span>
                    </td>
                    <td>
                      <span
                        className={`tw-badge ${plc.assignmentStatus.toLowerCase()}`}
                      >
                        {plc.assignmentStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Business Activity */}
        <div className="tw-chart-card">
          <div className="tw-card-header">
            <div>
              <h2 className="tw-card-title">Operational Audit Log</h2>
              <div className="tw-card-subtitle">
                Live system activity stream
              </div>
            </div>
          </div>

          <div className="tw-activity-list">
            {recentActivity.map((act) => (
              <div key={act.id || act._id} className="tw-activity-item">
                <span
                  className="tw-activity-bullet"
                  style={{ backgroundColor: act.badgeColor || '#008F68' }}
                ></span>
                <div className="tw-activity-content">
                  <div className="tw-activity-title">{act.action}</div>
                  <div className="tw-activity-desc">{act.description}</div>
                  <div className="tw-activity-time">
                    {act.user?.name} ({act.user?.role}) •{' '}
                    {new Date(act.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Requisition Candidate Matching & Dispatch Modal */}
      {matchModalRequisition && (
        <div className="tw-modal-overlay" style={{ zIndex: 1200 }}>
          <div className="tw-modal" style={{ maxWidth: '820px' }}>
            <div className="tw-modal-header">
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#7C3AED', textTransform: 'uppercase' }}>
                  Enterprise Requisition Talent Matching • {matchModalRequisition.jobId || matchModalRequisition.id}
                </div>
                <h3 className="tw-modal-title" style={{ marginTop: '0.2rem' }}>
                  {matchModalRequisition.title}
                </h3>
                <div style={{ fontSize: '0.8rem', color: '#64748B' }}>
                  Client: <strong>{matchModalRequisition.client}</strong> • Contact:{' '}
                  {matchModalRequisition.contactPerson} ({matchModalRequisition.contactEmail || 'N/A'}) • Headcount:{' '}
                  {matchModalRequisition.openingsCount || 1}
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
              {/* Mandate Requirements Summary */}
              <div
                style={{
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  padding: '0.85rem 1rem',
                  marginBottom: '1.25rem',
                }}
              >
                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Mandate Stack & SLA Terms:
                </div>
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                  {(matchModalRequisition.requiredSkills || []).map((sk, idx) => (
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
                  ))}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                  {matchModalRequisition.description}
                </div>
              </div>

              {/* Matched Candidate Dossiers */}
              <div style={{ marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#0F172A', fontWeight: 700 }}>
                  Curated Candidate Dossiers (AI Match Scored)
                </h4>
                <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                  Ranked by technical proficiency & availability
                </span>
              </div>

              {/* Match candidate list */}
              {(() => {
                const reqSkills = (matchModalRequisition.requiredSkills || []).map((s) => s.toLowerCase());

                const scored = (allCandidates || []).map((c) => {
                  const candSkills = (c.technicalSkills || []).map((s) => s.toLowerCase());
                  const matches = candSkills.filter((sk) =>
                    reqSkills.some((reqSk) => reqSk.includes(sk) || sk.includes(reqSk))
                  );
                  const matchRatio = reqSkills.length > 0 ? matches.length / reqSkills.length : 0.5;
                  const calculatedFit = Math.min(98, Math.max(72, Math.round(matchRatio * 100) + 15));

                  return {
                    ...c,
                    matchedSkillsCount: matches.length,
                    calculatedScore: c.fitScore || calculatedFit,
                    matchBadge: calculatedFit >= 90 ? 'Top Match' : calculatedFit >= 80 ? 'Strong Fit' : 'Qualified',
                  };
                });

                scored.sort((a, b) => b.calculatedScore - a.calculatedScore);
                const topMatches = scored.slice(0, 4);

                if (topMatches.length === 0) {
                  return (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#64748B' }}>
                      No candidate profiles found in the talent pool matching this requisition.
                    </div>
                  );
                }

                return topMatches.map((cand) => (
                  <div key={cand.id || cand._id} className="tw-candidate-match-card">
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0F172A' }}>
                          {cand.name}
                        </span>
                        <span className="tw-fit-badge-high" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '0.85rem' }}>
                            bolt
                          </span>
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

                      <div style={{ fontSize: '0.75rem', color: '#64748B', marginBottom: '0.35rem' }}>
                        {cand.currentRole || cand.jobTitle || 'Senior Software Engineer'} • {cand.experience || 5} yrs exp • {cand.location || 'Remote'}
                      </div>

                      <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                        {(cand.technicalSkills || []).slice(0, 5).map((sk, idx) => {
                          const isMatch = reqSkills.some((reqSk) => reqSk.includes(sk.toLowerCase()));
                          return (
                            <span
                              key={idx}
                              style={{
                                fontSize: '0.68rem',
                                padding: '0.12rem 0.4rem',
                                borderRadius: '4px',
                                backgroundColor: isMatch ? '#DCFCE7' : '#F1F5F9',
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

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', alignItems: 'flex-end' }}>
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
                          showToast(`Candidate dossier for ${cand.name} queued for dispatch to ${matchModalRequisition.contactEmail || matchModalRequisition.client}.`);
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

export default AdminDashboard;
