import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import PendingVerificationPage from '@/pages/kyc/PendingVerificationPage'
import RejectedVerificationPage from '@/pages/kyc/RejectedVerificationPage'

export default function KYCGuard({ children }) {
  const { user } = useAuthStore()

  if (!user || user.role !== 'influencer') {
    return children // Let RoleRoute handle this
  }

  // If we don't have the status yet, it means either they haven't onboarded
  // or they just registered.
  const status = user?.influencer_profile?.verification_status || 'not_submitted'

  if (status === 'not_submitted') {
    // Should be onboarding
    return children
  }

  if (status === 'pending') {
    return <PendingVerificationPage />
  }

  if (status === 'rejected') {
    return <RejectedVerificationPage />
  }

  // if approved, render children
  return children
}
