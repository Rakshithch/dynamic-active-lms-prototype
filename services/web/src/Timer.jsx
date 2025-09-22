import React, { useState, useEffect, useCallback } from 'react'
import { useToast } from './Toast.jsx'

export default function Timer({ 
  duration, 
  onTimeUp, 
  onWarning, 
  warningThreshold = 300, // 5 minutes warning
  autoSubmit = true,
  showMilliseconds = false,
  size = 'medium' // 'small', 'medium', 'large'
}) {
  const [timeLeft, setTimeLeft] = useState(duration)
  const [isActive, setIsActive] = useState(true)
  const [hasWarned, setHasWarned] = useState(false)
  const toast = useToast()

  const formatTime = useCallback((seconds) => {
    if (seconds <= 0) return '00:00:00'
    
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    const ms = Math.floor((seconds % 1) * 100)
    
    if (showMilliseconds && seconds < 60) {
      return `${secs.toString().padStart(2, '0')}:${ms.toString().padStart(2, '0')}`
    }
    
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }, [showMilliseconds])

  const getProgressPercentage = useCallback(() => {
    return ((duration - timeLeft) / duration) * 100
  }, [duration, timeLeft])

  const getTimerStatus = useCallback(() => {
    if (timeLeft <= 0) return 'expired'
    if (timeLeft <= 60) return 'critical' // Last minute
    if (timeLeft <= warningThreshold) return 'warning'
    return 'normal'
  }, [timeLeft, warningThreshold])

  useEffect(() => {
    if (!isActive || timeLeft <= 0) return

    const interval = setInterval(() => {
      setTimeLeft((prevTime) => {
        const newTime = prevTime - 1
        
        // Warning notification
        if (newTime <= warningThreshold && !hasWarned) {
          setHasWarned(true)
          toast.warning(`⏰ ${Math.floor(warningThreshold / 60)} minutes remaining!`)
          onWarning?.()
        }
        
        // Critical time notifications
        if (newTime === 60) {
          toast.error('⚠️ 1 minute remaining!')
        } else if (newTime === 30) {
          toast.error('🚨 30 seconds remaining!')
        } else if (newTime === 10) {
          toast.error('🚨 10 seconds remaining!')
        }
        
        // Time's up
        if (newTime <= 0) {
          setIsActive(false)
          toast.error('⏰ Time\'s up! Quiz submitted automatically.')
          onTimeUp?.()
          return 0
        }
        
        return newTime
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isActive, timeLeft, warningThreshold, hasWarned, onTimeUp, onWarning, toast])

  const pauseTimer = () => {
    setIsActive(false)
    toast.info('Timer paused')
  }

  const resumeTimer = () => {
    setIsActive(true)
    toast.info('Timer resumed')
  }

  const addTime = (seconds) => {
    setTimeLeft(prev => prev + seconds)
    toast.success(`Added ${seconds} seconds to timer`)
  }

  const status = getTimerStatus()
  
  return (
    <div className={`timer timer--${size} timer--${status}`}>
      <div className="timer__display">
        <div className="timer__icon">
          {status === 'expired' ? '⏰' : 
           status === 'critical' ? '🚨' : 
           status === 'warning' ? '⚠️' : '⏱️'}
        </div>
        <div className="timer__time">
          {formatTime(timeLeft)}
        </div>
        {timeLeft > 0 && (
          <div className="timer__label">
            {status === 'critical' ? 'CRITICAL' :
             status === 'warning' ? 'Warning' : 'Time Left'}
          </div>
        )}
      </div>
      
      <div className="timer__progress">
        <div 
          className="timer__progress-bar"
          style={{ width: `${getProgressPercentage()}%` }}
        />
      </div>
      
      {process.env.NODE_ENV === 'development' && (
        <div className="timer__debug">
          <button onClick={pauseTimer} disabled={!isActive}>⏸️</button>
          <button onClick={resumeTimer} disabled={isActive}>▶️</button>
          <button onClick={() => addTime(60)}>+1m</button>
          <button onClick={() => addTime(-30)}>-30s</button>
        </div>
      )}
    </div>
  )
}

// Compact timer for minimal display
export function CompactTimer({ duration, onTimeUp, className }) {
  const [timeLeft, setTimeLeft] = useState(duration)
  
  useEffect(() => {
    if (timeLeft <= 0) {
      onTimeUp?.()
      return
    }

    const interval = setInterval(() => {
      setTimeLeft(prev => prev - 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [timeLeft, onTimeUp])

  const formatCompactTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getCompactStatus = () => {
    if (timeLeft <= 0) return 'expired'
    if (timeLeft <= 60) return 'critical'
    if (timeLeft <= 300) return 'warning'
    return 'normal'
  }

  return (
    <div className={`compact-timer compact-timer--${getCompactStatus()} ${className || ''}`}>
      <span className="compact-timer__icon">
        {timeLeft <= 0 ? '⏰' : timeLeft <= 60 ? '🚨' : '⏱️'}
      </span>
      <span className="compact-timer__time">
        {formatCompactTime(Math.max(0, timeLeft))}
      </span>
    </div>
  )
}
