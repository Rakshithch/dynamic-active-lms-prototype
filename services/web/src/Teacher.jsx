import React, { useEffect, useMemo, useState } from 'react';
import {
  getTeacherDashboard,
  createAssignment,
  getAssignmentResults,
} from './api';

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
    getTeacherDashboard(1).then(setDash).catch(e => setErr(e.message));
  }, []);

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
        <label>
          Class:
          <select value={classId} onChange={e => setClassId(e.target.value)} style={{marginLeft:8}}>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name} (#{c.id})</option>)}
          </select>
        </label>
        <br /><br />
        <label>
          Due at:
          <input type="datetime-local" value={dueAt} onChange={e => setDueAt(e.target.value)} style={{marginLeft:8}} />
        </label>
        <br /><br />

        <label>
          <input type="radio" checked={useExistingLesson} onChange={() => setUseExistingLesson(true)} />
          Use existing lesson_id:
        </label>
        <input type="number" value={lessonId} onChange={e => setLessonId(e.target.value)} style={{width:80, marginLeft:8}} />

        <br />
        <label>
          <input type="radio" checked={!useExistingLesson} onChange={() => setUseExistingLesson(false)} />
          Create new lesson + questions
        </label>

        {!useExistingLesson && (
          <div style={{marginTop:12}}>
            <b>Lesson</b><br/>
            <input placeholder="Title" value={lesson.title} onChange={e=>setLesson({...lesson,title:e.target.value})} style={{width:'100%'}} /><br/>
            <input placeholder="Subject" value={lesson.subject} onChange={e=>setLesson({...lesson,subject:e.target.value})} />
            <input placeholder="Grade band" value={lesson.grade_band} onChange={e=>setLesson({...lesson,grade_band:e.target.value})} style={{marginLeft:8}} />
            <input placeholder="Skill tag" value={lesson.skill_tag} onChange={e=>setLesson({...lesson,skill_tag:e.target.value})} style={{marginLeft:8}} />
            <input type="number" min="1" max="5" value={lesson.difficulty} onChange={e=>setLesson({...lesson,difficulty:Number(e.target.value)})} style={{marginLeft:8, width:60}} />
            <div style={{marginTop:8}}>
              <b>Questions</b>
              {questions.map((q, idx) => (
                <div key={idx} style={{border:'1px dashed #ccc', padding:8, marginTop:8}}>
                  <select value={q.type} onChange={e=>{
                    const arr=[...questions]; arr[idx]={...q,type:e.target.value}; setQuestions(arr);
                  }}>
                    <option value="mcq">MCQ</option>
                    <option value="short">Short</option>
                  </select>
                  <input placeholder="Prompt" value={q.prompt} onChange={e=>{
                    const arr=[...questions]; arr[idx]={...q,prompt:e.target.value}; setQuestions(arr);
                  }} style={{width:'100%', marginTop:6}} />
                  {q.type==='mcq' ? (
                    <>
                      <input placeholder="Option A" value={q.options?.[0]||''} onChange={e=>{
                        const arr=[...questions]; const opts=[...(q.options||[])]; opts[0]=e.target.value; arr[idx]={...q,options:opts}; setQuestions(arr);
                      }} />
                      <input placeholder="Option B" value={q.options?.[1]||''} onChange={e=>{
                        const arr=[...questions]; const opts=[...(q.options||[])]; opts[1]=e.target.value; arr[idx]={...q,options:opts}; setQuestions(arr);
                      }} style={{marginLeft:8}} />
                      <input placeholder="Answer key" value={q.answer_key||''} onChange={e=>{
                        const arr=[...questions]; arr[idx]={...q,answer_key:e.target.value}; setQuestions(arr);
                      }} style={{marginLeft:8}} />
                    </>
                  ) : (
                    <input placeholder="Rubric keywords (comma-separated)" value={(q.rubric_keywords||[]).join(',')} onChange={e=>{
                      const arr=[...questions]; arr[idx]={...q,rubric_keywords:e.target.value.split(',').map(s=>s.trim()).filter(Boolean)}; setQuestions(arr);
                    }} />
                  )}
                </div>
              ))}
              <button onClick={()=>setQuestions(q=>[...q, {type:'mcq', prompt:'', options:['',''], answer_key:''}])}>+ Add Question</button>
            </div>
          </div>
        )}

        <div style={{marginTop:12}}>
          <button onClick={submitCreate}>Create Assignment</button>
        </div>
      </Card>

      {viewResultsFor && (
        <Results assignmentId={viewResultsFor} onClose={()=>setViewResultsFor(null)} />
      )}
    </div>
  );
}
