import React, { useEffect, useState } from 'react';
import {
  getTeacherDashboard,
  createAssignment,
  getAssignmentResults,
} from './api';
// import WorkingAssignmentCreator from './WorkingAssignmentCreator.jsx' // Still has SimpleFormValidation issues

// Generate sample questions based on subject and count
function generateSampleQuestions(count, subject) {
  const questionTemplates = {
    'Math': [
      { type: 'mcq', prompt: 'What is 2 + 2?', options: ['3', '4', '5'], answer_key: '4' },
      { type: 'mcq', prompt: 'What is 5 × 3?', options: ['15', '12', '18'], answer_key: '15' },
      { type: 'short', prompt: 'Solve: 10 ÷ 2 = ?', answer_key: '5' },
      { type: 'mcq', prompt: 'What is 7 - 3?', options: ['3', '4', '5'], answer_key: '4' },
      { type: 'short', prompt: 'What is the square root of 16?', answer_key: '4' }
    ],
    'Science': [
      { type: 'mcq', prompt: 'What is the chemical symbol for water?', options: ['H2O', 'CO2', 'NaCl'], answer_key: 'H2O' },
      { type: 'mcq', prompt: 'How many bones are in the human body?', options: ['206', '208', '210'], answer_key: '206' },
      { type: 'short', prompt: 'Name the planet closest to the sun.', answer_key: 'Mercury' },
      { type: 'mcq', prompt: 'What gas do plants absorb from the atmosphere?', options: ['Oxygen', 'Carbon dioxide', 'Nitrogen'], answer_key: 'Carbon dioxide' }
    ],
    'English': [
      { type: 'mcq', prompt: 'What is a noun?', options: ['Action word', 'Describing word', 'Person, place or thing'], answer_key: 'Person, place or thing' },
      { type: 'short', prompt: 'Write a sentence using the word "beautiful".', answer_key: 'The flower is beautiful.' },
      { type: 'mcq', prompt: 'What is the past tense of "go"?', options: ['Gone', 'Went', 'Going'], answer_key: 'Went' }
    ],
    'History': [
      { type: 'mcq', prompt: 'In which year did World War II end?', options: ['1944', '1945', '1946'], answer_key: '1945' },
      { type: 'short', prompt: 'Name the first president of the United States.', answer_key: 'George Washington' },
      { type: 'mcq', prompt: 'Which ancient civilization built the pyramids?', options: ['Romans', 'Greeks', 'Egyptians'], answer_key: 'Egyptians' }
    ]
  }
  
  const templates = questionTemplates[subject] || questionTemplates['Math']
  const questions = []
  
  for (let i = 0; i < Math.min(count, templates.length); i++) {
    questions.push({ ...templates[i] })
  }
  
  // If we need more questions than templates, repeat some
  while (questions.length < count) {
    const randomTemplate = templates[Math.floor(Math.random() * templates.length)]
    questions.push({ ...randomTemplate })
  }
  
  return questions
}

// Simple working assignment creator without complex dependencies
function SimpleAssignmentCreator({ classes, onAssignmentCreated, onCancel }) {
  const [formData, setFormData] = useState({
    class_id: classes[0]?.id || '',
    title: '',
    subject: 'Math',
    num_questions: 3,
    due_date: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const toast = useToast()

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Simple validation
    if (!formData.title.trim()) {
      if (toast) toast.error('Title is required')
      return
    }
    if (!formData.class_id) {
      if (toast) toast.error('Please select a class')
      return
    }
    if (!formData.due_date) {
      if (toast) toast.error('Due date is required')
      return
    }
    
    setLoading(true)
    if (toast) toast.info('🤖 Creating assignment...')
    
    try {
      // Prepare assignment data
      const assignmentData = {
        class_id: parseInt(formData.class_id),
        type: 'quiz',
        due_at: new Date(formData.due_date + 'T23:59:59').toISOString(),
        lesson_data: {
          title: formData.title,
          subject: formData.subject,
          difficulty: 1,
          skill_tag: formData.subject.toLowerCase()
        },
        questions: generateSampleQuestions(formData.num_questions, formData.subject)
      }
      
      // Call the actual API
      const result = await createAssignment(assignmentData)
      
      if (toast) toast.success(`🎉 Assignment #${result.assignment_id} created successfully!`)
      onAssignmentCreated?.(result)
    } catch (err) {
      setError(err.message || 'Failed to create assignment')
      if (toast) toast.error(`Failed to create assignment: ${err.message || 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '20px', background: 'white', borderRadius: '8px' }}>
      <h3>🤖 Create Assignment</h3>
      <p>Fill in the details to create a new assignment for your students.</p>
      
      {error && (
        <div style={{ 
          background: '#fee', 
          color: '#c33', 
          padding: '10px', 
          borderRadius: '4px', 
          marginBottom: '15px' 
        }}>
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="form-field" style={{ marginBottom: '15px' }}>
          <label className="form-field__label">Assignment Title *</label>
          <input
            type="text"
            className="form-field__input"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="e.g., Fractions Quiz"
            required
          />
        </div>
        
        <div className="form-field" style={{ marginBottom: '15px' }}>
          <label className="form-field__label">Class *</label>
          <select
            className="form-field__input"
            value={formData.class_id}
            onChange={(e) => setFormData(prev => ({ ...prev, class_id: e.target.value }))}
            required
          >
            <option value="">Select a class</option>
            {classes.map(cls => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>
        </div>
        
        <div className="form-field" style={{ marginBottom: '15px' }}>
          <label className="form-field__label">Subject</label>
          <select
            className="form-field__input"
            value={formData.subject}
            onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
          >
            <option value="Math">Math</option>
            <option value="Science">Science</option>
            <option value="English">English</option>
            <option value="History">History</option>
          </select>
        </div>
        
        <div className="form-field" style={{ marginBottom: '15px' }}>
          <label className="form-field__label">Number of Questions</label>
          <input
            type="number"
            className="form-field__input"
            value={formData.num_questions}
            onChange={(e) => setFormData(prev => ({ ...prev, num_questions: parseInt(e.target.value) || 1 }))}
            min="1"
            max="20"
          />
        </div>
        
        <div className="form-field" style={{ marginBottom: '20px' }}>
          <label className="form-field__label">Due Date *</label>
          <input
            type="date"
            className="form-field__input"
            value={formData.due_date}
            onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
            min={new Date().toISOString().split('T')[0]}
            required
          />
        </div>
        
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Creating...' : '🎆 Create Assignment'}
          </button>
        </div>
      </form>
      
      <div style={{ 
        marginTop: '20px', 
        padding: '15px', 
        background: '#f9f9f9', 
        borderRadius: '8px' 
      }}>
        <h4>Note:</h4>
        <p>This simplified assignment creator works without complex dependencies. The full version would include:</p>
        <ul>
          <li>✅ AI-powered question generation</li>
          <li>✅ Advanced form validation</li>
          <li>✅ Question editing interface</li>
          <li>✅ Difficulty settings</li>
        </ul>
      </div>
    </div>
  )
}
import TeacherAnalytics from './TeacherAnalytics.jsx';
import { useToast } from './Toast.jsx';
import { SwipeableTabs, MobileCard, useResponsive } from './MobileUtils.jsx';

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
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard', 'analytics'
  const toast = useToast();
  const { isMobile } = useResponsive();
  
  console.log('Teacher component rendering...');

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '📋' },
    { id: 'analytics', label: 'Analytics', icon: '📊' }
  ];

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
    console.log('Loading teacher dashboard...')
    getTeacherDashboard()
      .then(dash => {
        console.log('Dashboard loaded:', dash)
        setDash(dash)
        toast.success(`Welcome back, ${dash.teacher.name}! 📚`)
      })
      .catch(e => {
        console.error('Dashboard error:', e)
        setErr(e.message)
        toast.error(`Failed to load dashboard: ${e.message}`)
      })
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
      toast.success(`🎉 Assignment created! #${res.assignment_id} (lesson #${res.lesson_id})`);
      // Refresh dashboard
      getTeacherDashboard().then(setDash).catch(e => setErr(e.message));
    } catch (e) {
      toast.error(`Failed to create assignment: ${e.message}`);
    }
  };

  if (err) return <div style={{padding:'20px'}}>Error: {err}</div>;
  if (!dash) return <div style={{padding:'20px'}}>Loading teacher dashboard…</div>;

  return (
    <div>
      <SwipeableTabs
        tabs={tabs} 
        activeTab={currentView} 
        onTabChange={setCurrentView}
      >
        {currentView === 'analytics' ? (
          <TeacherAnalytics teacherId={dash.teacher.id} />
        ) : (
          <div>
            <MobileCard 
              title="Your Classes" 
              subtitle={`${classes.length} class${classes.length !== 1 ? 'es' : ''}`}
            >
              <div className="class-list">
                {classes.map(c => (
                  <div key={c.id} className="class-item">
                    <span className="class-id">#{c.id}</span>
                    <span className="class-name">{c.name}</span>
                  </div>
                ))}
              </div>
            </MobileCard>

            <MobileCard 
              title="Upcoming Assignments" 
              subtitle="Next 14 days"
            >
              {upcoming.length ? (
                <div className="assignment-list">
                  {upcoming.map(a => (
                    <div key={a.id} className="assignment-item">
                      <div className="assignment-info">
                        <span className="assignment-title">#{a.id} — {a.title}</span>
                        <span className="assignment-meta">({a.class_name}) — {new Date(a.due_at).toLocaleDateString()}</span>
                      </div>
                      <button 
                        className="btn btn-sm btn-secondary"
                        onClick={() => setViewResultsFor(a.id)}
                      >
                        📊 View Results
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="empty-state">🎉 No upcoming assignments!</p>
              )}
            </MobileCard>

            <MobileCard 
              title="Recent Submissions" 
              subtitle="Latest student activity"
            >
              {recent.length ? (
                <div className="submission-list">
                  {recent.map(s => (
                    <div key={s.id} className="submission-item">
                      <div className="submission-student">👨‍🎓 {s.student_name}</div>
                      <div className="submission-details">
                        <span className="submission-assignment">{s.title} (#{s.assignment_id})</span>
                        <span className="submission-time">{new Date(s.submitted_at).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="empty-state">📝 No submissions yet</p>
              )}
            </MobileCard>

            <MobileCard 
              title="Create Assignment" 
              subtitle="AI-powered or manual creation"
            >
              <div className="create-options">
                <button 
                  className="btn btn-primary mobile-btn--full-width"
                  onClick={() => setShowAICreator(true)}
                  style={{marginBottom: '12px'}}
                >
                  🤖 Create with AI
                </button>
                <button 
                  className="btn btn-secondary mobile-btn--full-width"
                  onClick={() => {
                    // For now, just show the same creator
                    setShowAICreator(true)
                    toast.info('Manual creation uses the same form as AI creation')
                  }}
                >
                  ✍️ Manual Creation
                </button>
              </div>
              <p className="create-hint">
                🎆 AI-powered creation generates questions automatically based on your topic and requirements.
              </p>
            </MobileCard>
          </div>
        )}
      </SwipeableTabs>

      {viewResultsFor && (
        <Results assignmentId={viewResultsFor} onClose={()=>setViewResultsFor(null)} />
      )}
      
      {showAICreator && (
        isMobile ? (
          <div className="mobile-modal mobile-modal--fullscreen">
            <div className="mobile-modal__content">
              <div className="mobile-modal__header">
                <div className="mobile-modal__handle" />
                <h3 className="mobile-modal__title">🤖 AI Assignment Creator</h3>
                <button className="mobile-modal__close" onClick={() => setShowAICreator(false)}>
                  ✕
                </button>
              </div>
              <div className="mobile-modal__body">
                <SimpleAssignmentCreator 
                  classes={classes}
                  onAssignmentCreated={() => {
                    setShowAICreator(false);
                    getTeacherDashboard().then(setDash).catch(e => setErr(e.message));
                  }}
                  onCancel={() => setShowAICreator(false)}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="modal-overlay">
            <div className="modal-content">
              <SimpleAssignmentCreator 
                classes={classes}
                onAssignmentCreated={() => {
                  setShowAICreator(false);
                  getTeacherDashboard().then(setDash).catch(e => setErr(e.message));
                }}
                onCancel={() => setShowAICreator(false)}
              />
            </div>
          </div>
        )
      )}
    </div>
  );
}
