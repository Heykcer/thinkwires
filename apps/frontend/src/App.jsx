import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { checkAuthSession } from './store/slices/authSlice';

import ScrollAnimationManager from './components/common/ScrollAnimationManager';
import LoadingSpinner from './components/common/LoadingSpinner';
import ProtectedRoute from './components/common/ProtectedRoute';
import GlobalErrorBoundary from './components/common/GlobalErrorBoundary';

// Public Website Pages (Code-split with React.lazy for SEC-FE-01)
const HomePage = lazy(() => import('./pages/HomePage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const JobPage = lazy(() => import('./pages/JobPage'));
const BlogPage = lazy(() => import('./pages/BlogPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const IndustriesPage = lazy(() => import('./pages/IndustriesPage'));
const IndustryDetailPage = lazy(() => import('./pages/IndustryDetailPage'));
const BenchPage = lazy(() => import('./pages/BenchPage'));
const PayrollPage = lazy(() => import('./pages/PayrollPage'));
const EorPage = lazy(() => import('./pages/EorPage'));
const StaffAugmentationPage = lazy(() => import('./pages/StaffAugmentationPage'));
const PermanentStaffingPage = lazy(() => import('./pages/PermanentStaffingPage'));
const ServicesPage = lazy(() => import('./pages/ServicesPage'));
const FindTalentPage = lazy(() => import('./pages/FindTalentPage'));
const LegalPage = lazy(() => import('./pages/LegalPage'));
const FaqPage = lazy(() => import('./pages/FaqPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const MissionVisionPage = lazy(() => import('./pages/MissionVisionPage'));
const ValuesCodeOfConductPage = lazy(() => import('./pages/ValuesCodeOfConductPage'));
const LifeAtThinkwiresPage = lazy(() => import('./pages/LifeAtThinkwiresPage'));
const BenefitsPage = lazy(() => import('./pages/BenefitsPage'));
const ComingSoonPage = lazy(() => import('./pages/ComingSoonPage'));

// Authentication Pages (Code-split with React.lazy)
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage'));

// Protected Candidate Portal Pages (Code-split with React.lazy)
const CandidateDashboardPage = lazy(
  () => import('./pages/candidate/CandidateDashboardPage')
);
const CandidateProfilePage = lazy(
  () => import('./pages/candidate/CandidateProfilePage')
);
const CandidateApplicationsPage = lazy(
  () => import('./pages/candidate/CandidateApplicationsPage')
);
const JobApplyPage = lazy(() => import('./pages/candidate/JobApplyPage'));

// Thinkwires Admin Dashboard & CMS Modules (Code-split with React.lazy)
const AdminLayout = lazy(() => import('./admin/AdminLayout'));
const AdminLoginPage = lazy(() => import('./admin/AdminLoginPage'));
const AdminDashboard = lazy(() => import('./admin/AdminDashboard'));
const HelpDeskView = lazy(() => import('./admin/HelpDeskView'));
const EmployeesView = lazy(() => import('./admin/EmployeesView'));
const CandidatesView = lazy(() => import('./admin/CandidatesView'));
const ClientsView = lazy(() => import('./admin/ClientsView'));
const JobsView = lazy(() => import('./admin/JobsView'));
const RequisitionsView = lazy(() => import('./admin/RequisitionsView'));
const PlacementsView = lazy(() => import('./admin/PlacementsView'));
const CmsDashboard = lazy(() => import('./admin/CmsDashboard'));
const PagesManager = lazy(() => import('./admin/PagesManager'));
const BlogManager = lazy(() => import('./admin/BlogManager'));
const MediaLibrary = lazy(() => import('./admin/MediaLibrary'));
const SeoManager = lazy(() => import('./admin/SeoManager'));
const AnnouncementsManager = lazy(() => import('./admin/AnnouncementsManager'));
const SystemMembersView = lazy(() => import('./admin/SystemMembersView'));
const DocsView = lazy(() => import('./admin/DocsView'));

function App() {
  const dispatch = useDispatch();

  // Restore authenticated candidate session on page refresh via HttpOnly cookie
  useEffect(() => {
    dispatch(checkAuthSession());
  }, [dispatch]);

  return (
    <BrowserRouter>
      <ScrollAnimationManager />
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          {/* Public Website Pages (Browsed freely without any auth gates) */}
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/about/mission-vision" element={<MissionVisionPage />} />
          <Route path="/about/values" element={<ValuesCodeOfConductPage />} />
          <Route path="/industries" element={<IndustriesPage />} />
          <Route path="/industries/:slug" element={<IndustryDetailPage />} />
          <Route path="/talent-cloud" element={<BenchPage />} />
          <Route path="/bench" element={<BenchPage />} />
          <Route path="/jobs" element={<JobPage />} />
          <Route path="/hot-jobs" element={<JobPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:slug" element={<BlogPage />} />
          <Route path="/contact" element={<ContactPage />} />

          {/* Resources Routes (Issue #170) */}
          <Route path="/events" element={<ComingSoonPage />} />
          <Route path="/resources/events" element={<ComingSoonPage />} />
          <Route path="/faq" element={<FaqPage />} />
          <Route path="/faqs" element={<FaqPage />} />
          <Route path="/resources/faqs" element={<FaqPage />} />
          <Route path="/policies" element={<LegalPage />} />
          <Route path="/life-at-thinkwires" element={<LifeAtThinkwiresPage />} />
          <Route path="/benefits" element={<BenefitsPage />} />

          {/* Authentication Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Protected Candidate Portal & Application Flow */}
          <Route
            path="/candidate-portal"
            element={
              <ProtectedRoute>
                <CandidateDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/portal"
            element={
              <ProtectedRoute>
                <CandidateDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/candidate"
            element={
              <ProtectedRoute>
                <CandidateDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/candidate/dashboard"
            element={
              <ProtectedRoute>
                <CandidateDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/candidate/profile"
            element={
              <ProtectedRoute>
                <CandidateProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/candidate/applications"
            element={
              <ProtectedRoute>
                <CandidateApplicationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/jobs/:jobId/apply"
            element={
              <ProtectedRoute>
                <JobApplyPage />
              </ProtectedRoute>
            }
          />

          {/* Find Talent & Hire Talent (Client-facing public pages) */}
          <Route path="/find-talent" element={<FindTalentPage />} />
          <Route path="/hire-talent" element={<FindTalentPage />} />

          {/* Services Routes */}
          <Route path="/services" element={<ServicesPage />} />
          <Route
            path="/services/staff-augmentation"
            element={<StaffAugmentationPage />}
          />
          <Route
            path="/staff-augmentation"
            element={<StaffAugmentationPage />}
          />
          <Route
            path="/services/permanent-staffing"
            element={<PermanentStaffingPage />}
          />
          <Route
            path="/permanent-staffing"
            element={<PermanentStaffingPage />}
          />
          <Route
            path="/services/permanent-staffing-and-executive-search"
            element={<PermanentStaffingPage />}
          />
          <Route
            path="/permanent-staffing-and-executive-search"
            element={<PermanentStaffingPage />}
          />
          <Route
            path="/services/executive-search"
            element={<PermanentStaffingPage />}
          />
          <Route path="/executive-search" element={<PermanentStaffingPage />} />
          <Route path="/services/payroll" element={<PayrollPage />} />
          <Route path="/payroll" element={<PayrollPage />} />
          <Route path="/payroll-outsourcing" element={<PayrollPage />} />
          <Route path="/services/eor" element={<EorPage />} />
          <Route path="/eor" element={<EorPage />} />
          <Route path="/employer-of-record" element={<EorPage />} />

          {/* Legal & Compliance Routes */}
          <Route path="/privacy" element={<LegalPage />} />
          <Route path="/privacy-policy" element={<LegalPage />} />
          <Route path="/terms" element={<LegalPage />} />
          <Route path="/terms-of-service" element={<LegalPage />} />
          <Route path="/security" element={<LegalPage />} />
          <Route path="/compliance" element={<LegalPage />} />
          <Route path="/cookies" element={<LegalPage />} />
          <Route path="/legal" element={<LegalPage />} />

          {/* Thinkwires Admin Portal Login */}
          <Route path="/admin/login" element={<AdminLoginPage />} />

          {/* Thinkwires Admin Dashboard & CMS */}
          <Route
            path="/admin"
            element={
              <GlobalErrorBoundary>
                <AdminLayout />
              </GlobalErrorBoundary>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="helpdesk" element={<HelpDeskView />} />
            <Route path="requisitions" element={<RequisitionsView />} />
            <Route path="employees" element={<EmployeesView />} />
            <Route path="candidates" element={<CandidatesView />} />
            <Route path="clients" element={<ClientsView />} />
            <Route path="jobs" element={<JobsView />} />
            <Route path="placements" element={<PlacementsView />} />
            <Route path="system-members" element={<SystemMembersView />} />
            <Route path="cms" element={<CmsDashboard />} />
            <Route path="cms/pages" element={<PagesManager />} />
            <Route path="cms/blog" element={<BlogManager />} />
            <Route path="cms/media" element={<MediaLibrary />} />
            <Route path="cms/seo" element={<SeoManager />} />
            <Route
              path="cms/announcements"
              element={<AnnouncementsManager />}
            />
            <Route path="docs" element={<DocsView />} />
          </Route>

          {/* 404 Dedicated Fallback */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
