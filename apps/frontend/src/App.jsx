import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { checkAuthSession } from './store/slices/authSlice';

import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import JobPage from './pages/JobPage';
import BlogPage from './pages/BlogPage';
import ContactPage from './pages/ContactPage';
import IndustriesPage from './pages/IndustriesPage';
import IndustryDetailPage from './pages/IndustryDetailPage';
import BenchPage from './pages/BenchPage';
import PayrollPage from './pages/PayrollPage';
import EorPage from './pages/EorPage';
import StaffAugmentationPage from './pages/StaffAugmentationPage';
import PermanentStaffingPage from './pages/PermanentStaffingPage';
import ServicesPage from './pages/ServicesPage';
import FindTalentPage from './pages/FindTalentPage';
import LegalPage from './pages/LegalPage';
import NotFoundPage from './pages/NotFoundPage';
import ScrollAnimationManager from './components/common/ScrollAnimationManager';
import LoadingSpinner from './components/common/LoadingSpinner';
import ProtectedRoute from './components/common/ProtectedRoute';
import GlobalErrorBoundary from './components/common/GlobalErrorBoundary';

// Authentication Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';

// Protected Candidate Portal Pages
import CandidateDashboardPage from './pages/candidate/CandidateDashboardPage';
import CandidateProfilePage from './pages/candidate/CandidateProfilePage';
import CandidateApplicationsPage from './pages/candidate/CandidateApplicationsPage';
import JobApplyPage from './pages/candidate/JobApplyPage';

// Thinkwires Admin Dashboard & CMS Modules (Code-split with React.lazy)
const AdminLayout = lazy(() => import('./admin/AdminLayout'));
const AdminLoginPage = lazy(() => import('./admin/AdminLoginPage'));
const AdminDashboard = lazy(() => import('./admin/AdminDashboard'));
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
          <Route path="/industries" element={<IndustriesPage />} />
          <Route path="/industries/:slug" element={<IndustryDetailPage />} />
          <Route path="/talent-cloud" element={<BenchPage />} />
          <Route path="/bench" element={<BenchPage />} />
          <Route path="/jobs" element={<JobPage />} />
          <Route path="/hot-jobs" element={<JobPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/contact" element={<ContactPage />} />

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
          </Route>

          {/* 404 Dedicated Fallback */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
