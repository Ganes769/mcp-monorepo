import { Suspense, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router'
import { LoadingBlock } from '@/components/shared/states'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'

export function AppLayout() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [pathname])

  return (
    <div className="min-h-screen">
      <Sidebar />
      <div className="lg:pl-60">
        <Topbar />
        <main className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6">
          <Suspense fallback={<LoadingBlock className="h-96" />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  )
}
