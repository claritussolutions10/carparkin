import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, CheckCheck } from 'lucide-react'
import {
  getNotifications, getUnreadCount, markNotificationRead, markAllNotificationsRead, type AppNotification,
} from '../../api/notifications.api'

function timeAgo(d: string) {
  const diffMs = Date.now() - new Date(d).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export default function NotificationBell() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => { getUnreadCount().then(setUnreadCount).catch(() => {}) }, [])

  const toggleOpen = () => {
    const next = !open
    setOpen(next)
    if (next) {
      setLoading(true)
      getNotifications({ limit: 8 })
        .then((d) => setNotifications(d.notifications))
        .catch(() => {})
        .finally(() => setLoading(false))
    }
  }

  const handleClick = async (n: AppNotification) => {
    if (!n.is_read) {
      setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)))
      setUnreadCount((c) => Math.max(0, c - 1))
      markNotificationRead(n.id).catch(() => {})
    }
    setOpen(false)
    if (n.link) navigate(n.link)
  }

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    setUnreadCount(0)
    try { await markAllNotificationsRead() } catch { /* local state already optimistic */ }
  }

  return (
    <div className="relative">
      <button
        onClick={toggleOpen}
        className="relative w-10 h-10 rounded-full bg-white border border-line shadow flex items-center justify-center text-ink/60 hover:text-green transition-colors"
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-danger" />
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl border border-line shadow-lg z-20 max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between px-4 py-3 border-b border-line sticky top-0 bg-white">
              <p className="text-sm font-semibold text-ink">Notifications</p>
              {unreadCount > 0 && (
                <button onClick={handleMarkAllRead} className="flex items-center gap-1 text-xs font-medium text-green hover:text-green-light transition-colors">
                  <CheckCheck size={12} /> Mark all read
                </button>
              )}
            </div>

            {loading ? (
              <div className="p-4 space-y-2">
                {Array.from({ length: 3 }, (_, i) => <div key={i} className="h-12 bg-concrete rounded-lg animate-pulse" />)}
              </div>
            ) : notifications.length === 0 ? (
              <p className="text-sm text-ink/40 px-4 py-6 text-center">No new notifications.</p>
            ) : (
              <div className="divide-y divide-line">
                {notifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => handleClick(n)}
                    className={`w-full text-left px-4 py-3 hover:bg-concrete/60 transition-colors ${!n.is_read ? 'bg-green/5' : ''}`}
                  >
                    <div className="flex items-start gap-2">
                      {!n.is_read && <span className="w-1.5 h-1.5 rounded-full bg-green mt-1.5 shrink-0" />}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-ink">{n.title}</p>
                        {n.message && <p className="text-xs text-ink/50 mt-0.5 line-clamp-2">{n.message}</p>}
                        <p className="text-xs text-ink/30 mt-1">{timeAgo(n.created_at)}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
