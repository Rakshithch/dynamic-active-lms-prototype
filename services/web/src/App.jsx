// services/web/src/App.jsx
import React, { useEffect, useState } from 'react'
import { getStudentDashboard, getQuiz, submitQuiz, login, logout, getCurrentUser } from './api'
import Teacher from './Teacher'
import Login from './Login'
import { LoadingWithText, FadeIn, SlideUp, DashboardSkeleton, QuestionSkeleton } from './Loading'
import { ToastProvider, useToast } from './Toast.jsx'
import { ThemeProvider } from './ThemeContext.jsx'
import { CompactThemeToggle } from './ThemeToggle.jsx'
import Timer from './Timer.jsx'

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
      <div>
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
        <div>
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
      <div>
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

// Core App component that handles authentication and routing
function MainApp() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('dashboard')   // student views
  const [assignmentId, setAssignmentId] = useState(null)
  const toast = useToast()
  
  console.log('MainApp state:', { user, loading, view });

  // Check for existing session on app load
  useEffect(() => {
    const token = localStorage.getItem('authToken')
    if (token) {
      getCurrentUser()
        .then(data => setUser(data.user))
        .catch(err => {
          console.error('Session check failed:', err)
          logout()
        })
        .finally(() => setLoading(false))
    } else {
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
    toast.info('You have been logged out successfully')
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
    return <Login onLogin={handleLogin} loading={loading} />
  }

  return (
    <div className="app">
      <div className="row">
        <h1>Dynamic Active LMS</h1>
        <div className="user-info">
          <CompactThemeToggle />
          <span>Welcome, {user.name} ({user.role})</span>
          <button className="btn btn-secondary" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      {user.role === 'student' ? (
        view === 'dashboard' ? (
          <div className="card">
            <StudentDashboard onStartQuiz={(id)=>{ setAssignmentId(id); setView('quiz') }} />
          </div>
        ) : (
          <div className="card">
            <QuizPlayer assignmentId={assignmentId} onDone={()=>setView('dashboard')} />
          </div>
        )
      ) : (
        <div className="card"><Teacher /></div>
      )}
    </div>
  )
}

// Wrapper App component with ThemeProvider and ToastProvider
export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <MainApp />
      </ToastProvider>
    </ThemeProvider>
  )
}
