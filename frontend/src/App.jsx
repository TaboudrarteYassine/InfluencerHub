import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

// Layouts
import PublicLayout  from '@/layouts/PublicLayout'
import DashboardLayout from '@/layouts/DashboardLayout'

// Public pages
import LandingPage   from '@/pages/LandingPage'
import LoginPage     from '@/pages/auth/LoginPage'
import RegisterPage  from '@/pages/auth/RegisterPage'
import DiscoverPage  from '@/pages/DiscoverPage'
import DiscoverCampaigns from '@/pages/DiscoverCampaigns'
import InfluencerProfilePage from '@/pages/InfluencerProfilePage'
import CampaignDetailPage    from '@/pages/CampaignDetailPage'
import PublicInfluencerProfile from '@/pages/public/PublicInfluencerProfile'

// Protected pages (shared)
import DashboardPage from '@/pages/dashboard/DashboardPage'
import ChatPage      from '@/pages/chat/ChatPage'
import NotificationsPage from '@/pages/NotificationsPage'

// Influencer
import InfluencerOnboarding from '@/pages/onboarding/InfluencerOnboarding'
import InfluencerSettings   from '@/pages/influencer/InfluencerSettings'
import MyRequests           from '@/pages/influencer/MyRequests'
import AnalyticsPage        from '@/pages/influencer/AnalyticsPage'

// Client
import ClientOnboarding  from '@/pages/onboarding/ClientOnboarding'
import ClientCampaigns   from '@/pages/client/ClientCampaigns'
import CreateCampaign    from '@/pages/client/CreateCampaign'
import CampaignMatches   from '@/pages/client/CampaignMatches'
import ClientSettings    from '@/pages/client/ClientSettings'
import SavedInfluencersPage from '@/pages/client/SavedInfluencersPage'

// Admin
import AdminLogin       from '@/pages/admin/AdminLogin'
import AdminLayout      from '@/layouts/AdminLayout'
import AdminDashboard   from '@/pages/admin/AdminDashboard'
import AdminUsers       from '@/pages/admin/AdminUsers'
import AdminCampaigns   from '@/pages/admin/AdminCampaigns'
import AdminTrust       from '@/pages/admin/AdminTrust'
import AdminReviews     from '@/pages/admin/AdminReviews'
import AdminCategories  from '@/pages/admin/AdminCategories'
import AdminActivity    from '@/pages/admin/AdminActivity'
import AdminNotifications from '@/pages/admin/AdminNotifications'
import AdminSecurity    from '@/pages/admin/AdminSecurity'
import AdminSettings    from '@/pages/admin/AdminSettings'
import AdminAnalytics   from '@/pages/admin/AdminAnalytics'
import AdminReports     from '@/pages/admin/AdminReports'
import AdminKYC         from '@/pages/admin/AdminKYC'
import AdminPayments    from '@/pages/admin/AdminPayments'

// Guards
import ProtectedAdminRoute from '@/components/ProtectedAdminRoute'
import KYCGuard from '@/components/KYCGuard'

const PrivateRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

const RoleRoute = ({ role, children }) => {
  const { user, isAuthenticated } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (user?.role !== role) return <Navigate to="/dashboard" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      {/* ── Public ── */}
      <Route path="/@:username" element={<PublicInfluencerProfile />} />
      <Route element={<PublicLayout />}>
        <Route path="/"          element={<LandingPage />} />
        <Route path="/influencers/:id" element={<InfluencerProfilePage />} />
        <Route path="/campaigns/:id"   element={<CampaignDetailPage />} />
        <Route path="/login"     element={<LoginPage />} />
        <Route path="/register"  element={<RegisterPage />} />
      </Route>

      {/* ── Protected ── */}
      <Route element={<PrivateRoute><DashboardLayout /></PrivateRoute>}>
        <Route path="/dashboard"       element={<DashboardPage />} />
        <Route path="/chat"            element={<ChatPage />} />
        <Route path="/chat/:id"        element={<ChatPage />} />
        <Route path="/notifications"   element={<NotificationsPage />} />

        {/* Influencer */}
        <Route path="/campaigns/discover" element={
          <RoleRoute role="influencer"><KYCGuard><DiscoverCampaigns /></KYCGuard></RoleRoute>
        }/>
        <Route path="/onboarding/influencer" element={
          <RoleRoute role="influencer"><InfluencerOnboarding /></RoleRoute>
        }/>
        <Route path="/settings/influencer" element={
          <RoleRoute role="influencer"><KYCGuard><InfluencerSettings /></KYCGuard></RoleRoute>
        }/>
        <Route path="/influencer/requests" element={
          <RoleRoute role="influencer"><KYCGuard><MyRequests /></KYCGuard></RoleRoute>
        }/>
        <Route path="/influencer/analytics" element={
          <RoleRoute role="influencer"><KYCGuard><AnalyticsPage /></KYCGuard></RoleRoute>
        }/>

        {/* Client */}
        <Route path="/discover" element={
          <RoleRoute role="client"><DiscoverPage /></RoleRoute>
        }/>
        <Route path="/onboarding/client" element={
          <RoleRoute role="client"><ClientOnboarding /></RoleRoute>
        }/>
        <Route path="/settings/client" element={
          <RoleRoute role="client"><ClientSettings /></RoleRoute>
        }/>
        <Route path="/campaigns"       element={
          <RoleRoute role="client"><ClientCampaigns /></RoleRoute>
        }/>
        <Route path="/campaigns/create" element={
          <RoleRoute role="client"><CreateCampaign /></RoleRoute>
        }/>
        <Route path="/campaigns/:id/matches" element={
          <RoleRoute role="client"><CampaignMatches /></RoleRoute>
        }/>
        <Route path="/saved" element={
          <RoleRoute role="client"><SavedInfluencersPage /></RoleRoute>
        }/>
      </Route>

      <Route path="/admin/login" element={<AdminLogin />} />

      {/* ── Admin ── */}
      <Route element={<ProtectedAdminRoute><AdminLayout /></ProtectedAdminRoute>}>
        <Route path="/admin"               element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/admin/dashboard"     element={<AdminDashboard />} />
        <Route path="/admin/analytics"     element={<AdminAnalytics />} />
        <Route path="/admin/users"         element={<AdminUsers />} />
        <Route path="/admin/campaigns"     element={<AdminCampaigns />} />
        <Route path="/admin/trust"         element={<AdminTrust />} />
        <Route path="/admin/reviews"       element={<AdminReviews />} />
        <Route path="/admin/reports"       element={<AdminReports />} />
        <Route path="/admin/kyc"           element={<AdminKYC />} />
        <Route path="/admin/categories"    element={<AdminCategories />} />
        <Route path="/admin/notifications" element={<AdminNotifications />} />
        <Route path="/admin/payments"      element={<AdminPayments />} />
        <Route path="/admin/security"      element={<AdminSecurity />} />
        <Route path="/admin/activity"      element={<AdminActivity />} />
        <Route path="/admin/settings"      element={<AdminSettings />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
