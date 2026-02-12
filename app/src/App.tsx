import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ToastProvider } from '@/components/ui/Toast'
import { Layout } from '@/components/Layout'
import { LoginPage } from '@/components/LoginPage'
import { useStore } from '@/lib/store'
import { lazy, Suspense } from 'react'

const Dashboard = lazy(() => import('@/pages/Dashboard'))
const Jobs = lazy(() => import('@/pages/Jobs'))
const RoutesPage = lazy(() => import('@/pages/Routes'))
const MapView = lazy(() => import('@/pages/MapView'))
const Optimize = lazy(() => import('@/pages/Optimize'))
const Warranty = lazy(() => import('@/pages/Warranty'))
const Financials = lazy(() => import('@/pages/Financials'))
const Technicians = lazy(() => import('@/pages/Technicians'))
const EmailMonitor = lazy(() => import('@/pages/EmailMonitor'))
const Settings = lazy(() => import('@/pages/Settings'))
const CustomerPortal = lazy(() => import('@/pages/CustomerPortal'))

const queryClient = new QueryClient()

function Loading() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-gray-400 text-sm">Loading...</div>
    </div>
  )
}

function AppContent() {
  const isLoggedIn = useStore(s => s.isLoggedIn)

  if (!isLoggedIn) return <LoginPage />

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Suspense fallback={<Loading />}><Dashboard /></Suspense>} />
          <Route path="/jobs" element={<Suspense fallback={<Loading />}><Jobs /></Suspense>} />
          <Route path="/routes" element={<Suspense fallback={<Loading />}><RoutesPage /></Suspense>} />
          <Route path="/map" element={<Suspense fallback={<Loading />}><MapView /></Suspense>} />
          <Route path="/optimize" element={<Suspense fallback={<Loading />}><Optimize /></Suspense>} />
          <Route path="/warranty" element={<Suspense fallback={<Loading />}><Warranty /></Suspense>} />
          <Route path="/financials" element={<Suspense fallback={<Loading />}><Financials /></Suspense>} />
          <Route path="/technicians" element={<Suspense fallback={<Loading />}><Technicians /></Suspense>} />
          <Route path="/email" element={<Suspense fallback={<Loading />}><EmailMonitor /></Suspense>} />
          <Route path="/settings" element={<Suspense fallback={<Loading />}><Settings /></Suspense>} />
          <Route path="/portal" element={<Suspense fallback={<Loading />}><CustomerPortal /></Suspense>} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </QueryClientProvider>
  )
}
