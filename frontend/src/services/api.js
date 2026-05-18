import api from '@/lib/axios'

export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login:    (data) => api.post('/auth/login', data),
  logout:   ()     => api.post('/auth/logout'),
  me:       ()     => api.get('/auth/me'),
  logoutAll:()     => api.post('/auth/logout-all'),
  dashboardStats: () => api.get('/dashboard/stats'),
  publicInfluencerProfile: (username) => api.get(`/influencers/@${username}`),
}

export const influencerApi = {
  list:              (params) => api.get('/influencers', { params }),
  featured:          ()       => api.get('/influencers/featured'),
  show:              (id)     => api.get(`/influencers/${id}`),
  myProfile:         ()       => api.get('/influencer/profile'),
  updateProfile:     (data)   => api.put('/influencer/profile', data),
  addSocialAccount:  (data)   => api.post('/influencer/social-accounts', data),
  myRequests:        (p)      => api.get('/influencer/requests', { params: p }),
  updateAvatar:      (data)   => api.post('/influencer/avatar', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getPortfolio:      (userId) => api.get(`/influencer/portfolio/${userId}`),
  addPortfolioItem:  (data)   => api.post('/influencer/portfolio', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updatePortfolioItem: (id, data) => api.put(`/influencer/portfolio/${id}`, data),
  deletePortfolioItem: (id)   => api.delete(`/influencer/portfolio/${id}`),
}

export const campaignApi = {
  list:        (params) => api.get('/campaigns', { params }),
  show:        (id)     => api.get(`/campaigns/${id}`),
  myCampaigns: (params) => api.get('/client/campaigns', { params }),
  create:      (data)   => api.post('/client/campaigns', data),
  update:      (id, d)  => api.put(`/client/campaigns/${id}`, d),
  delete:      (id)     => api.delete(`/client/campaigns/${id}`),
  publish:     (id)     => api.post(`/client/campaigns/${id}/publish`),
  sendRequest: (id, d)  => api.post(`/client/campaigns/${id}/request`, d),
  markCompleted:(id)    => api.post(`/client/campaigns/${id}/complete`),
  aiMatches:   (id)     => api.get(`/client/campaigns/${id}/ai-matches`),
  publicCampaigns: (params) => api.get('/campaigns/public', { params }),
  applyToCampaign: (id, data) => api.post(`/influencer/campaigns/${id}/apply`, data),
  respondToRequest: (id, data) => api.post(`/campaigns/requests/${id}/respond`, data),
  confirmDeal: (id, data) => api.post(`/campaigns/requests/${id}/confirm-deal`, data),
}

export const kycApi = {
  submit:    (data) => api.post('/kyc/submit', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  resubmit:  (data) => api.post('/kyc/resubmit', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  status:    () => api.get('/kyc/status'),
}

export const chatApi = {
  startDirect:   (recipient_id) => api.post('/chat/conversations/direct', { recipient_id }),
  conversations: (params) => api.get('/chat/conversations', { params }),
  messages:      (id, p)  => api.get(`/chat/conversations/${id}/messages`, { params: p }),
  send:          (id, d)  => api.post(`/chat/conversations/${id}/messages`, d, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  uploadAttachment: (data) => api.post('/chat/upload', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  markRead:  (id) => api.post(`/chat/conversations/${id}/read`),
  typing:    (id, is_typing) => api.post(`/chat/conversations/${id}/typing`, { is_typing }),
}

export const notificationApi = {
  list:    (params) => api.get('/notifications', { params }),
  markRead:(id)     => api.post(`/notifications/${id}/read`),
  markAllRead: ()   => api.post('/notifications/read-all'),
  getUnreadCount: () => api.get('/notifications/unread-count'),
}

export const onboardingApi = {
  updateInfluencer:  (data) => api.put('/onboarding/influencer', data),
  addSocialAccount:  (data) => api.post('/onboarding/influencer/social', data),
  updateClient:      (data) => api.put('/onboarding/client', data),
  complete:          ()     => api.post('/onboarding/complete'),
}

export const clientApi = {
  updateAvatar: (data) => api.post('/client/avatar', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  updateProfile: (data) => api.put('/client/profile', data),
}

export const adminApi = {
  dashboard:    () => api.get('/admin/dashboard'),
  
  // Users
  users:        (p) => api.get('/admin/users', { params: p }),
  userDetails:  (id) => api.get(`/admin/users/${id}`),
  suspendUser:  (id) => api.post(`/admin/users/${id}/suspend`),
  banUser:      (id) => api.post(`/admin/users/${id}/ban`),
  unbanUser:    (id) => api.post(`/admin/users/${id}/unban`),
  verifyInfluencer: (id) => api.post(`/admin/users/${id}/verify`),
  rejectVerification: (id) => api.post(`/admin/users/${id}/reject`),

  // Campaigns
  campaigns:         (p) => api.get('/admin/campaigns', { params: p }),
  campaignDetails:   (id) => api.get(`/admin/campaigns/${id}`),
  cancelCampaign:    (id, data) => api.post(`/admin/campaigns/${id}/cancel`, data),
  completeCampaign:  (id, data) => api.post(`/admin/campaigns/${id}/complete`, data),
  flagCampaign:      (id, data) => api.post(`/admin/campaigns/${id}/flag`, data),

  // Trust Score
  trustScores:       (p) => api.get('/admin/trust', { params: p }),
  bulkRecalculateTrust: () => api.post('/admin/trust/bulk-recalculate'),
  adjustTrustScore:  (id, data) => api.post(`/admin/trust/${id}/adjust`, data),
  recalculateTrust:  (id) => api.post(`/admin/trust/${id}/recalculate`),
  trustHistory:      (id) => api.get(`/admin/trust/${id}/history`),

  // Reviews
  reviews:           (p) => api.get('/admin/reviews', { params: p }),
  toggleReviewVisibility: (id, data) => api.post(`/admin/reviews/${id}/visibility`, data),
  flagFakeReview:    (id) => api.post(`/admin/reviews/${id}/flag`),
  sendReviewWarning: (id) => api.post(`/admin/reviews/${id}/warning`),
  deleteReview:      (id) => api.delete(`/admin/reviews/${id}`),

  // Categories
  categories:        () => api.get('/admin/categories'),
  createCategory:    (data) => api.post('/admin/categories', data),
  updateCategory:    (id, data) => api.put(`/admin/categories/${id}`, data),
  deleteCategory:    (id) => api.delete(`/admin/categories/${id}`),
  toggleCategoryVisibility: (id) => api.post(`/admin/categories/${id}/visibility`),

  // Activity Log
  activityLogs:      (p) => api.get('/admin/activity', { params: p }),

  // Notifications
  notifications:     (p) => api.get('/admin/notifications', { params: p }),
  sendNotification:  (data) => api.post('/admin/notifications/send', data),

  // Security
  securityStats:     () => api.get('/admin/security'),
  blockIp:           (data) => api.post('/admin/security/ip/block', data),
  whitelistIp:       (data) => api.post('/admin/security/ip/whitelist', data),
  forceLogoutUser:   (id) => api.post(`/admin/security/users/${id}/logout`),
  forceLogoutAll:    () => api.post('/admin/security/users/logout-all'),

  // Settings
  settings:          () => api.get('/admin/settings'),
  updateSettings:    (data) => api.post('/admin/settings', data),

  // Analytics
  analytics:         () => api.get('/admin/analytics'),

  // Search
  search:            (q) => api.get('/admin/search', { params: { q } }),

  // Reports
  reports:          (params) => api.get('/admin/reports', { params }),
  warnUser:         (id) => api.post(`/admin/reports/${id}/warn`),
  dismissReport:    (id) => api.post(`/admin/reports/${id}/dismiss`),
  resolveReport:    (id) => api.post(`/admin/reports/${id}/resolve`),

  kycQueue:         (params) => api.get('/admin/kyc/queue', { params }),
  approveKYC:       (userId) => api.post(`/admin/kyc/${userId}/approve`),
  rejectKYC:        (userId, reason) => api.post(`/admin/kyc/${userId}/reject`, { reason }),

  // Payments
  getTransactions:  (params) => api.get('/admin/payments/transactions', { params }),
  forceRefund:      (id) => api.post(`/payments/refund/${id}`),
  forceRelease:     (id) => api.post(`/payments/release/${id}`),
}

export const reviewApi = {
  submit:               (data) => api.post('/reviews', data),
  getInfluencerReviews: (id, params) => api.get(`/reviews/influencer/${id}`, { params }),
  getClientReviews:     (id, params) => api.get(`/reviews/client/${id}`, { params }),
  canReview:            (campaignId) => api.get(`/reviews/can-review/${campaignId}`),
}

export const reportApi = {
  submit: (data) => api.post('/reports', data),
}

export const paymentApi = {
  createIntent:      (data) => api.post('/payments/intent', data),
  release:           (transactionId) => api.post(`/payments/release/${transactionId}`),
  refund:            (transactionId) => api.post(`/payments/refund/${transactionId}`),
  getTransaction:    (collaborationId) => api.get(`/payments/transaction/${collaborationId}`),
  stripeOnboard:     () => api.post('/payments/stripe/onboard'),
  stripeOnboardStatus:() => api.get('/payments/stripe/onboard/status'),
}

export const analyticsApi = {
  submitAnalytics:        (data) => api.post('/analytics/submit', data),
  myStats:                () => api.get('/analytics/my-stats'),
  collaborationAnalytics: (id) => api.get(`/analytics/collaboration/${id}`),
}

export const savedApi = {
  toggle:  (influencerId) => api.post(`/saved/${influencerId}`),
  list:    (params)       => api.get('/saved', { params }),
  check:   (influencerId) => api.get(`/saved/check/${influencerId}`),
  count:   ()             => api.get('/saved/count'),
}
