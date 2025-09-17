import express from 'express'
import cors from 'cors'
import axios from 'axios'
import { query } from './db.js'
import { 
  generateToken, 
  authenticateUser, 
  authenticateToken, 
  requireRole, 
  hashPassword 
} from './auth.js'

const app = express()
app.use(cors())
app.use(express.json())

const AI_URL = process.env.AI_URL || 'http://localhost:8000'

app.get('/health', (req, res) => res.json({ ok: true }))

// ========== AUTHENTICATION ROUTES ==========

// Login endpoint
app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' })
  }
  
  try {
    const user = await authenticateUser(email, password)
    const token = generateToken(user)
    
    res.json({ 
      user, 
      token,
      message: 'Login successful' 
    })
  } catch (error) {
    res.status(401).json({ error: error.message })
  }
})

// Get current user info
app.get('/auth/me', authenticateToken, (req, res) => {
  res.json({ user: req.user })
})

// Register endpoint (for demo purposes)
app.post('/auth/register', async (req, res) => {
  const { email, password, name, role } = req.body
  
  if (!email || !password || !name || !role) {
    return res.status(400).json({ error: 'All fields required' })
  }
  
  try {
    const hashedPassword = await hashPassword(password)
    const newUser = await query(
      `INSERT INTO users (email, password_hash, name, role) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, email, name, role`,
      [email, hashedPassword, name, role]
    )
    
    const user = newUser[0]
    const token = generateToken(user)
    
    res.status(201).json({ 
      user, 
      token,
      message: 'Registration successful' 
    })
  } catch (error) {
    if (error.code === '23505') { // Unique violation
      res.status(400).json({ error: 'Email already exists' })
    } else {
      console.error(error)
      res.status(500).json({ error: 'Registration failed' })
    }
  }
})

// Student dashboard: due assignments + recommendation
app.get('/student/dashboard', authenticateToken, requireRole('student'), async (req, res) => {
  const studentId = req.user.id
  try {
    const student = { id: req.user.id, name: req.user.name }

    const due = await query(`
      SELECT a.id, l.title, a.due_at
      FROM assignments a
      JOIN classes c ON a.class_id = c.id
      JOIN enrollments e ON e.class_id = c.id AND e.user_id = $1
      JOIN lessons l ON l.id = a.lesson_id
      ORDER BY a.due_at ASC
      LIMIT 5;
    `, [studentId])

    const masteryRows = await query('SELECT skill_tag, mastery_pct FROM mastery WHERE student_id=$1', [studentId])
    const mastery = Object.fromEntries(masteryRows.map(r => [r.skill_tag, Number(r.mastery_pct)]))

    const rec = await axios.post(`${AI_URL}/recommend_next`, { student_id: studentId, mastery }).then(r => r.data)

    res.json({ student, due_assignments: due, recommendation: rec })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Internal error' })
  }
})

// Fetch quiz by assignment id
app.get('/assignments/:id/quiz', async (req, res) => {
  const assignmentId = Number(req.params.id)
  try {
    const assignment = (await query(`
      SELECT a.id, a.class_id, a.lesson_id, a.type, a.due_at, l.title, l.skill_tag
      FROM assignments a
      JOIN lessons l ON l.id = a.lesson_id
      WHERE a.id=$1
    `, [assignmentId]))[0]
    if (!assignment) return res.status(404).json({ error: 'Assignment not found' })

    const questions = await query(`
      SELECT id, type, prompt, options, answer_key, rubric_keywords
      FROM questions WHERE lesson_id=$1 ORDER BY id ASC
    `, [assignment.lesson_id])

    const parsed = questions.map(q => ({
      ...q,
      options: q.options ? JSON.parse(q.options) : null,
      rubric_keywords: q.rubric_keywords ? JSON.parse(q.rubric_keywords) : []
    }))

    res.json({ assignment, questions: parsed })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Internal error' })
  }
})

// Submit quiz, auto-grade, save responses, update mastery
app.post('/submissions', authenticateToken, requireRole('student'), async (req, res) => {
  const { assignment_id, answers } = req.body
  const student_id = req.user.id
  try {
    const sub = (await query(
      `INSERT INTO submissions (assignment_id, student_id)
       VALUES ($1,$2) RETURNING id, submitted_at`,
      [assignment_id, student_id]
    ))[0]

    const qRows = await query(
      `SELECT id, type, answer_key, rubric_keywords
       FROM questions WHERE id = ANY($1::int[])`,
      [answers.map(a => a.question_id)]
    )
    const qMap = new Map(qRows.map(q => [q.id, q]))

    let total = 0, correct = 0
    const saved = []

    for (const a of answers) {
      const q = qMap.get(a.question_id)
      let score = 0, feedback = ''

      if (q.type === 'mcq') {
        if ((a.answer || '').trim() === (q.answer_key || '').trim()) {
          score = 1; feedback = 'Correct'
        } else {
          score = 0; feedback = `Correct answer: ${q.answer_key}`
        }
      } else if (q.type === 'short') {
        const rubric = q.rubric_keywords ? JSON.parse(q.rubric_keywords) : []
        const ai = await axios.post(`${AI_URL}/grade_short_answer`, {
          prompt: 'Grade per rubric',
          answer: a.answer || '',
          rubric_keywords: rubric
        }).then(r => r.data)
        score = Number(ai.score) // 0..1
        feedback = ai.feedback
      }

      total += 1
      if (score >= 0.5) correct += 1

      const row = (await query(
        `INSERT INTO responses (submission_id, question_id, student_answer, score, feedback)
         VALUES ($1,$2,$3,$4,$5)
         RETURNING id, question_id, score, feedback`,
        [sub.id, a.question_id, a.answer || '', score, feedback]
      ))[0]
      saved.push(row)
    }

    const pct = Math.round((correct / total) * 100)

    const lesson = (await query(
      `SELECT l.skill_tag FROM assignments a JOIN lessons l ON l.id=a.lesson_id WHERE a.id=$1`,
      [assignment_id]
    ))[0]
    if (lesson?.skill_tag) {
      await query(
        `INSERT INTO mastery (student_id, skill_tag, mastery_pct)
         VALUES ($1,$2,$3)
         ON CONFLICT (student_id, skill_tag)
         DO UPDATE SET mastery_pct=EXCLUDED.mastery_pct, last_updated=NOW()`,
        [student_id, lesson.skill_tag, pct]
      )
    }

    res.status(201).json({ submission_id: sub.id, score_pct: pct, responses: saved })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Submit failed' })
  }
})

// ---------- TEACHER ROUTES ----------

// GET /teacher/dashboard
// Returns classes taught, upcoming assignments (next 14 days), and recent submissions
app.get('/teacher/dashboard', authenticateToken, requireRole('teacher'), async (req, res) => {
  const teacherId = req.user.id
  try {
    const teacher = { id: req.user.id, name: req.user.name }

    const classes = await query(
      `SELECT id, name FROM classes WHERE teacher_id=$1 ORDER BY name ASC`,
      [teacherId]
    )

    const upcoming = await query(
      `SELECT a.id, l.title, a.due_at, c.name AS class_name
       FROM assignments a
       JOIN classes c ON c.id=a.class_id
       JOIN lessons l ON l.id=a.lesson_id
       WHERE c.teacher_id=$1 AND a.due_at <= NOW() + INTERVAL '14 days'
       ORDER BY a.due_at ASC`,
      [teacherId]
    )

    const recentSubs = await query(
      `SELECT s.id, s.submitted_at, u.name AS student_name, a.id as assignment_id, l.title
       FROM submissions s
       JOIN users u ON u.id=s.student_id
       JOIN assignments a ON a.id=s.assignment_id
       JOIN classes c ON c.id=a.class_id
       JOIN lessons l ON l.id=a.lesson_id
       WHERE c.teacher_id=$1
       ORDER BY s.submitted_at DESC
       LIMIT 10`,
      [teacherId]
    )

    res.json({ teacher, classes, upcoming_assignments: upcoming, recent_submissions: recentSubs })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Internal error' })
  }
})

// Generate questions using AI
app.post('/ai/generate-questions', authenticateToken, requireRole('teacher'), async (req, res) => {
  const { topic, difficulty, skill_tag, num_questions, grade_level } = req.body
  
  if (!topic || !skill_tag) {
    return res.status(400).json({ error: 'Topic and skill_tag required' })
  }
  
  try {
    const aiResult = await axios.post(`${AI_URL}/generate_questions`, {
      topic,
      difficulty: difficulty || 1,
      skill_tag,
      num_questions: num_questions || 3,
      grade_level: grade_level || '6-8'
    }).then(r => r.data)
    
    res.json(aiResult)
  } catch (error) {
    console.error('AI question generation failed:', error)
    res.status(500).json({ error: 'Question generation failed' })
  }
})

// POST /assignments
// Create an assignment with optional AI-generated questions
app.post('/assignments', authenticateToken, requireRole('teacher'), async (req, res) => {
  const { class_id, lesson_data, questions, due_at, type } = req.body
  const teacherId = req.user.id
  
  try {
    // Verify teacher owns the class
    const classCheck = await query(
      'SELECT id FROM classes WHERE id = $1 AND teacher_id = $2',
      [class_id, teacherId]
    )
    
    if (classCheck.length === 0) {
      return res.status(403).json({ error: 'Access denied to this class' })
    }
    
    let lesson_id;
    
    // Create new lesson if lesson_data provided
    if (lesson_data) {
      const newLesson = await query(
        `INSERT INTO lessons (title, subject, grade_band, skill_tag, difficulty, content_url)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [
          lesson_data.title,
          lesson_data.subject || 'Math',
          lesson_data.grade_band || '6-8',
          lesson_data.skill_tag,
          lesson_data.difficulty || 1,
          lesson_data.content_url || '#'
        ]
      )
      lesson_id = newLesson[0].id
    } else {
      lesson_id = req.body.lesson_id
    }
    
    if (!lesson_id) {
      return res.status(400).json({ error: 'lesson_id or lesson_data required' })
    }
    
    // Create assignment
    const assignment = await query(
      `INSERT INTO assignments (class_id, lesson_id, type, due_at)
       VALUES ($1, $2, $3, $4)
       RETURNING id, class_id, lesson_id, type, due_at`,
      [class_id, lesson_id, type || 'quiz', due_at]
    )
    
    const assignmentId = assignment[0].id
    
    // Add questions if provided
    if (questions && questions.length > 0) {
      for (const q of questions) {
        await query(
          `INSERT INTO questions (lesson_id, type, prompt, options, answer_key, rubric_keywords)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            lesson_id,
            q.type,
            q.prompt,
            q.options ? JSON.stringify(q.options) : null,
            q.answer_key,
            q.rubric_keywords ? JSON.stringify(q.rubric_keywords) : null
          ]
        )
      }
    }
    
    // Get full assignment details for response
    const fullAssignment = await query(
      `SELECT a.id, a.type, a.due_at, l.title, l.subject, l.skill_tag, c.name as class_name
       FROM assignments a
       JOIN lessons l ON l.id = a.lesson_id
       JOIN classes c ON c.id = a.class_id
       WHERE a.id = $1`,
      [assignmentId]
    )
    
    res.status(201).json({
      assignment: fullAssignment[0],
      questions_added: questions ? questions.length : 0,
      message: 'Assignment created successfully'
    })
    
  } catch (error) {
    console.error('Assignment creation failed:', error)
    res.status(500).json({ error: 'Failed to create assignment' })
  }
})

/**
 * GET /assignments/:id/results
 * Returns per-student scores, class average, and quick insights
 */
app.get('/assignments/:id/results', async (req, res) => {
  const assignmentId = Number(req.params.id)
  try {
    // All submissions for the assignment
    const subs = await query(
      `SELECT s.id, s.student_id, u.name as student_name, s.submitted_at
       FROM submissions s
       JOIN users u ON u.id=s.student_id
       WHERE s.assignment_id=$1
       ORDER BY s.submitted_at DESC`,
      [assignmentId]
    )

    if (subs.length === 0) {
      return res.json({ submissions: [], average_pct: null, insights: { message: 'No submissions yet' } })
    }

    // Per submission score from responses
    const subIds = subs.map(s => s.id)
    const rows = await query(
      `SELECT submission_id, AVG(score)::float AS avg_score
       FROM responses
       WHERE submission_id = ANY($1::int[])
       GROUP BY submission_id`,
      [subIds]
    )
    const scoreMap = new Map(rows.map(r => [r.submission_id, r.avg_score]))

    const detailed = subs.map(s => {
      const avg = scoreMap.get(s.id) ?? 0
      return { ...s, score_pct: Math.round(avg * 100) }
    })

    // Class average
    const avgPct = Math.round(
      (detailed.reduce((acc, d) => acc + d.score_pct, 0) / detailed.length) || 0
    )

    // Quick “insights”: most-missed questions
    const missed = await query(
      `SELECT r.question_id,
              SUM(CASE WHEN r.score < 0.5 THEN 1 ELSE 0 END) AS misses,
              COUNT(*) AS total
       FROM responses r
       WHERE r.submission_id = ANY($1::int[])
       GROUP BY r.question_id
       ORDER BY misses DESC
       LIMIT 5`,
      [subIds]
    )
    const qIds = missed.map(m => m.question_id)
    let qPrompts = []
    if (qIds.length) {
      qPrompts = await query(
        `SELECT id, prompt FROM questions WHERE id = ANY($1::int[])`,
        [qIds]
      )
    }
    const promptMap = new Map(qPrompts.map(q => [q.id, q.prompt]))
    const insights = missed.map(m => ({
      question_id: m.question_id,
      prompt: promptMap.get(m.question_id) || '',
      miss_rate_pct: Math.round((Number(m.misses) / Number(m.total)) * 100)
    }))

    res.json({ submissions: detailed, average_pct: avgPct, insights })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Results fetch failed' })
  }
})

const port = Number(process.env.PORT || 8080)
app.listen(port, () => console.log(`API listening on :${port}`))
