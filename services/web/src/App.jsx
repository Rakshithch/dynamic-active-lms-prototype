// services/web/src/App.jsx
import React, { useEffect, useState } from 'react'
import { getStudentDashboard, getQuiz, submitQuiz } from './api'
import Teacher from './Teacher'

function StudentDashboard({ onStartQuiz }) {
  const [data, setData] = useState(null)
  const [err, setErr] = useState('')

  useEffect(() => {
    getStudentDashboard(2).then(setData).catch(e => setErr(e.message))
  }, [])

  if (err) return <p>Error: {err}</p>
  if (!data) return <p>Loading dashboard…</p>

  const firstDue = data.due_assignments?.[0]

  return (
    <div>
      <h2>Hi, {data.student.name} 👋</h2>
      <p><strong>Recommendation:</strong> {data.recommendation?.reason}</p>

      <h3>Due Assignments</h3>
      {firstDue ? (
        <div className="card">
          <p><b>{firstDue.title}</b> — due {new Date(firstDue.due_at).toLocaleString()}</p>
          <button className="btn" onClick={() => onStartQuiz(firstDue.id)}>Start Quiz</button>
        </div>
      ) : <p>No due assignments.</p>}
    </div>
  )
}

function QuizPlayer({ assignmentId, onDone }) {
  const [quiz, setQuiz] = useState(null)
  const [answers, setAnswers] = useState({})
  const [result, setResult] = useState(null)
  const [err, setErr] = useState('')

  useEffect(() => {
    getQuiz(assignmentId).then(setQuiz).catch(e => setErr(e.message))
  }, [assignmentId])

  if (err) return <p>Error: {err}</p>
  if (!quiz) return <p>Loading quiz…</p>

  if (result) {
    return (
      <div>
        <h3>Submission Result</h3>
        <p>Score: <b>{result.score_pct}%</b></p>
        <ul>
          {result.responses.map(r => (
            <li key={r.id}>Q{r.question_id}: {r.feedback} ({Math.round(Number(r.score)*100)}%)</li>
          ))}
        </ul>
        <button className="btn" onClick={onDone}>Back to Dashboard</button>
      </div>
    )
  }

  const onChange = (qid, val) => setAnswers(a => ({ ...a, [qid]: val }))

  const submit = async () => {
    const payload = {
      assignment_id: assignmentId,
      student_id: 2, // Ava
      answers: quiz.questions.map(q => ({ question_id: q.id, answer: answers[q.id] || '' }))
    }
    try {
      const r = await submitQuiz(payload)
      setResult(r)
    } catch (e) {
      setErr(e.message)
    }
  }

  return (
    <div>
      <h3>{quiz.assignment.title} — Quiz</h3>
      {quiz.questions.map(q => (
        <div key={q.id} style={{marginBottom:16}}>
          <p><b>Q{q.id}.</b> {q.prompt}</p>
          {q.type === 'mcq' ? (
            <div>
              {q.options.map(opt => (
                <label key={opt} style={{display:'block'}}>
                  <input
                    type="radio"
                    name={`q-${q.id}`}
                    value={opt}
                    onChange={(e) => onChange(q.id, e.target.value)}
                  /> {opt}
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
      ))}
      <button className="btn" onClick={submit}>Submit</button>
    </div>
  )
}

export default function App() {
  const [view, setView] = useState('dashboard')   // student views
  const [assignmentId, setAssignmentId] = useState(null)
  const [role, setRole] = useState('student')     // 'student' | 'teacher'

  return (
    <div className="app">
      <div className="row">
        <h1>Dynamic Active LMS Prototype</h1>
        <div>
          <label>Role&nbsp;</label>
          <select value={role} onChange={e=>setRole(e.target.value)}>
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
          </select>
        </div>
      </div>

      {role === 'student' ? (
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
