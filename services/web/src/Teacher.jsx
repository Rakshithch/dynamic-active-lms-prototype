import React, { useEffect, useState } from 'react';
import {
  getTeacherDashboard,
  createAssignment,
  getAssignmentResults,
} from './api';
import AssignmentCreator from './AssignmentCreator';

function Card({ children }) {
  return <div style={{border:'1px solid #ddd', borderRadius:8, padding:12, marginBottom:12}}>{children}</div>;
}

function Results({ assignmentId, onClose }) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => {
    getAssignmentResults(assignmentId).then(setData).catch(e => setErr(e.message));
  }, [assignmentId]);

  if (err) return <Card>Error: {err}</Card>;
  if (!data) return <Card>Loading results…</Card>;

  return (
    <Card>
      <h3>Results for Assignment #{assignmentId}</h3>
      {data.submissions.length === 0 ? (
        <p>No submissions yet.</p>
      ) : (
        <>
          <p><b>Class Average:</b> {data.average_pct}%</p>
          <table style={{width:'100%', borderCollapse:'collapse'}}>
            <thead>
              <tr><th style={{textAlign:'left'}}>Student</th><th>Score</th><th>Submitted</th></tr>
            </thead>
            <tbody>
              {data.submissions.map(s => (
                <tr key={s.id}>
                  <td>{s.student_name}</td>
                  <td style={{textAlign:'center'}}>{s.score_pct}%</td>
                  <td style={{textAlign:'center'}}>{new Date(s.submitted_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <h4 style={{marginTop:12}}>Insights</h4>
          {data.insights?.length ? (
            <ul>
              {data.insights.map(i => (
                <li key={i.question_id}>
                  Q{i.question_id}: {i.prompt} — Miss rate: {i.miss_rate_pct}%
                </li>
              ))}
            </ul>
          ) : <p>No insights yet.</p>}
        </>
      )}
      <button onClick={onClose}>Close</button>
    </Card>
  );
}

export default function Teacher() {
  const [dash, setDash] = useState(null);
  const [err, setErr] = useState('');
  const [viewResultsFor, setViewResultsFor] = useState(null);
  const [showAICreator, setShowAICreator] = useState(false);
  const [showManualCreator, setShowManualCreator] = useState(false);

  // Create form state
  const [useExistingLesson, setUseExistingLesson] = useState(true);
  const [classId, setClassId] = useState(1);
  const [lessonId, setLessonId] = useState(1);
  const [dueAt, setDueAt] = useState(() => new Date(Date.now()+3*864e5).toISOString().slice(0,16)); // local YYYY-MM-DDTHH:MM

  const [lesson, setLesson] = useState({
    title: 'Decimals Basics',
    subject: 'Math',
    grade_band: '6-8',
    skill_tag: 'decimals',
    difficulty: 1,
  });

  const [questions, setQuestions] = useState([
    { type: 'mcq', prompt: '0.3 + 0.4 = ?', options: ['0.6','0.7'], answer_key: '0.7' },
    { type: 'short', prompt: 'Explain place value in decimals', rubric_keywords: ['tenths','hundredths','place value'] }
  ]);

  useEffect(() => {
    getTeacherDashboard().then(setDash).catch(e => setErr(e.message))
  }, [])

  const classes = dash?.classes || [];
  const upcoming = dash?.upcoming_assignments || [];
  const recent = dash?.recent_submissions || [];

  const submitCreate = async () => {
    try {
      const base = { class_id: Number(classId), type: 'quiz', due_at: new Date(dueAt).toISOString() };
      const payload = useExistingLesson
        ? { ...base, lesson_id: Number(lessonId) }
        : { ...base, lesson, questions };
      const res = await createAssignment(payload);
      alert(`Created assignment #${res.assignment_id} (lesson #${res.lesson_id})`);
    } catch (e) {
      alert('Create failed: ' + e.message);
    }
  };

  if (err) return <Card>Error: {err}</Card>;
  if (!dash) return <Card>Loading teacher dashboard…</Card>;

  return (
    <div>
      <h2>Welcome, {dash.teacher.name}</h2>

      <Card>
        <h3>Your Classes</h3>
        <ul>
          {classes.map(c => <li key={c.id}>#{c.id} — {c.name}</li>)}
        </ul>
      </Card>

      <Card>
        <h3>Upcoming Assignments (14 days)</h3>
        {upcoming.length ? (
          <ul>
            {upcoming.map(a => (
              <li key={a.id}>
                #{a.id} — {a.title} ({a.class_name}) — due {new Date(a.due_at).toLocaleString()}
                {' '}<button onClick={() => setViewResultsFor(a.id)}>View results</button>
              </li>
            ))}
          </ul>
        ) : <p>No upcoming items.</p>}
      </Card>

      <Card>
        <h3>Recent Submissions</h3>
        {recent.length ? (
          <ul>
            {recent.map(s => (
              <li key={s.id}>
                {s.student_name} → {s.title} (#{s.assignment_id}) at {new Date(s.submitted_at).toLocaleString()}
              </li>
            ))}
          </ul>
        ) : <p>No submissions yet.</p>}
      </Card>

      <Card>
        <h3>Create Assignment</h3>
        <div className="assignment-options">
          <button 
            className="btn btn-primary"
            onClick={() => setShowAICreator(true)}
            style={{marginRight: '12px'}}
          >
            🤖 Create with AI
          </button>
          <button 
            className="btn btn-secondary"
            onClick={() => setShowManualCreator(true)}
          >
            Manual Creation
          </button>
        </div>
        <p style={{color: '#666', fontSize: '14px', marginTop: '8px'}}>
          AI-powered creation generates questions automatically based on your topic and requirements.
        </p>
      </Card>

      {viewResultsFor && (
        <Results assignmentId={viewResultsFor} onClose={()=>setViewResultsFor(null)} />
      )}
      
      {showAICreator && (
        <div className="modal-overlay">
          <div className="modal-content">
            <AssignmentCreator 
              classes={classes}
              onAssignmentCreated={() => {
                setShowAICreator(false);
                // Refresh dashboard
                getTeacherDashboard().then(setDash).catch(e => setErr(e.message));
              }}
              onCancel={() => setShowAICreator(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
