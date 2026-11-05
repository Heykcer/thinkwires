import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import logo from '../assets/logo/logo.png';
import {
  adminApi,
  getAdminRole,
  getAdminUser,
  clearAdminSession,
} from './adminService';
import {
  DashboardIcon,
  UsersIcon,
  TargetIcon,
  BuildingIcon,
  BriefcaseIcon,
  HandshakeIcon,
  MonitorIcon,
  FileTextIcon,
  EditIcon,
  ImageIcon,
  SearchIcon,
  BellIcon,
  ShieldIcon,
  MenuIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ExternalLinkIcon,
  LogoutIcon,
  CheckIcon,
  BookOpenIcon,
} from './AdminIcons';
import './admin.css';

const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [currentUser, setCurrentUser] = useState(getAdminUser());
  const [activeRole, setActiveRole] = useState(getAdminRole() || 'admin');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [readAnnouncementIds, setReadAnnouncementIds] = useState(() => {
    try {
      const stored = localStorage.getItem('tw_admin_read_announcements');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [dbStatus, setDbStatus] = useState('In-Memory Resilient Demo');
  const [isMongo, setIsMongo] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [pendingRequisitionsCount, setPendingRequisitionsCount] =
    useState(null);

  const markAllAnnouncementsAsRead = () => {
    const allIds = announcements.map(
      (a, idx) => a.id || a._id || `ann_${idx}_${a.title}`
    );
    setReadAnnouncementIds(allIds);
    try {
      localStorage.setItem(
        'tw_admin_read_announcements',
        JSON.stringify(allIds)
      );
    } catch (e) {
      console.warn('Could not save read announcements state:', e);
    }
    showToast('All announcements marked as read');
  };

  const markAnnouncementAsRead = (id) => {
    setReadAnnouncementIds((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      try {
        localStorage.setItem(
          'tw_admin_read_announcements',
          JSON.stringify(next)
        );
      } catch (e) {
        console.warn('Could not save read announcements state:', e);
      }
      return next;
    });
  };

  // Authentication check on mount via server-side HttpOnly cookie session verification
  useEffect(() => {
    let isMounted = true;

    adminApi
      .getMe()
      .then((data) => {
        if (!isMounted) return;
        if (data && data.user) {
          setCurrentUser(data.user);
          setActiveRole((data.user.role || 'admin').toLowerCase());
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.warn('Admin session validation failed:', err.message);
        clearAdminSession();
        setCurrentUser(null);
        navigate('/admin/login', {
          replace: true,
          state: { from: location.pathname },
        });
      })
      .finally(() => {
        if (isMounted) {
          setAuthChecking(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [navigate, location.pathname]);

  // Load announcements & db status for notifications based on active role
  useEffect(() => {
    if (authChecking || !currentUser) return;
    const fetchMeta =
      activeRole === 'cms_admin'
        ? adminApi.getCmsStats()
        : adminApi.getDashboardStats();
    fetchMeta
      .then((data) => {
        if (data && data.announcements) setAnnouncements(data.announcements);
        if (data && data.databaseMode) setDbStatus(data.databaseMode);
        if (data && data.isMongoActive !== undefined)
          setIsMongo(data.isMongoActive);
        if (data && data.kpis && data.kpis.pendingRequisitionsSla !== undefined) {
          setPendingRequisitionsCount(data.kpis.pendingRequisitionsSla);
        } else if (data && data.kpis && data.kpis.inboundRequisitionsCount !== undefined) {
          setPendingRequisitionsCount(data.kpis.inboundRequisitionsCount);
        } else if (data && data.inboundRequisitions) {
          const pending = data.inboundRequisitions.filter(
            (r) => r.status === 'Inbound Request' || r.status === 'Inbound Requisition'
          ).length;
          setPendingRequisitionsCount(pending > 0 ? pending : data.inboundRequisitions.length);
        }
      })
      .catch((err) =>
        console.warn('Could not fetch topbar stats:', err.message)
      );
  }, [activeRole, authChecking, currentUser]);

  const handleLogout = async () => {
    try {
      await adminApi.logout();
    } catch (err) {
      console.warn('Logout notice:', err.message);
    } finally {
      clearAdminSession();
    }
    showToast('Signed out of admin portal');
    navigate('/admin/login', { replace: true, state: { loggedOut: true } });
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const isNavActive = (path) => {
    if (path === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(path);
  };

  // RBAC Permission checks:
  // - SuperAdmin: Complete control (Overview, Manpower & Recruitment, and CMS)
  // - cms_admin: ONLY control to CMS
  // - Admin: ONLY control to Manpower and Recruitment
  const isSuperAdmin = activeRole === 'superadmin';
  const isCmsAdmin = activeRole === 'cms_admin';
  const isAdmin = activeRole === 'admin';

  // Route categorization
  const isCmsRoute = location.pathname.startsWith('/admin/cms');
  const isSystemMembersRoute = location.pathname.startsWith(
    '/admin/system-members'
  );
  const isManpowerRoute = !isCmsRoute && !isSystemMembersRoute;

  // Restriction checks:
  // - cms_admin is strictly blocked from Manpower, Overview, and System Members routes
  // - admin is strictly blocked from CMS and System Members routes
  // - only superadmin can access system members
  const isCmsAdminBlocked =
    isCmsAdmin && (isManpowerRoute || isSystemMembersRoute);
  const isAdminCmsBlocked = isAdmin && isCmsRoute;
  const isSystemMembersBlocked = !isSuperAdmin && isSystemMembersRoute;
  const isRestrictedForCurrentRole =
    isCmsAdminBlocked || isAdminCmsBlocked || isSystemMembersBlocked;

  // Role-filtered navigation tree based on active RBAC entitlements
  const navItems = [
    ...(isSuperAdmin || isAdmin
      ? [
          {
            group: 'OVERVIEW',
            items: [
              {
                label: 'Dashboard Overview',
                path: '/admin',
                icon: <DashboardIcon size={18} />,
              },
            ],
          },
          {
            group: 'MANPOWER & RECRUITMENT',
            items: [
              {
                label: 'Requisition Requests',
                path: '/admin/requisitions',
                icon: <FileTextIcon size={18} />,
                badge:
                  pendingRequisitionsCount !== null &&
                  pendingRequisitionsCount > 0
                    ? String(pendingRequisitionsCount)
                    : null,
              },
              {
                label: 'Employees',
                path: '/admin/employees',
                icon: <UsersIcon size={18} />,
              },
              {
                label: 'Candidates & Pipeline',
                path: '/admin/candidates',
                icon: <TargetIcon size={18} />,
              },
              {
                label: 'Clients',
                path: '/admin/clients',
                icon: <BuildingIcon size={18} />,
              },
              {
                label: 'Job Requirements',
                path: '/admin/jobs',
                icon: <BriefcaseIcon size={18} />,
              },
              {
                label: 'Placements',
                path: '/admin/placements',
                icon: <HandshakeIcon size={18} />,
              },
            ],
          },
        ]
      : []),

    ...(isSuperAdmin || isCmsAdmin
      ? [
          {
            group: 'CONTENT MANAGEMENT (CMS)',
            items: [
              {
                label: 'CMS Overview',
                path: '/admin/cms',
                icon: <MonitorIcon size={18} />,
              },
              {
                label: 'Website Pages',
                path: '/admin/cms/pages',
                icon: <FileTextIcon size={18} />,
              },
              {
                label: 'Blog & Articles',
                path: '/admin/cms/blog',
                icon: <EditIcon size={18} />,
              },
              {
                label: 'Media Library',
                path: '/admin/cms/media',
                icon: <ImageIcon size={18} />,
              },
              {
                label: 'SEO Settings',
                path: '/admin/cms/seo',
                icon: <SearchIcon size={18} />,
              },
              {
                label: 'Announcements',
                path: '/admin/cms/announcements',
                icon: <BellIcon size={18} />,
              },
            ],
          },
        ]
      : []),

    ...(isSuperAdmin
      ? [
          {
            group: 'SYSTEM GOVERNANCE',
            items: [
              {
                label: 'System Members',
                path: '/admin/system-members',
                icon: <ShieldIcon size={18} />,
                badge: 'Superadmin',
              },
            ],
          },
        ]
      : []),

    {
      group: 'INTELLIGENCE & ARCHITECTURE',
      items: [
        {
          label: 'System Docs & Workflows',
          path: '/admin/docs',
          icon: <BookOpenIcon size={18} />,
          badge: 'Live',
        },
      ],
    },
  ];

  // User Profile metadata based on authenticated user
  const getUserProfile = () => {
    const name =
      currentUser?.name ||
      (activeRole === 'superadmin'
        ? 'Alexander Vance'
        : activeRole === 'cms_admin'
          ? 'Elena Rostova'
          : 'Biswarupa Swain');
    const initials = name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

    switch (activeRole) {
      case 'superadmin':
        return {
          initials,
          name,
          roleLabel: 'SUPERADMIN',
          badgeColor: 'linear-gradient(135deg, #10B981, #059669)',
          badgeText: '#FFFFFF',
          scope: 'Complete Control',
        };
      case 'cms_admin':
        return {
          initials,
          name,
          roleLabel: 'CMS ADMIN',
          badgeColor: '#6366F1',
          badgeText: '#FFFFFF',
          scope: 'CMS Control Only',
        };
      case 'admin':
      default:
        return {
          initials,
          name,
          roleLabel: 'ADMIN',
          badgeColor: '#3B82F6',
          badgeText: '#FFFFFF',
          scope: 'Manpower & Recruitment Only',
        };
    }
  };

  const currentProfile = getUserProfile();

  if (authChecking || !currentUser) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0B132B',
          color: '#FFFFFF',
          fontFamily: "'Inter', sans-serif",
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              border: '3px solid rgba(255,255,255,0.2)',
              borderTopColor: '#008F68',
              borderRadius: '50%',
              margin: '0 auto 1rem',
              animation: 'twSpin 0.8s linear infinite',
            }}
          />
          <p style={{ fontSize: '0.9rem', color: '#94A3B8' }}>
            Verifying Administrator Credentials...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="tw-admin-wrapper">
      {/* Sidebar */}
      <aside
        className={`tw-sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}
      >
        <div className="tw-sidebar-header">
          <Link
            to={isCmsAdmin ? '/admin/cms' : '/admin'}
            className="tw-brand"
            title="Thinkwires Admin"
          >
            <div className="tw-brand-logo-wrap">
              <img src={logo} alt="Thinkwires" className="tw-brand-logo-img" />
            </div>
          </Link>
          <button
            className="tw-sidebar-toggle-btn"
            onClick={() => setCollapsed(!collapsed)}
            title="Toggle Sidebar"
          >
            {collapsed ? (
              <ChevronRightIcon size={14} />
            ) : (
              <ChevronLeftIcon size={14} />
            )}
          </button>
        </div>

        {/* Navigation list */}
        {navItems.map((grp) => (
          <div key={grp.group} className="tw-nav-group">
            {!collapsed && (
              <div className="tw-nav-group-title">{grp.group}</div>
            )}
            <ul className="tw-nav-list">
              {grp.items.map((item) => (
                <li
                  key={item.path}
                  className={`tw-nav-item ${isNavActive(item.path) ? 'active' : ''}`}
                  onClick={() => setMobileOpen(false)}
                >
                  <Link to={item.path} title={item.label}>
                    <span className="tw-nav-icon">{item.icon}</span>
                    {!collapsed && <span>{item.label}</span>}
                    {!collapsed && item.badge && (
                      <span className="tw-nav-badge">{item.badge}</span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        {/* Sidebar Footer with Live Status */}
        <div className="tw-sidebar-footer">
          <div className="tw-db-status-pill" title={`Data Layer: ${dbStatus}`}>
            <span
              className={`tw-status-dot ${isMongo ? 'online' : 'demo'}`}
            ></span>
            {!collapsed && (
              <span
                style={{
                  fontSize: '0.72rem',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {isMongo ? 'MongoDB Active' : 'Dual-Mode Demo'}
              </span>
            )}
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div
        className={`tw-main-container ${collapsed ? 'sidebar-collapsed' : ''}`}
      >
        {/* Topbar */}
        <header className="tw-topbar">
          <div className="tw-topbar-left">
            <button
              className="tw-mobile-menu-btn"
              onClick={() => setMobileOpen(!mobileOpen)}
              title="Open Navigation Menu"
            >
              <MenuIcon size={18} />
            </button>
            <div className="tw-global-search">
              <span className="tw-search-icon">
                <SearchIcon size={15} color="#94A3B8" />
              </span>
              <input
                type="text"
                placeholder={
                  isCmsAdmin
                    ? 'Search website pages, articles, or media...'
                    : isAdmin
                      ? 'Search employees, requisitions, candidates, or clients...'
                      : 'Search across entire enterprise (workforce, CMS, candidates)...'
                }
              />
            </div>
          </div>

          <div className="tw-topbar-right">
            {/* Authenticated Role Indicator Badge */}
            <div
              className="tw-role-pill-indicator"
              title="Role assigned by Superadmin"
            >
              <span
                className="tw-role-pill-dot"
                style={{ backgroundColor: currentProfile.badgeColor }}
              ></span>
              <span className="tw-role-pill-label">Role:</span>
              <strong className="tw-role-pill-value">
                {currentProfile.roleLabel}
              </strong>
            </div>

            {/* Notification Bell */}
            {(() => {
              const unreadCount = announcements.filter(
                (a, idx) =>
                  !readAnnouncementIds.includes(
                    a.id || a._id || `ann_${idx}_${a.title}`
                  )
              ).length;

              return (
                <div style={{ position: 'relative' }}>
                  <button
                    className={`tw-topbar-action-btn ${notificationsOpen ? 'active' : ''}`}
                    onClick={() => setNotificationsOpen(!notificationsOpen)}
                    title="View Announcements & Notifications"
                    aria-label="View Announcements"
                  >
                    <BellIcon size={17} color="#475569" />
                    {unreadCount > 0 && (
                      <span className="tw-badge-count">{unreadCount}</span>
                    )}
                  </button>

                  {notificationsOpen && (
                    <div className="tw-notifications-dropdown">
                      <div className="tw-notifications-dropdown-header">
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.45rem',
                          }}
                        >
                          <strong>Announcements</strong>
                          <span>{unreadCount} unread</span>
                        </div>
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllAnnouncementsAsRead}
                            className="tw-mark-read-btn"
                            title="Mark all notifications as read"
                          >
                            <CheckIcon size={12} color="#008F68" />
                            <span>Mark all as read</span>
                          </button>
                        )}
                      </div>
                      {announcements.length === 0 ? (
                        <div
                          style={{
                            padding: '1.5rem',
                            textAlign: 'center',
                            color: '#94A3B8',
                            fontSize: '0.8rem',
                          }}
                        >
                          No announcements available.
                        </div>
                      ) : (
                        <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                          {announcements.map((a, idx) => {
                            const annId =
                              a.id || a._id || `ann_${idx}_${a.title}`;
                            const isRead = readAnnouncementIds.includes(annId);

                            return (
                              <div
                                key={idx}
                                className={`tw-notification-item ${isRead ? 'read' : 'unread'}`}
                              >
                                <div
                                  style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'flex-start',
                                    gap: '0.5rem',
                                  }}
                                >
                                  <div
                                    style={{
                                      fontWeight: isRead ? 500 : 700,
                                      color: isRead ? '#475569' : '#0F172A',
                                      marginBottom: '0.2rem',
                                      fontSize: '0.8rem',
                                    }}
                                  >
                                    {!isRead && (
                                      <span className="tw-notification-unread-dot" />
                                    )}
                                    {a.title}
                                  </div>
                                  {!isRead && (
                                    <button
                                      onClick={() =>
                                        markAnnouncementAsRead(annId)
                                      }
                                      className="tw-item-mark-read-btn"
                                      title="Mark as read"
                                    >
                                      Mark read
                                    </button>
                                  )}
                                </div>
                                <div
                                  style={{
                                    color: '#64748B',
                                    fontSize: '0.74rem',
                                    lineHeight: '1.38',
                                    paddingLeft: !isRead ? '12px' : '0',
                                  }}
                                >
                                  {a.message}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Public Site Link */}
            <Link
              to="/"
              className="tw-exit-link"
              title="Open Public Thinkwires Website"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span>View Site</span>
              <ExternalLinkIcon size={13} />
            </Link>

            {/* User Profile Info */}
            <div className="tw-user-profile">
              <div
                className="tw-avatar"
                style={{
                  background: currentProfile.badgeColor,
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                }}
              >
                {currentProfile.initials}
              </div>
              <div className="tw-user-info">
                <span className="tw-user-name">{currentProfile.name}</span>
                <span
                  className="tw-user-role-badge"
                  style={{
                    background: currentProfile.badgeColor,
                    color: '#FFFFFF',
                    fontWeight: 600,
                    fontSize: '0.62rem',
                    padding: '0.12rem 0.45rem',
                    borderRadius: '4px',
                    display: 'inline-block',
                    width: 'fit-content',
                  }}
                >
                  {currentProfile.roleLabel}
                </span>
              </div>
            </div>

            {/* Sign Out Button */}
            <button
              onClick={handleLogout}
              className="tw-signout-btn"
              title="Sign Out of Admin Portal"
            >
              <LogoutIcon size={14} />
              <span>Sign Out</span>
            </button>
          </div>
        </header>

        {/* Content Body with RBAC Route Guard */}
        <main className="tw-content-area">
          {isRestrictedForCurrentRole ? (
            <div
              style={{
                padding: '3.5rem 2.5rem',
                textAlign: 'center',
                maxWidth: '680px',
                margin: '3rem auto',
                backgroundColor: '#FFFFFF',
                borderRadius: '16px',
                border: '1px solid #E2E8F0',
                boxShadow: '0 12px 30px rgba(0,0,0,0.06)',
              }}
            >
              <div
                style={{
                  marginBottom: '1.25rem',
                  display: 'flex',
                  justifyContent: 'center',
                }}
              >
                <ShieldIcon
                  size={48}
                  color={
                    isSystemMembersBlocked
                      ? '#DC2626'
                      : isCmsAdminBlocked
                        ? '#4F46E5'
                        : '#2563EB'
                  }
                />
              </div>

              <div
                style={{
                  display: 'inline-block',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '20px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  letterSpacing: '0.5px',
                  marginBottom: '1rem',
                  background: isSystemMembersBlocked
                    ? '#FEF2F2'
                    : isCmsAdminBlocked
                      ? '#EEF2FF'
                      : '#EFF6FF',
                  color: isSystemMembersBlocked
                    ? '#DC2626'
                    : isCmsAdminBlocked
                      ? '#4F46E5'
                      : '#1D4ED8',
                  border: isSystemMembersBlocked
                    ? '1px solid #FECACA'
                    : isCmsAdminBlocked
                      ? '1px solid #C7D2FE'
                      : '1px solid #BFDBFE',
                }}
              >
                {isSystemMembersBlocked
                  ? 'SUPERADMIN PRIVILEGE REQUIRED'
                  : isCmsAdminBlocked
                    ? 'CMS ADMIN SCOPE RESTRICTION'
                    : 'ADMIN SCOPE RESTRICTION'}
              </div>

              <h2
                style={{
                  fontSize: '1.45rem',
                  fontWeight: 700,
                  color: '#0F172A',
                  marginBottom: '0.75rem',
                }}
              >
                {isSystemMembersBlocked
                  ? 'Access Restricted to Superadmin'
                  : isCmsAdminBlocked
                    ? 'Access Restricted to Content Management System (CMS)'
                    : 'Access Restricted to Manpower & Recruitment'}
              </h2>

              <p
                style={{
                  fontSize: '0.9rem',
                  color: '#64748B',
                  lineHeight: '1.65',
                  marginBottom: '2rem',
                }}
              >
                {isSystemMembersBlocked ? (
                  <>
                    Your current account is authenticated as{' '}
                    <strong>{activeRole.toUpperCase()}</strong>.
                    <br />
                    <br />
                    System Members, official email accounts, RBAC role
                    assignments, and authentication passwords can{' '}
                    <strong>only be added and edited by the Superadmin</strong>.
                  </>
                ) : isCmsAdminBlocked ? (
                  <>
                    Your current account is authenticated as{' '}
                    <strong>CMS Administrator</strong> (
                    <code>cmsadmin@thinkwires.com</code>).
                    <br />
                    <br />
                    Per company authorization policy, CMS Administrators have
                    control restricted exclusively to the{' '}
                    <strong>Content Management System (CMS)</strong>. Workforce
                    employees, candidates, clients, job requisitions, and
                    placement rosters require <strong>SuperAdmin</strong> or{' '}
                    <strong>Admin</strong> credentials.
                  </>
                ) : (
                  <>
                    Your current account is authenticated as{' '}
                    <strong>Admin</strong> (<code>admin@thinkwires.com</code>).
                    <br />
                    <br />
                    Per company authorization policy, Admins have control
                    restricted exclusively to{' '}
                    <strong>Manpower and Recruitment</strong>. The Content
                    Management System (CMS), page editing, blog publishing, and
                    SEO configurations require <strong>SuperAdmin</strong> or{' '}
                    <strong>CMS Admin</strong> credentials.
                  </>
                )}
              </p>

              <div
                style={{
                  display: 'flex',
                  gap: '0.85rem',
                  justifyContent: 'center',
                  flexWrap: 'wrap',
                }}
              >
                {isSystemMembersBlocked ? (
                  <Link
                    to={isCmsAdmin ? '/admin/cms' : '/admin'}
                    className="tw-btn-primary"
                    style={{
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    {isCmsAdmin ? (
                      <MonitorIcon size={16} />
                    ) : (
                      <UsersIcon size={16} />
                    )}
                    <span>
                      {isCmsAdmin
                        ? 'Return to CMS Workspace'
                        : 'Return to Manpower Workspace'}
                    </span>
                  </Link>
                ) : isCmsAdminBlocked ? (
                  <Link
                    to="/admin/cms"
                    className="tw-btn-primary"
                    style={{
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <MonitorIcon size={16} />
                    <span>Go to Assigned CMS Workspace</span>
                  </Link>
                ) : (
                  <Link
                    to="/admin"
                    className="tw-btn-primary"
                    style={{
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <UsersIcon size={16} />
                    <span>Go to Assigned Manpower & Recruitment</span>
                  </Link>
                )}
                <button
                  type="button"
                  className="tw-btn-secondary"
                  onClick={handleLogout}
                >
                  Sign Out / Switch Account
                </button>
              </div>
            </div>
          ) : (
            <Outlet context={{ showToast, activeRole }} />
          )}
        </main>
      </div>

      {/* Global Toast */}
      {toastMessage && (
        <div className="tw-toast">
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export default AdminLayout;
