import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef(null)

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return
      const res = await axios.get('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.data) {
        setNotifications(res.data.notifications || [])
        setUnreadCount(res.data.unreadCount || 0)
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err)
    }
  }

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 15000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleMarkOneRead = async (id, e) => {
    e.stopPropagation()
    try {
      const token = localStorage.getItem('token')
      await axios.put(`/api/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      fetchNotifications()
    } catch (err) {
      console.error('Failed to mark notification as read:', err)
    }
  }

  const handleMarkAllRead = async (e) => {
    e.stopPropagation()
    try {
      const token = localStorage.getItem('token')
      await axios.put('/api/notifications/read-all', {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      fetchNotifications()
    } catch (err) {
      console.error('Failed to mark all as read:', err)
    }
  }

  const getTypeIcon = (type) => {
    switch (type) {
      case 'DISPOSAL_SUBMITTED':
        return 'bi-file-earmark-plus-fill text-primary'
      case 'RECOMMENDATION_GENERATED':
        return 'bi-cpu-fill text-info'
      case 'REQUEST_APPROVED':
        return 'bi-check-circle-fill text-success'
      case 'PICKUP_ASSIGNED':
        return 'bi-person-badge-fill text-warning'
      case 'COLLECTOR_ON_THE_WAY':
        return 'bi-truck text-primary'
      case 'ITEM_COLLECTED':
        return 'bi-box-seam-fill text-success'
      case 'ITEM_REACHES_RECYCLER':
        return 'bi-building-fill-check text-info'
      case 'PROCESSING_BEGINS':
        return 'bi-gear-wide-connected text-warning'
      case 'PROCESSING_COMPLETED':
        return 'bi-patch-check-fill text-success'
      case 'GREEN_POINTS_CREDITED':
        return 'bi-star-fill text-warning'
      case 'CERTIFICATE_GENERATED':
        return 'bi-award-fill text-success'
      default:
        return 'bi-bell-fill text-secondary'
    }
  }

  return (
    <div className="position-relative d-inline-block" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn btn-dark-custom position-relative p-2 rounded-circle"
        title="Notifications"
        style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <i className="bi bi-bell-fill text-light fs-5"></i>
        {unreadCount > 0 && (
          <span
            className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger shadow-sm"
            style={{ fontSize: '0.7rem' }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className="position-absolute end-0 mt-2 shadow-lg rounded-3 bg-dark border border-secondary p-0"
          style={{ width: '360px', zIndex: 1050, maxHeight: '480px', overflowY: 'auto' }}
        >
          <div className="p-3 border-bottom border-secondary d-flex justify-content-between align-items-center bg-secondary bg-opacity-10">
            <div className="d-flex align-items-center gap-2">
              <i className="bi bi-bell text-emerald"></i>
              <strong className="text-white">Notifications</strong>
              {unreadCount > 0 && (
                <span className="badge bg-danger-subtle text-danger border border-danger-subtle rounded-pill">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="btn btn-link text-emerald p-0 text-decoration-none small-text"
                style={{ fontSize: '0.8rem' }}
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-muted">
                <i className="bi bi-bell-slash fs-3 d-block mb-2 text-secondary opacity-50"></i>
                <p className="mb-0 small">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-3 border-bottom border-secondary border-opacity-50 d-flex gap-3 align-items-start transition-all ${
                    !n.read ? 'bg-secondary bg-opacity-25' : 'opacity-75'
                  }`}
                  style={{ cursor: 'default' }}
                >
                  <div className="fs-5 mt-1">
                    <i className={`bi ${getTypeIcon(n.type)}`}></i>
                  </div>
                  <div className="flex-grow-1">
                    <div className="d-flex justify-content-between align-items-baseline mb-1">
                      <h6 className="mb-0 text-white small fw-semibold">{n.title}</h6>
                      {!n.read && (
                        <button
                          onClick={(e) => handleMarkOneRead(n.id, e)}
                          className="btn btn-sm btn-link text-emerald p-0 text-decoration-none ms-2"
                          title="Mark as read"
                          style={{ fontSize: '0.75rem' }}
                        >
                          Mark read
                        </button>
                      )}
                    </div>
                    <p className="mb-1 text-secondary small" style={{ fontSize: '0.82rem', lineHeight: '1.3' }}>
                      {n.message}
                    </p>
                    <span className="text-muted" style={{ fontSize: '0.7rem' }}>
                      {n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
