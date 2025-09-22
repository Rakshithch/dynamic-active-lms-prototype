import React, { useState, useEffect, createContext, useContext } from 'react'

// Mobile detection and responsive utilities
export const useResponsive = () => {
  const [screenSize, setScreenSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768
  })

  useEffect(() => {
    const handleResize = () => {
      setScreenSize({
        width: window.innerWidth,
        height: window.innerHeight
      })
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const isMobile = screenSize.width <= 768
  const isTablet = screenSize.width > 768 && screenSize.width <= 1024
  const isDesktop = screenSize.width > 1024
  const isSmall = screenSize.width <= 480

  return {
    screenSize,
    isMobile,
    isTablet,
    isDesktop,
    isSmall,
    orientation: screenSize.width > screenSize.height ? 'landscape' : 'portrait'
  }
}

// Touch gesture hook
export const useTouch = (onSwipeLeft, onSwipeRight, threshold = 50) => {
  const [touchStart, setTouchStart] = useState(null)
  const [touchEnd, setTouchEnd] = useState(null)

  const handleTouchStart = (e) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > threshold
    const isRightSwipe = distance < -threshold

    if (isLeftSwipe && onSwipeLeft) {
      onSwipeLeft()
    }
    if (isRightSwipe && onSwipeRight) {
      onSwipeRight()
    }
  }

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd
  }
}

// Mobile-friendly modal component
export function MobileModal({ isOpen, onClose, title, children, fullScreen = false }) {
  const { isMobile } = useResponsive()

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  const modalClass = isMobile 
    ? `mobile-modal ${fullScreen ? 'mobile-modal--fullscreen' : 'mobile-modal--bottom'}`
    : 'modal-overlay'

  return (
    <div className={modalClass} onClick={onClose}>
      <div 
        className={isMobile ? 'mobile-modal__content' : 'modal-content'} 
        onClick={(e) => e.stopPropagation()}
      >
        {isMobile && (
          <div className="mobile-modal__header">
            <div className="mobile-modal__handle" />
            <h3 className="mobile-modal__title">{title}</h3>
            <button className="mobile-modal__close" onClick={onClose}>
              ✕
            </button>
          </div>
        )}
        <div className="mobile-modal__body">
          {children}
        </div>
      </div>
    </div>
  )
}

// Mobile-friendly drawer/sidebar
export function MobileDrawer({ isOpen, onClose, children, position = 'left' }) {
  const { isMobile } = useResponsive()
  
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="mobile-drawer-overlay" onClick={onClose}>
      <div 
        className={`mobile-drawer mobile-drawer--${position}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mobile-drawer__content">
          {children}
        </div>
      </div>
    </div>
  )
}

// Mobile-optimized button component
export function MobileButton({ 
  children, 
  onClick, 
  variant = 'primary', 
  size = 'medium',
  fullWidth = false,
  loading = false,
  disabled = false,
  icon,
  ...props 
}) {
  const { isMobile } = useResponsive()
  
  const buttonClass = [
    'mobile-btn',
    `mobile-btn--${variant}`,
    `mobile-btn--${size}`,
    fullWidth && 'mobile-btn--full-width',
    loading && 'mobile-btn--loading',
    disabled && 'mobile-btn--disabled',
    isMobile && 'mobile-btn--touch'
  ].filter(Boolean).join(' ')

  return (
    <button 
      className={buttonClass}
      onClick={onClick}
      disabled={disabled || loading}
      {...props}
    >
      {icon && <span className="mobile-btn__icon">{icon}</span>}
      <span className="mobile-btn__text">{children}</span>
      {loading && <div className="mobile-btn__spinner" />}
    </button>
  )
}

// Mobile-friendly card component
export function MobileCard({ children, title, subtitle, actions, padding = 'normal' }) {
  const { isMobile } = useResponsive()

  return (
    <div className={`mobile-card ${isMobile ? 'mobile-card--mobile' : ''} mobile-card--${padding}`}>
      {(title || subtitle || actions) && (
        <div className="mobile-card__header">
          <div className="mobile-card__title-section">
            {title && <h3 className="mobile-card__title">{title}</h3>}
            {subtitle && <p className="mobile-card__subtitle">{subtitle}</p>}
          </div>
          {actions && (
            <div className="mobile-card__actions">
              {actions}
            </div>
          )}
        </div>
      )}
      <div className="mobile-card__content">
        {children}
      </div>
    </div>
  )
}

// Mobile navigation component
export function MobileNav({ items, activeItem, onItemClick }) {
  const { isMobile } = useResponsive()

  if (!isMobile) {
    return (
      <nav className="desktop-nav">
        {items.map(item => (
          <button
            key={item.id}
            className={`desktop-nav__item ${activeItem === item.id ? 'desktop-nav__item--active' : ''}`}
            onClick={() => onItemClick(item.id)}
          >
            {item.icon && <span className="desktop-nav__icon">{item.icon}</span>}
            {item.label}
          </button>
        ))}
      </nav>
    )
  }

  return (
    <nav className="mobile-nav">
      {items.map(item => (
        <button
          key={item.id}
          className={`mobile-nav__item ${activeItem === item.id ? 'mobile-nav__item--active' : ''}`}
          onClick={() => onItemClick(item.id)}
        >
          <span className="mobile-nav__icon">{item.icon}</span>
          <span className="mobile-nav__label">{item.label}</span>
        </button>
      ))}
    </nav>
  )
}

// Swipeable tabs component
export function SwipeableTabs({ tabs, activeTab, onTabChange, children }) {
  const { isMobile } = useResponsive()
  const touchProps = useTouch(
    () => {
      // Swipe left - next tab
      const currentIndex = tabs.findIndex(tab => tab.id === activeTab)
      const nextIndex = Math.min(currentIndex + 1, tabs.length - 1)
      if (nextIndex !== currentIndex) {
        onTabChange(tabs[nextIndex].id)
      }
    },
    () => {
      // Swipe right - previous tab
      const currentIndex = tabs.findIndex(tab => tab.id === activeTab)
      const prevIndex = Math.max(currentIndex - 1, 0)
      if (prevIndex !== currentIndex) {
        onTabChange(tabs[prevIndex].id)
      }
    }
  )

  return (
    <div className="swipeable-tabs">
      <div className="swipeable-tabs__header">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`swipeable-tabs__tab ${activeTab === tab.id ? 'swipeable-tabs__tab--active' : ''}`}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.icon && <span className="swipeable-tabs__icon">{tab.icon}</span>}
            <span className="swipeable-tabs__label">{tab.label}</span>
          </button>
        ))}
      </div>
      
      <div 
        className="swipeable-tabs__content"
        {...(isMobile ? touchProps : {})}
      >
        {children}
      </div>
    </div>
  )
}

// Pull-to-refresh component
export function PullToRefresh({ onRefresh, children }) {
  const [pulling, setPulling] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const [refreshing, setRefreshing] = useState(false)

  const handleTouchStart = (e) => {
    if (window.scrollY === 0) {
      setPulling(true)
    }
  }

  const handleTouchMove = (e) => {
    if (pulling && window.scrollY === 0) {
      const touch = e.touches[0]
      const distance = Math.max(0, Math.min(touch.clientY - 60, 100))
      setPullDistance(distance)
    }
  }

  const handleTouchEnd = async () => {
    if (pullDistance > 60) {
      setRefreshing(true)
      try {
        await onRefresh()
      } finally {
        setRefreshing(false)
      }
    }
    setPulling(false)
    setPullDistance(0)
  }

  return (
    <div 
      className="pull-to-refresh"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div 
        className={`pull-to-refresh__indicator ${pulling || refreshing ? 'pull-to-refresh__indicator--visible' : ''}`}
        style={{ transform: `translateY(${pullDistance}px)` }}
      >
        <div className={`pull-to-refresh__spinner ${refreshing ? 'pull-to-refresh__spinner--spinning' : ''}`}>
          🔄
        </div>
        <span className="pull-to-refresh__text">
          {refreshing ? 'Refreshing...' : 'Pull to refresh'}
        </span>
      </div>
      {children}
    </div>
  )
}
