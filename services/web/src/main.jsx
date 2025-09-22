// services/web/src/main.jsx
import './styles.css'
import React, { useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import ErrorBoundary from './ErrorBoundary.jsx'
import { ThemeProvider } from './ThemeContext.jsx'
import { ToastProvider, useToast } from './Toast.jsx'
import { getCurrentUser, logout, login } from './api.js'
// import Login from './Login.jsx' // Original has FormValidation issues
// import WorkingLogin from './WorkingLogin.jsx' // Testing for issues

// Working Login component with form validation (simplified but beautiful)
function WorkingLogin({ onLogin, loading }) {
  const [email, setEmail] = useState('student.demo@example.com')
  const [password, setPassword] = useState('password123')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState({})
  const toast = useToast()

  const validateForm = () => {
    const newErrors = {}
    
    if (!email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address'
    }
    
    if (!password) {
      newErrors.password = 'Password is required'
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      if (toast) {
        toast.error('Please fix the validation errors')
      }
      return
    }
    
    setIsSubmitting(true)
    
    try {
      await onLogin(email, password)
      // Success message is handled in MainApp
    } catch (error) {
      if (toast) {
        toast.error(`Login failed: ${error.message}`)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Dynamic Active LMS</h2>
        <p className="subtitle">Sign in to continue</p>
        
        <form onSubmit={handleSubmit}>
          <div className={`form-field ${errors.email ? 'form-field--error' : ''}`}>
            <label className="form-field__label">
              Email Address
              <span className="form-field__required">*</span>
            </label>
            <input
              type="email"
              className={`form-field__input ${errors.email ? 'input--error' : ''}`}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (errors.email) {
                  setErrors(prev => ({ ...prev, email: null }))
                }
              }}
              placeholder="Enter your email"
              required
            />
            {errors.email && (
              <div className="validation-message validation-message--error">
                <span className="validation-message__icon">⚠️</span>
                <span className="validation-message__text">{errors.email}</span>
              </div>
            )}
          </div>
          
          <div className={`form-field ${errors.password ? 'form-field--error' : ''}`}>
            <label className="form-field__label">
              Password
              <span className="form-field__required">*</span>
            </label>
            <input
              type="password"
              className={`form-field__input ${errors.password ? 'input--error' : ''}`}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                if (errors.password) {
                  setErrors(prev => ({ ...prev, password: null }))
                }
              }}
              placeholder="Enter your password"
              required
            />
            {errors.password && (
              <div className="validation-message validation-message--error">
                <span className="validation-message__icon">⚠️</span>
                <span className="validation-message__text">{errors.password}</span>
              </div>
            )}
          </div>
          
          <button 
            type="submit" 
            className="btn btn-primary btn--form-submit"
            disabled={isSubmitting || loading}
          >
            {isSubmitting || loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        
        <div className="demo-logins">
          <p className="demo-title">Demo Accounts:</p>
          <div className="demo-buttons">
            <button 
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setEmail('student.demo@example.com')
                setPassword('password123')
                setErrors({})
              }}
            >
              Student (Demo Student)
            </button>
            <button 
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setEmail('teacher.demo@example.com')
                setPassword('password123')
                setErrors({})
              }}
            >
              Teacher (Demo Teacher)
            </button>
          </div>
          <p className="demo-note">Password: password123</p>
        </div>
      </div>
    </div>
  )
}
import Teacher from './Teacher.jsx' // Fixed JSX syntax errors!
import { getStudentDashboard, getQuiz, submitQuiz } from './api.js'
import { LoadingWithText, FadeIn, SlideUp, DashboardSkeleton, QuestionSkeleton } from './Loading.jsx'
import Timer from './Timer.jsx'


// Student Dashboard Component
function StudentDashboard({ onStartQuiz }) {
  const [data, setData] = useState(null)
  const [err, setErr] = useState('')
  const toast = useToast()

  useEffect(() => {
    getStudentDashboard()
      .then(data => {
        setData(data)
        if (data.recommendation) {
          toast.info(data.recommendation.reason)
        }
      })
      .catch(e => {
        setErr(e.message)
        toast.error(`Failed to load dashboard: ${e.message}`)
      })
  }, [])

  if (err) return (
    <FadeIn>
      <div className="error-container">
        <h3>❌ Oops! Something went wrong</h3>
        <p>{err}</p>
        <button className="btn btn-primary" onClick={() => window.location.reload()}>
          Try Again
        </button>
      </div>
    </FadeIn>
  )
  
  if (!data) return (
    <DashboardSkeleton />
  )

  const firstDue = data.due_assignments?.[0]

  return (
    <FadeIn>
      <div className="card">
        <SlideUp delay={100}>
          <h2>Hi, {data.student.name} 👋</h2>
          <p><strong>Recommendation:</strong> {data.recommendation?.reason}</p>
        </SlideUp>

        <SlideUp delay={200}>
          <h3>Due Assignments</h3>
          {firstDue ? (
            <div className="card">
              <p><b>{firstDue.title}</b> — due {new Date(firstDue.due_at).toLocaleString()}</p>
              <button className="btn" onClick={() => onStartQuiz(firstDue.id)}>Start Quiz</button>
            </div>
          ) : (
            <div className="card">
              <p>🎉 Great job! No assignments due right now.</p>
            </div>
          )}
        </SlideUp>
      </div>
    </FadeIn>
  )
}

// Quiz Player Component
function QuizPlayer({ assignmentId, onDone }) {
  const [quiz, setQuiz] = useState(null)
  const [answers, setAnswers] = useState({})
  const [result, setResult] = useState(null)
  const [err, setErr] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const toast = useToast()

  useEffect(() => {
    getQuiz(assignmentId)
      .then(quiz => {
        setQuiz(quiz)
        toast.info(`Quiz loaded: ${quiz.assignment.title}`)
      })
      .catch(e => {
        setErr(e.message)
        toast.error(`Failed to load quiz: ${e.message}`)
      })
  }, [assignmentId])

  if (err) return (
    <FadeIn>
      <div className="error-container">
        <h3>❌ Failed to load quiz</h3>
        <p>{err}</p>
        <button className="btn btn-primary" onClick={onDone}>Back to Dashboard</button>
      </div>
    </FadeIn>
  )
  
  if (!quiz) return (
    <LoadingWithText 
      text="Loading Quiz..." 
      subtext="Preparing your questions" 
    />
  )

  if (result) {
    return (
      <FadeIn>
        <div className="card">
          <SlideUp>
            <div className="quiz-result">
              <h3>🎉 Quiz Complete!</h3>
              <div className="score-display">
                <span className="score-label">Your Score:</span>
                <span className="score-value">{result.score_pct}%</span>
              </div>
            </div>
          </SlideUp>
          
          <SlideUp delay={200}>
            <div className="feedback-section">
              <h4>Detailed Feedback</h4>
              <ul className="feedback-list">
                {result.responses.map((r, index) => (
                  <SlideUp key={r.id} delay={300 + index * 100}>
                    <li className="feedback-item">
                      <span className="question-number">Q{r.question_id}:</span>
                      <span className="feedback-text">{r.feedback}</span>
                      <span className="score-badge">{Math.round(Number(r.score)*100)}%</span>
                    </li>
                  </SlideUp>
                ))}
              </ul>
            </div>
          </SlideUp>
          
          <SlideUp delay={400}>
            <button className="btn btn-primary" onClick={onDone}>Back to Dashboard</button>
          </SlideUp>
        </div>
      </FadeIn>
    )
  }

  const onChange = (qid, val) => setAnswers(a => ({ ...a, [qid]: val }))

  const submit = async () => {
    const payload = {
      assignment_id: assignmentId,
      answers: quiz.questions.map(q => ({ question_id: q.id, answer: answers[q.id] || '' }))
    }
    
    setSubmitting(true)
    setErr('')
    
    try {
      const r = await submitQuiz(payload)
      setResult(r)
      toast.success(`Quiz submitted successfully! Score: ${r.score_pct}% 🎉`)
    } catch (e) {
      setErr(e.message)
      toast.error(`Failed to submit quiz: ${e.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  const handleTimeUp = () => {
    if (!result && !submitting) {
      toast.warning('⏰ Time\'s up! Submitting your current answers...')
      submit()
    }
  }

  const hasTimeLimit = quiz.assignment.time_limit_minutes && quiz.assignment.time_limit_minutes > 0
  const timeInSeconds = hasTimeLimit ? quiz.assignment.time_limit_minutes * 60 : null

  return (
    <FadeIn>
      <div className="card">
        <SlideUp>
          <div className="quiz-header">
            <h3>{quiz.assignment.title} — Quiz</h3>
            {hasTimeLimit && (
              <Timer 
                duration={timeInSeconds}
                onTimeUp={handleTimeUp}
                onWarning={() => toast.warning('⚠️ 5 minutes remaining!')}
                size="medium"
              />
            )}
          </div>
        </SlideUp>
        
        {quiz.questions.map((q, index) => (
          <SlideUp key={q.id} delay={100 + index * 150}>
            <div className="quiz-question" style={{marginBottom:16}}>
              <p><b>Q{q.id}.</b> {q.prompt}</p>
              {q.type === 'mcq' ? (
                <div className="mcq-options">
                  {q.options.map(opt => (
                    <label key={opt} className="mcq-option">
                      <input
                        type="radio"
                        name={`q-${q.id}`}
                        value={opt}
                        onChange={(e) => onChange(q.id, e.target.value)}
                      />
                      <span className="option-text">{opt}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <textarea
                  rows={3}
                  className="input"
                  onChange={(e) => onChange(q.id, e.target.value)}
                  placeholder="Type your answer…"
                />
              )}
            </div>
          </SlideUp>
        ))}
        
        <SlideUp delay={300 + quiz.questions.length * 150}>
          <button 
            className={`btn btn-primary ${
              submitting ? 'btn--loading' : ''
            }`}
            onClick={submit}
            disabled={submitting}
          >
            {submitting ? 'Submitting...' : 'Submit Quiz'}
          </button>
          
          {submitting && (
            <p className="loading-subtext">AI is grading your answers...</p>
          )}
        </SlideUp>
      </div>
    </FadeIn>
  )
}

// Using the imported WorkingLogin component from WorkingLogin.jsx

// MainApp with authentication state management
function MainApp() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('dashboard')   // student views
  const [assignmentId, setAssignmentId] = useState(null)
  const toast = useToast()
  
  console.log('MainApp state:', { user, loading });

  // Check for existing session on app load
  useEffect(() => {
    const token = localStorage.getItem('authToken')
    console.log('Checking for existing token:', !!token)
    
    if (token) {
      getCurrentUser()
        .then(data => {
          setUser(data.user)
          console.log('User loaded from token:', data.user)
        })
        .catch(err => {
          console.error('Session check failed:', err)
          logout()
        })
        .finally(() => setLoading(false))
    } else {
      console.log('No token found, showing login')
      setLoading(false)
    }
  }, [])

  const handleLogin = async (email, password) => {
    setLoading(true)
    try {
      const data = await login(email, password)
      setUser(data.user)
      toast.success(`Welcome back, ${data.user.name}! 👋`)
    } catch (error) {
      toast.error(`Login failed: ${error.message}`)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    setUser(null)
    setView('dashboard')
    if (toast) {
      toast.info('You have been logged out successfully')
    }
  }

  if (loading) {
    return (
      <div className="app">
        <div className="loading-container">
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <WorkingLogin onLogin={handleLogin} loading={loading} />
  }

  return (
    <div className="app">
      <div className="row">
        <h1>Dynamic Active LMS</h1>
        <div className="user-info">
          {user ? (
            <>
              <span>Welcome, {user.name} ({user.role})</span>
              <button className="btn btn-secondary" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <span>No user logged in</span>
          )}
        </div>
      </div>
      
      {user.role === 'student' ? (
        view === 'dashboard' ? (
          <StudentDashboard onStartQuiz={(id)=>{ setAssignmentId(id); setView('quiz') }} />
        ) : (
          <QuizPlayer assignmentId={assignmentId} onDone={()=>setView('dashboard')} />
        )
      ) : (
        <div className="card">
          <Teacher />
        </div>
      )}
    </div>
  )
}

createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <ThemeProvider>
      <ToastProvider>
        <MainApp />
      </ToastProvider>
    </ThemeProvider>
  </ErrorBoundary>
)
