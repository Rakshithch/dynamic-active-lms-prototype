import React, { useState, useEffect } from 'react'
import { BarChart, ProgressRing, LineChart, PieChart, MetricCard, Heatmap } from './Charts.jsx'
import { useToast } from './Toast.jsx'
import { FadeIn, SlideUp, LoadingWithText } from './Loading.jsx'

export default function TeacherAnalytics({ teacherId }) {
  const [analyticsData, setAnalyticsData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [timeRange, setTimeRange] = useState('30') // days
  const toast = useToast()

  useEffect(() => {
    fetchAnalyticsData()
  }, [timeRange])

  const fetchAnalyticsData = async () => {
    setLoading(true)
    try {
      // Simulate API call - in real app, this would fetch from your analytics endpoint
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Mock data - replace with actual API call
      setAnalyticsData(generateMockAnalyticsData())
    } catch (err) {
      setError(err.message)
      toast.error('Failed to load analytics data')
    } finally {
      setLoading(false)
    }
  }

  const generateMockAnalyticsData = () => {
    return {
      overview: {
        totalStudents: 127,
        totalAssignments: 24,
        completionRate: 85.2,
        averageScore: 78.5,
        activeStudents: 98,
        pendingGrading: 12
      },
      trends: {
        submissionTrend: [
          { label: 'Week 1', value: 45 },
          { label: 'Week 2', value: 52 },
          { label: 'Week 3', value: 38 },
          { label: 'Week 4', value: 67 },
          { label: 'Week 5', value: 72 },
          { label: 'Week 6', value: 59 },
          { label: 'Week 7', value: 83 }
        ],
        scoreTrend: [
          { label: 'Week 1', value: 72 },
          { label: 'Week 2', value: 75 },
          { label: 'Week 3', value: 69 },
          { label: 'Week 4', value: 78 },
          { label: 'Week 5', value: 81 },
          { label: 'Week 6', value: 77 },
          { label: 'Week 7', value: 79 }
        ]
      },
      performance: {
        scoreDistribution: [
          { label: 'A (90-100%)', value: 23 },
          { label: 'B (80-89%)', value: 31 },
          { label: 'C (70-79%)', value: 28 },
          { label: 'D (60-69%)', value: 15 },
          { label: 'F (0-59%)', value: 8 }
        ],
        subjectPerformance: [
          { label: 'Math', value: 82 },
          { label: 'Science', value: 75 },
          { label: 'English', value: 78 },
          { label: 'History', value: 71 }
        ]
      },
      engagement: {
        completionRates: [
          { label: 'Class A', value: 95 },
          { label: 'Class B', value: 87 },
          { label: 'Class C', value: 82 },
          { label: 'Class D', value: 78 }
        ],
        activityHeatmap: {
          'Mon-8': 12, 'Mon-9': 25, 'Mon-10': 18, 'Mon-11': 22, 'Mon-14': 35, 'Mon-15': 28,
          'Tue-8': 15, 'Tue-9': 32, 'Tue-10': 24, 'Tue-11': 19, 'Tue-14': 41, 'Tue-15': 33,
          'Wed-8': 18, 'Wed-9': 28, 'Wed-10': 31, 'Wed-11': 25, 'Wed-14': 38, 'Wed-15': 29,
          'Thu-8': 22, 'Thu-9': 35, 'Thu-10': 27, 'Thu-11': 20, 'Thu-14': 42, 'Thu-15': 31,
          'Fri-8': 14, 'Fri-9': 21, 'Fri-10': 16, 'Fri-11': 18, 'Fri-14': 25, 'Fri-15': 19
        }
      },
      insights: [
        {
          type: 'success',
          icon: '📈',
          title: 'Improved Performance',
          description: 'Class average has increased by 12% over the last month'
        },
        {
          type: 'warning',
          icon: '⚠️',
          title: 'Low Completion Rate',
          description: '5 students have completion rates below 60%'
        },
        {
          type: 'info',
          icon: '💡',
          title: 'Peak Activity',
          description: 'Most student activity occurs between 2-3 PM'
        },
        {
          type: 'success',
          icon: '🎯',
          title: 'Subject Excellence',
          description: 'Math assignments show consistently high scores'
        }
      ]
    }
  }

  if (loading) {
    return <LoadingWithText text="Loading Analytics..." subtext="Analyzing student performance data" />
  }

  if (error) {
    return (
      <div className="error-container">
        <h3>Failed to Load Analytics</h3>
        <p>{error}</p>
        <button className="btn btn-primary" onClick={fetchAnalyticsData}>
          Retry
        </button>
      </div>
    )
  }

  const { overview, trends, performance, engagement, insights } = analyticsData

  return (
    <div className="analytics-dashboard">
      <FadeIn>
        <div className="analytics-header">
          <h2>📊 Teacher Analytics Dashboard</h2>
          <div className="analytics-controls">
            <select 
              value={timeRange} 
              onChange={(e) => setTimeRange(e.target.value)}
              className="input"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 3 months</option>
              <option value="365">Last year</option>
            </select>
          </div>
        </div>
      </FadeIn>

      {/* Key Metrics Overview */}
      <SlideUp delay={100}>
        <section className="analytics-section">
          <h3>📋 Overview</h3>
          <div className="metrics-grid">
            <MetricCard
              title="Total Students"
              value={overview.totalStudents}
              change={8.2}
              changeType="positive"
              icon="👥"
              color="#3b82f6"
            />
            <MetricCard
              title="Assignments Created"
              value={overview.totalAssignments}
              change={15.3}
              changeType="positive"
              icon="📝"
              color="#10b981"
            />
            <MetricCard
              title="Completion Rate"
              value={`${overview.completionRate}%`}
              change={-2.1}
              changeType="negative"
              icon="✅"
              color="#f59e0b"
            />
            <MetricCard
              title="Average Score"
              value={`${overview.averageScore}%`}
              change={5.7}
              changeType="positive"
              icon="🎯"
              color="#8b5cf6"
            />
            <MetricCard
              title="Active Students"
              value={overview.activeStudents}
              change={3.2}
              changeType="positive"
              icon="🔥"
              color="#ef4444"
            />
            <MetricCard
              title="Pending Grading"
              value={overview.pendingGrading}
              icon="⏳"
              color="#6b7280"
            />
          </div>
        </section>
      </SlideUp>

      {/* Performance Charts */}
      <SlideUp delay={200}>
        <section className="analytics-section">
          <h3>📈 Performance Trends</h3>
          <div className="charts-grid charts-grid--2col">
            <div className="chart-card">
              <LineChart
                data={trends.submissionTrend}
                title="Weekly Submissions"
                color="#3b82f6"
                height={250}
              />
            </div>
            <div className="chart-card">
              <LineChart
                data={trends.scoreTrend}
                title="Average Score Trend"
                color="#10b981"
                height={250}
              />
            </div>
          </div>
        </section>
      </SlideUp>

      {/* Score Distribution & Subject Performance */}
      <SlideUp delay={300}>
        <section className="analytics-section">
          <h3>🎯 Performance Analysis</h3>
          <div className="charts-grid charts-grid--2col">
            <div className="chart-card">
              <PieChart
                data={performance.scoreDistribution}
                title="Grade Distribution"
                size={280}
              />
            </div>
            <div className="chart-card">
              <BarChart
                data={performance.subjectPerformance}
                title="Average Score by Subject"
                color={['#3b82f6', '#10b981', '#f59e0b', '#ef4444']}
                height={250}
              />
            </div>
          </div>
        </section>
      </SlideUp>

      {/* Engagement Analytics */}
      <SlideUp delay={400}>
        <section className="analytics-section">
          <h3>🔥 Student Engagement</h3>
          <div className="charts-grid charts-grid--2col">
            <div className="chart-card">
              <div className="completion-rings">
                <h4 className="chart-title">Class Completion Rates</h4>
                <div className="rings-grid">
                  {engagement.completionRates.map((item, index) => (
                    <div key={index} className="ring-item">
                      <ProgressRing
                        percentage={item.value}
                        size={100}
                        color={item.value >= 90 ? '#10b981' : item.value >= 80 ? '#f59e0b' : '#ef4444'}
                      />
                      <div className="ring-label">{item.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="chart-card">
              <Heatmap
                data={engagement.activityHeatmap}
                title="Weekly Activity Pattern"
              />
            </div>
          </div>
        </section>
      </SlideUp>

      {/* AI Insights */}
      <SlideUp delay={500}>
        <section className="analytics-section">
          <h3>🤖 AI-Powered Insights</h3>
          <div className="insights-grid">
            {insights.map((insight, index) => (
              <div key={index} className={`insight-card insight-card--${insight.type}`}>
                <div className="insight-card__icon">{insight.icon}</div>
                <div className="insight-card__content">
                  <h4 className="insight-card__title">{insight.title}</h4>
                  <p className="insight-card__description">{insight.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </SlideUp>

      {/* Quick Actions */}
      <SlideUp delay={600}>
        <section className="analytics-section">
          <h3>⚡ Quick Actions</h3>
          <div className="quick-actions">
            <button className="btn btn-primary">
              📊 Export Analytics Report
            </button>
            <button className="btn btn-secondary">
              📧 Email Class Summary
            </button>
            <button className="btn btn-secondary">
              🎯 View Individual Progress
            </button>
            <button className="btn btn-secondary">
              📈 Schedule Parent Conference
            </button>
          </div>
        </section>
      </SlideUp>
    </div>
  )
}
