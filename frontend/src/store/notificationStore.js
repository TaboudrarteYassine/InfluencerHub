import { create } from 'zustand'

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,

  addNotification: (notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications].slice(0, 50),
      unreadCount: state.unreadCount + 1,
    }))
  },

  prependNotification: (notification) => set((state) => ({
    notifications: [notification, ...state.notifications]
  })),

  incrementUnread: () => set((state) => ({ unreadCount: state.unreadCount + 1 })),
  resetUnread: () => set({ unreadCount: 0 }),
  setUnreadCount: (count) => set({ unreadCount: count }),

  markAllRead: () => set({ unreadCount: 0 }),

  setNotifications: (notifications) => {
    const unread = notifications.filter((n) => !n.is_read).length
    set({ notifications, unreadCount: unread })
  },
}))
