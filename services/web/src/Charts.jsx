import React from 'react'

// Simple Bar Chart Component
export function BarChart({ data, title, height = 200, color = '#3b82f6' }) {
  if (!data || data.length === 0) {
    return (
      <div className="chart-placeholder">
        <span>📊 No data available</span>
      </div>
    )
  }

  const maxValue = Math.max(...data.map(item => item.value))
  
  return (
    <div className="chart-container">
      {title && <h4 className="chart-title">{title}</h4>}
      <div className="bar-chart" style={{ height }}>
        {data.map((item, index) => (
          <div key={index} className="bar-item">
            <div className="bar-label">{item.label}</div>
            <div className="bar-wrapper">
              <div 
                className="bar"
                style={{ 
                  height: `${(item.value / maxValue) * 100}%`,
                  backgroundColor: Array.isArray(color) ? color[index % color.length] : color,
                  animationDelay: `${index * 0.1}s`
                }}
              />
              <div className="bar-value">{item.value}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Progress Ring Component (for completion rates)
export function ProgressRing({ percentage, size = 120, strokeWidth = 8, color = '#10b981' }) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <div className="progress-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="progress-ring__svg">
        {/* Background circle */}
        <circle
          className="progress-ring__background"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress circle */}
        <circle
          className="progress-ring__progress"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          fill="transparent"
          stroke={color}
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </svg>
      <div className="progress-ring__text">
        <span className="progress-ring__percentage">{Math.round(percentage)}%</span>
      </div>
    </div>
  )
}

// Line Chart Component (for trends)
export function LineChart({ data, title, height = 200, color = '#8b5cf6' }) {
  if (!data || data.length === 0) {
    return (
      <div className="chart-placeholder">
        <span>📈 No trend data available</span>
      </div>
    )
  }

  const maxValue = Math.max(...data.map(item => item.value))
  const minValue = Math.min(...data.map(item => item.value))
  const range = maxValue - minValue || 1
  
  const points = data.map((item, index) => {
    const x = (index / (data.length - 1)) * 100
    const y = 100 - ((item.value - minValue) / range * 100)
    return `${x},${y}`
  }).join(' ')

  return (
    <div className="chart-container">
      {title && <h4 className="chart-title">{title}</h4>}
      <div className="line-chart" style={{ height }}>
        <svg className="line-chart__svg" viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* Grid lines */}
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e5e7eb" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#grid)" opacity="0.3" />
          
          {/* Area under curve */}
          <path
            d={`M 0,100 L ${points} L 100,100 Z`}
            fill={color}
            opacity="0.1"
            className="line-chart__area"
          />
          
          {/* Main line */}
          <polyline
            points={points}
            fill="none"
            stroke={color}
            strokeWidth="2"
            className="line-chart__line"
          />
          
          {/* Data points */}
          {data.map((item, index) => {
            const x = (index / (data.length - 1)) * 100
            const y = 100 - ((item.value - minValue) / range * 100)
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="1.5"
                fill={color}
                className="line-chart__point"
              />
            )
          })}
        </svg>
        
        {/* Labels */}
        <div className="line-chart__labels">
          {data.map((item, index) => (
            <div key={index} className="line-chart__label" style={{ left: `${(index / (data.length - 1)) * 100}%` }}>
              {item.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Pie Chart Component
export function PieChart({ data, title, size = 200 }) {
  if (!data || data.length === 0) {
    return (
      <div className="chart-placeholder">
        <span>🍰 No data available</span>
      </div>
    )
  }

  const total = data.reduce((sum, item) => sum + item.value, 0)
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']
  
  let cumulativePercentage = 0
  const slices = data.map((item, index) => {
    const percentage = (item.value / total) * 100
    const startAngle = cumulativePercentage * 3.6 - 90
    const endAngle = (cumulativePercentage + percentage) * 3.6 - 90
    cumulativePercentage += percentage
    
    const startX = Math.cos(startAngle * Math.PI / 180) * (size / 2 - 10)
    const startY = Math.sin(startAngle * Math.PI / 180) * (size / 2 - 10)
    const endX = Math.cos(endAngle * Math.PI / 180) * (size / 2 - 10)
    const endY = Math.sin(endAngle * Math.PI / 180) * (size / 2 - 10)
    
    const largeArcFlag = percentage > 50 ? 1 : 0
    
    const pathData = [
      'M', size / 2, size / 2,
      'L', size / 2 + startX, size / 2 + startY,
      'A', size / 2 - 10, size / 2 - 10, 0, largeArcFlag, 1, size / 2 + endX, size / 2 + endY,
      'Z'
    ].join(' ')
    
    return {
      ...item,
      pathData,
      color: colors[index % colors.length],
      percentage: Math.round(percentage)
    }
  })

  return (
    <div className="chart-container">
      {title && <h4 className="chart-title">{title}</h4>}
      <div className="pie-chart">
        <svg width={size} height={size} className="pie-chart__svg">
          {slices.map((slice, index) => (
            <path
              key={index}
              d={slice.pathData}
              fill={slice.color}
              className="pie-chart__slice"
              style={{ animationDelay: `${index * 0.1}s` }}
            />
          ))}
        </svg>
        <div className="pie-chart__legend">
          {slices.map((slice, index) => (
            <div key={index} className="pie-chart__legend-item">
              <div 
                className="pie-chart__legend-color"
                style={{ backgroundColor: slice.color }}
              />
              <span className="pie-chart__legend-label">
                {slice.label} ({slice.percentage}%)
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Metric Card Component
export function MetricCard({ title, value, change, changeType, icon, color = '#3b82f6' }) {
  return (
    <div className={`metric-card metric-card--${changeType}`}>
      <div className="metric-card__header">
        <div className="metric-card__icon" style={{ backgroundColor: `${color}20`, color }}>
          {icon}
        </div>
        <div className="metric-card__title">{title}</div>
      </div>
      <div className="metric-card__value">{value}</div>
      {change !== undefined && (
        <div className={`metric-card__change metric-card__change--${changeType}`}>
          <span className="metric-card__change-icon">
            {changeType === 'positive' ? '↗️' : changeType === 'negative' ? '↘️' : '➡️'}
          </span>
          <span className="metric-card__change-value">{Math.abs(change)}%</span>
          <span className="metric-card__change-label">vs last period</span>
        </div>
      )}
    </div>
  )
}

// Heatmap Component (for activity patterns)
export function Heatmap({ data, title }) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const hours = Array.from({ length: 24 }, (_, i) => i)
  
  const maxValue = Math.max(...Object.values(data || {}))
  
  return (
    <div className="chart-container">
      {title && <h4 className="chart-title">{title}</h4>}
      <div className="heatmap">
        <div className="heatmap__hours">
          {hours.map(hour => (
            <div key={hour} className="heatmap__hour">{hour}</div>
          ))}
        </div>
        <div className="heatmap__grid">
          {days.map(day => (
            <div key={day} className="heatmap__row">
              <div className="heatmap__day">{day}</div>
              {hours.map(hour => {
                const key = `${day}-${hour}`
                const value = data?.[key] || 0
                const intensity = maxValue > 0 ? value / maxValue : 0
                return (
                  <div
                    key={hour}
                    className="heatmap__cell"
                    style={{
                      backgroundColor: `rgba(59, 130, 246, ${intensity})`,
                      opacity: intensity > 0 ? 1 : 0.1
                    }}
                    title={`${day} ${hour}:00 - ${value} activities`}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
