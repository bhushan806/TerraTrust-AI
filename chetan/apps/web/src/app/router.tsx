import React, { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { RequireAuth, RequirePermission, PublicOnlyRoute } from './auth-guards';
import { LoadingState } from '@/components/feedback/LoadingState';
import { ErrorBoundary } from './error-boundary';

/* ── Eager-loaded pages ────────────────────────────────────── */
import { LoginPage } from '@/features/auth/LoginPage';

/* ── Lazy-loaded feature pages (route-level code splitting) ── */
const DashboardPage = lazy(() => import('@/features/dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const BorrowerListPage = lazy(() => import('@/features/borrowers/BorrowerListPage').then((m) => ({ default: m.BorrowerListPage })));
const BorrowerDetailPage = lazy(() => import('@/features/borrowers/BorrowerDetailPage').then((m) => ({ default: m.BorrowerDetailPage })));
const RiskTimelinePage = lazy(() => import('@/features/borrowers/RiskTimelinePage').then((m) => ({ default: m.RiskTimelinePage })));
const FarmDetailPage = lazy(() => import('@/features/farms/FarmDetailPage').then((m) => ({ default: m.FarmDetailPage })));
const CropCycleDetailPage = lazy(() => import('@/features/crop-cycles/CropCycleDetailPage').then((m) => ({ default: m.CropCycleDetailPage })));
const ClimateIntelligencePage = lazy(() => import('@/features/climate/ClimateIntelligencePage').then((m) => ({ default: m.ClimateIntelligencePage })));
const YieldPredictionPage = lazy(() => import('@/features/yield/YieldPredictionPage').then((m) => ({ default: m.YieldPredictionPage })));
const FarmIncomePage = lazy(() => import('@/features/income/FarmIncomePage').then((m) => ({ default: m.FarmIncomePage })));
const NewLoanApplicationPage = lazy(() => import('@/features/loans/NewLoanApplicationPage').then((m) => ({ default: m.NewLoanApplicationPage })));
const LoanApplicationDetailPage = lazy(() => import('@/features/loans/LoanApplicationDetailPage').then((m) => ({ default: m.LoanApplicationDetailPage })));
const NewAssessmentPage = lazy(() => import('@/features/assessments/NewAssessmentPage').then((m) => ({ default: m.NewAssessmentPage })));
const AssessmentDetailPage = lazy(() => import('@/features/assessments/AssessmentDetailPage').then((m) => ({ default: m.AssessmentDetailPage })));
const RiskExplanationPage = lazy(() => import('@/features/assessments/RiskExplanationPage').then((m) => ({ default: m.RiskExplanationPage })));
const ScenarioSimulatorPage = lazy(() => import('@/features/scenarios/ScenarioSimulatorPage').then((m) => ({ default: m.ScenarioSimulatorPage })));
const AssessmentReportPage = lazy(() => import('@/features/reports/AssessmentReportPage').then((m) => ({ default: m.AssessmentReportPage })));
const UserAdminPage = lazy(() => import('@/features/admin/UserAdminPage').then((m) => ({ default: m.UserAdminPage })));
const DataSourceHealthPage = lazy(() => import('@/features/admin/DataSourceHealthPage').then((m) => ({ default: m.DataSourceHealthPage })));
const DeferredFeaturePage = lazy(() => import('@/features/deferred/DeferredFeaturePage').then((m) => ({ default: m.DeferredFeaturePage })));

/* ── Lazy-loaded fallback pages ──────────────────────────── */
const NotFoundPage = lazy(() => import('@/features/deferred/NotFoundPage'));

/* ── Suspend wrapper ─────────────────────────────────────── */
function SuspendedPage({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[50vh]">
          <LoadingState message="Loading page..." />
        </div>
      }
    >
      {children}
    </Suspense>
  );
}

/* ── Router definition ───────────────────────────────────── */
export const router = createBrowserRouter([
  /* PUBLIC ROUTES */
  {
    path: '/login',
    element: (
      <PublicOnlyRoute>
        <LoginPage />
      </PublicOnlyRoute>
    ),
  },

  /* PROTECTED ROUTES — wrapped in AppShell */
  {
    path: '/',
    element: (
      <RequireAuth>
        <ErrorBoundary>
          <AppShell />
        </ErrorBoundary>
      </RequireAuth>
    ),
    children: [
      /* Dashboard */
      {
        index: true,
        element: (
          <RequirePermission feature="VIEW_DASHBOARD">
            <SuspendedPage><DashboardPage /></SuspendedPage>
          </RequirePermission>
        ),
      },

      /* Borrowers */
      {
        path: 'borrowers',
        element: (
          <RequirePermission feature="VIEW_BORROWERS">
            <SuspendedPage><BorrowerListPage /></SuspendedPage>
          </RequirePermission>
        ),
      },
      {
        path: 'borrowers/:id',
        element: (
          <RequirePermission feature="VIEW_BORROWERS">
            <SuspendedPage><BorrowerDetailPage /></SuspendedPage>
          </RequirePermission>
        ),
      },
      {
        path: 'borrowers/:id/timeline',
        element: (
          <RequirePermission feature="VIEW_RISK_TIMELINE">
            <SuspendedPage><RiskTimelinePage /></SuspendedPage>
          </RequirePermission>
        ),
      },

      /* Farms */
      {
        path: 'farms/:id',
        element: (
          <RequirePermission feature="VIEW_FARMS">
            <SuspendedPage><FarmDetailPage /></SuspendedPage>
          </RequirePermission>
        ),
      },

      /* Crop Cycles */
      {
        path: 'crop-cycles/:id',
        element: (
          <RequirePermission feature="VIEW_FARMS">
            <SuspendedPage><CropCycleDetailPage /></SuspendedPage>
          </RequirePermission>
        ),
      },
      {
        path: 'crop-cycles/:id/climate',
        element: (
          <RequirePermission feature="VIEW_CLIMATE_INTELLIGENCE">
            <SuspendedPage><ClimateIntelligencePage /></SuspendedPage>
          </RequirePermission>
        ),
      },
      {
        path: 'crop-cycles/:id/yield',
        element: (
          <RequirePermission feature="VIEW_YIELD_PREDICTION">
            <SuspendedPage><YieldPredictionPage /></SuspendedPage>
          </RequirePermission>
        ),
      },
      {
        path: 'crop-cycles/:id/income',
        element: (
          <RequirePermission feature="VIEW_INCOME_ANALYSIS">
            <SuspendedPage><FarmIncomePage /></SuspendedPage>
          </RequirePermission>
        ),
      },

      /* Loan Applications */
      {
        path: 'loan-applications/new',
        element: (
          <RequirePermission feature="CREATE_LOAN_APPLICATION">
            <SuspendedPage><NewLoanApplicationPage /></SuspendedPage>
          </RequirePermission>
        ),
      },
      {
        path: 'loan-applications/:id',
        element: (
          <RequirePermission feature="VIEW_LOAN_APPLICATIONS">
            <SuspendedPage><LoanApplicationDetailPage /></SuspendedPage>
          </RequirePermission>
        ),
      },

      /* Assessments */
      {
        path: 'assessments/new',
        element: (
          <RequirePermission feature="CREATE_ASSESSMENT">
            <SuspendedPage><NewAssessmentPage /></SuspendedPage>
          </RequirePermission>
        ),
      },
      {
        path: 'assessments/:id',
        element: (
          <RequirePermission feature="VIEW_ASSESSMENT_DETAIL">
            <SuspendedPage><AssessmentDetailPage /></SuspendedPage>
          </RequirePermission>
        ),
      },
      {
        path: 'assessments/:id/explanations',
        element: (
          <RequirePermission feature="VIEW_RISK_EXPLANATIONS">
            <SuspendedPage><RiskExplanationPage /></SuspendedPage>
          </RequirePermission>
        ),
      },
      {
        path: 'assessments/:id/scenarios',
        element: (
          <RequirePermission feature="RUN_SCENARIOS">
            <SuspendedPage><ScenarioSimulatorPage /></SuspendedPage>
          </RequirePermission>
        ),
      },
      {
        path: 'assessments/:id/report',
        element: (
          <RequirePermission feature="DOWNLOAD_REPORTS">
            <SuspendedPage><AssessmentReportPage /></SuspendedPage>
          </RequirePermission>
        ),
      },

      /* Administration */
      {
        path: 'admin/users',
        element: (
          <RequirePermission feature="MANAGE_USERS">
            <SuspendedPage><UserAdminPage /></SuspendedPage>
          </RequirePermission>
        ),
      },
      {
        path: 'admin/data-sources',
        element: (
          <RequirePermission feature="VIEW_DATA_SOURCE_HEALTH">
            <SuspendedPage><DataSourceHealthPage /></SuspendedPage>
          </RequirePermission>
        ),
      },

      /* Deferred / Feature-Flagged Routes */
      {
        path: 'alerts',
        element: (
          <SuspendedPage>
            <DeferredFeaturePage
              featureName="Climate & Risk Alerts"
              roadmapMilestone="Phase 2 (Post-MVP)"
              description="Real-time climate alerts, borrower risk-change notifications, data-source failure warnings, and assessment completion notifications will appear here once the alerts module is enabled for your institution."
            />
          </SuspendedPage>
        ),
      },
      {
        path: 'portfolio',
        element: (
          <SuspendedPage>
            <DeferredFeaturePage
              featureName="Portfolio Analytics"
              roadmapMilestone="Phase 2 (Post-MVP)"
              description="Risk distribution by region, exposure by crop, geographic risk layers, concentration risk, vintage analysis, and portfolio stress-testing will appear here once the portfolio analytics module is enabled."
            />
          </SuspendedPage>
        ),
      },

      /* 404 catch-all within authenticated shell */
      {
        path: '*',
        element: (
          <SuspendedPage>
            <NotFoundPage />
          </SuspendedPage>
        ),
      },
    ],
  },

  /* Public 404 fallback */
  {
    path: '*',
    element: <Navigate to="/login" replace />,
  },
]);
