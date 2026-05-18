import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user:  null,
      token: null,
      isAuthenticated: false,

      setAuth: (user, token) => {
        localStorage.setItem('auth_token', token)
        set({ user, token, isAuthenticated: true })
      },

      updateUser: (userData) => {
        set((state) => ({ user: { ...state.user, ...userData } }))
      },

      setAvatar: (avatarUrl) => {
        set((state) => ({ user: { ...state.user, avatar: avatarUrl } }))
      },

      logout: () => {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_user')
        set({ user: null, token: null, isAuthenticated: false })
      },

      // Role helpers
      isInfluencer: () => get().user?.role === 'influencer',
      isClient:     () => get().user?.role === 'client',
      isAdmin:      () => get().user?.role === 'admin',
      isOnboarded:  () => get().user?.is_onboarded === true,
    }),
    {
      name:    'auth_user',
      partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }),
    }
  )
)
