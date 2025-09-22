import React from 'react'

// Generic Loading Spinner
export function LoadingSpinner({ size = 'medium', color = 'primary' }) {
  return (
    <div className={`loading-spinner loading-spinner--${size} loading-spinner--${color}`}>
      <div className="loading-spinner__circle"></div>
    </div>
  )
}

// Skeleton Loading for Cards
export function CardSkeleton({ count = 1 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="skeleton-card">
          <div className="skeleton-header">
            <div className="skeleton-line skeleton-line--title"></div>
            <div className="skeleton-line skeleton-line--subtitle"></div>
          </div>
          <div className="skeleton-body">
            <div className="skeleton-line skeleton-line--text"></div>
            <div className="skeleton-line skeleton-line--text"></div>
            <div className="skeleton-line skeleton-line--text skeleton-line--short"></div>
          </div>
        </div>
      ))}
    </>
  )
}

// Loading for Dashboard
export function DashboardSkeleton() {
  return (
    <div className="dashboard-skeleton">
      <div className="skeleton-header">
        <div className="skeleton-line skeleton-line--large"></div>
        <div className="skeleton-line skeleton-line--medium"></div>
      </div>
      
      <div className="skeleton-cards">
        <CardSkeleton count={3} />
      </div>
      
      <div className="skeleton-chart">
        <div className="skeleton-line skeleton-line--title"></div>
        <div className="skeleton-chart-bars">
          {Array.from({ length: 5 }).map((_, i) => (
            <div 
              key={i} 
              className="skeleton-bar" 
              style={{ height: `${Math.random() * 60 + 20}%` }}
            ></div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Loading for Quiz Questions
export function QuestionSkeleton({ count = 3 }) {
  return (
    <div className="question-skeleton">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="skeleton-question">
          <div className="skeleton-question-header">
            <div className="skeleton-badge"></div>
            <div className="skeleton-line skeleton-line--question"></div>
          </div>
          <div className="skeleton-options">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton-option">
                <div className="skeleton-radio"></div>
                <div className="skeleton-line skeleton-line--option"></div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// Loading with Text
export function LoadingWithText({ text = 'Loading...', subtext = null }) {
  return (
    <div className="loading-with-text">
      <LoadingSpinner size="large" />
      <h3 className="loading-text">{text}</h3>
      {subtext && <p className="loading-subtext">{subtext}</p>}
    </div>
  )
}

// Fade In Animation Wrapper
export function FadeIn({ children, delay = 0 }) {
  return (
    <div 
      className="fade-in" 
      style={{ '--animation-delay': `${delay}ms` }}
    >
      {children}
    </div>
  )
}

// Slide Up Animation Wrapper
export function SlideUp({ children, delay = 0 }) {
  return (
    <div 
      className="slide-up" 
      style={{ '--animation-delay': `${delay}ms` }}
    >
      {children}
    </div>
  )
}
