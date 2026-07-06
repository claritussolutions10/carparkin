import client from './client'

export interface AppNotification {
  id: string
  type: string
  title: string
  message: string | null
  link: string | null
  is_read: boolean
  created_at: string
}

export const getNotifications = (params?: { page?: number; limit?: number }) =>
  client.get<{ notifications: AppNotification[]; total: number }>('/notifications', { params }).then((r) => r.data)

export const getUnreadCount = () =>
  client.get<{ count: number }>('/notifications/unread-count').then((r) => r.data.count)

export const markNotificationRead = (id: string) =>
  client.patch(`/notifications/${id}/read`).then((r) => r.data)

export const markAllNotificationsRead = () =>
  client.patch('/notifications/read-all').then((r) => r.data)
