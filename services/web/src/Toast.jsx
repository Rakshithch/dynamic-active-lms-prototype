import React, { useState, useEffect, createContext, useContext } from 'react'

// Toast Context
const ToastContext = createContext()

// Toast Provider Component
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = (message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random()
    const toast = {
      id,
      message,
      type, // 'success', 'error', 'warning', 'info'
      duration,
      createdAt: Date.now()
    }

    setToasts(prev => [...prev, toast])

    // Auto remove after duration
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, duration)
    }

    return id
  }

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  const clearAllToasts = () => {
    setToasts([])
  }

  return (
    <ToastContext.Provider value={{ 
      toasts, 
      addToast, 
      removeToast, 
      clearAllToasts,
      // Convenience methods
      success: (message, duration) => addToast(message, 'success', duration),
      error: (message, duration) => addToast(message, 'error', duration),
      warning: (message, duration) => addToast(message, 'warning', duration),
      info: (message, duration) => addToast(message, 'info', duration)
    }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  )
}

// Hook to use toast notifications
export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

// Individual Toast Component
function Toast({ toast, onRemove }) {
  const [isVisible, setIsVisible] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)

  useEffect(() => {
    // Trigger enter animation
    setTimeout(() => setIsVisible(true), 10)
  }, [])

  const handleRemove = () => {
    setIsLeaving(true)
    setTimeout(() => onRemove(toast.id), 300) // Match animation duration
  }

  // Auto-remove logic with pause on hover
  useEffect(() => {
    let timeoutId
    
    if (toast.duration > 0 && !isLeaving) {
      const remainingTime = toast.duration - (Date.now() - toast.createdAt)
      
      if (remainingTime > 0) {
        timeoutId = setTimeout(() => {
          handleRemove()
        }, remainingTime)
      }
    }

    return () => clearTimeout(timeoutId)
  }, [toast, isLeaving])

  const getIcon = () => {
    switch (toast.type) {
      case 'success': return '✅'
      case 'error': return '❌'
      case 'warning': return '⚠️'
      case 'info': return 'ℹ️'
      default: return 'ℹ️'
    }
  }

  return (
    <div 
      className={`toast toast--${toast.type} ${
        isVisible ? 'toast--visible' : ''
      } ${isLeaving ? 'toast--leaving' : ''}`}
      onMouseEnter={(e) => {
        // Pause auto-removal on hover
        e.currentTarget.style.animationPlayState = 'paused'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.animationPlayState = 'running'
      }}
    >
      <div className="toast__content">
        <span className="toast__icon">{getIcon()}</span>
        <span className="toast__message">{toast.message}</span>
      </div>
      
      <button 
        className="toast__close" 
        onClick={handleRemove}
        aria-label="Close notification"
      >
        ×
      </button>
      
      {toast.duration > 0 && (
        <div 
          className="toast__progress"
          style={{
            animationDuration: `${toast.duration}ms`
          }}
        />
      )}
    </div>
  )
}

// Toast Container Component
function ToastContainer() {
  const { toasts, removeToast } = useToast()

  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          toast={toast}
          onRemove={removeToast}
        />
      ))}
    </div>
  )
}

// Utility function for quick toasts
export const toast = {
  success: (message, duration = 4000) => {
    // This will be replaced when ToastProvider is mounted
    console.log('Success:', message)
  },
  error: (message, duration = 5000) => {
    console.log('Error:', message)
  },
  warning: (message, duration = 4500) => {
    console.log('Warning:', message)
  },
  info: (message, duration = 4000) => {
    console.log('Info:', message)
  }
}
