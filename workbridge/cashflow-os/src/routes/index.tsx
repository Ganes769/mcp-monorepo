import { lazy, Suspense } from 'react'
import { createBrowserRouter, Outlet } from 'react-router'
import { AppLayout } from '@/layouts/AppLayout'
import { MarketingHomePage } from '@/pages/MarketingHomePage'
import { LoginPage } from '@/pages/LoginPage'
import { XeroReturnPage } from '@/pages/XeroReturnPage'
import { ErrorPage } from '@/pages/ErrorPage'
import { LoadingBlock } from '@/components/shared/states'
import { RequireAuth } from '@/components/auth/RequireAuth'

const OverviewPage = lazy(() => import('@/pages/OverviewPage').then((m) => ({ default: m.OverviewPage })))
const InvoicesPage = lazy(() => import('@/pages/InvoicesPage').then((m) => ({ default: m.InvoicesPage })))
const InvoiceDetailPage = lazy(() => import('@/pages/InvoiceDetailPage').then((m) => ({ default: m.InvoiceDetailPage })))
const InvestigationsPage = lazy(() => import('@/pages/InvestigationsPage').then((m) => ({ default: m.InvestigationsPage })))
const ApprovalsPage = lazy(() => import('@/pages/ApprovalsPage').then((m) => ({ default: m.ApprovalsPage })))
const CustomersPage = lazy(() => import('@/pages/CustomersPage').then((m) => ({ default: m.CustomersPage })))
const CustomerDetailPage = lazy(() => import('@/pages/CustomerDetailPage').then((m) => ({ default: m.CustomerDetailPage })))
const FollowUpsPage = lazy(() => import('@/pages/FollowUpsPage').then((m) => ({ default: m.FollowUpsPage })))
const AgentActivityPage = lazy(() => import('@/pages/AgentActivityPage').then((m) => ({ default: m.AgentActivityPage })))
const AnalyticsPage = lazy(() => import('@/pages/AnalyticsPage').then((m) => ({ default: m.AnalyticsPage })))
const SettingsPage = lazy(() => import('@/pages/SettingsPage').then((m) => ({ default: m.SettingsPage })))
const XeroPage = lazy(() => import('@/pages/XeroPage').then((m) => ({ default: m.XeroPage })))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })))

export const router = createBrowserRouter([
  {
    path: '/',
    errorElement: <ErrorPage />,
    element: (
      <Suspense fallback={<LoadingBlock className="h-screen rounded-none" />}>
        <Outlet />
      </Suspense>
    ),
    children: [
      { index: true, element: <MarketingHomePage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'login/xero', element: <XeroReturnPage /> },
      {
        path: 'app',
        element: (
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        ),
        children: [
          { index: true, element: <OverviewPage /> },
          { path: 'invoices', element: <InvoicesPage /> },
          { path: 'invoices/:invoiceId', element: <InvoiceDetailPage /> },
          { path: 'investigations', element: <InvestigationsPage /> },
          { path: 'approvals', element: <ApprovalsPage /> },
          { path: 'contacts', element: <CustomersPage /> },
          { path: 'customers', element: <CustomersPage /> },
          { path: 'customers/:customerId', element: <CustomerDetailPage /> },
          { path: 'xero', element: <XeroPage /> },
          { path: 'follow-ups', element: <FollowUpsPage /> },
          { path: 'agent-activity', element: <AgentActivityPage /> },
          { path: 'analytics', element: <AnalyticsPage /> },
          { path: 'settings', element: <SettingsPage /> },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])