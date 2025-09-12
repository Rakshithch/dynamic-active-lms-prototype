import express from 'express'
import cors from 'cors'
import axios from 'axios'
import { query } from './db.js'

const app = express()
app.use(cors())
app.use(express.json())

const AI_URL = process.env.AI_URL || 'http://localhost:8000'

app.get('/health', (req, res) => res.json({ ok: true }))

// Student dashboard: due assignments + recommendation
app.get('/student/:id/dashboard', async (req, res) => {
  const id = Number(req.params.id)
  try {
    const student = (await query("SELECT id, name FROM users WHERE id=$1 AND role='student'", [id]))[0]
    if (!student) return res.status(404).json({ error: 'Student not found' })

    const due = await query(`
      SELECT a.id, l.title, a.due_at
      FROM assignments a
      JOIN classes c ON a.class_id = c.id
      JOIN enrollments e ON e.class_id = c.id AND e.user_id = $1
      JOIN lessons l ON l.id = a.lesson_id
      ORDER BY a.due_at ASC
      LIMIT 5;
    `, [id])

    const masteryRows = await query('SELECT skill_tag, mastery_pct FROM mastery WHERE student_id=$1', [id])
    const mastery = Object.fromEntries(masteryRows.map(r => [r.skill_tag, Number(r.mastery_pct)]))

    const rec = await axios.post(`${AI_URL}/recommend_next`, { student_id: id, mastery }).then(r => r.data)

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
app.post('/submissions', async (req, res) => {
  const { assignment_id, student_id, answers } = req.body
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

const port = Number(process.env.PORT || 8080)
app.listen(port, () => console.log(`API listening on :${port}`))

// ---------- TEACHER ROUTES ----------

// GET /teacher/:id/dashboard
// Returns classes taught, upcoming assignments (next 14 days), and recent submissions
app.get('/teacher/:id/dashboard', async (req, res) => {
  const teacherId = Number(req.params.id)
  try {
    const teacher = (await query("SELECT id, name FROM users WHERE id=$1 AND role='teacher'", [teacherId]))[0]
    if (!teacher) return res.status(404).json({ error: 'Teacher not found' })

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

/**
 * POST /assignments
 * Create an assignment. Two modes:
 *  A) Reference an existing lesson_id
 *  B) Create a new lesson + (optional) questions, then create the assignment
 *
 * Body examples:
 *  { "class_id": 1, "lesson_id": 1, "type": "quiz", "due_at": "2025-09-20T15:00:00" }
 *
 *  {
 *    "class_id": 1, "type": "quiz", "due_at": "2025-09-20T15:00:00",
 *    "lesson": { "title":"Decimals Basics","subject":"Math","grade_band":"6-8","skill_tag":"decimals","difficulty":1 },
 *    "questions": [
 *      {"type":"mcq","prompt":"0.3 + 0.4 = ?","options":["0.6","0.7"],"answer_key":"0.7"},
 *      {"type":"short","prompt":"Explain place value in decimals","rubric_keywords":["tenths","hundredths","place value"]}
 *    ]
 *  }
 */
app.post('/assignments', async (req, res) => {
  const { class_id, lesson_id, type = 'quiz', due_at, lesson, questions = [] } = req.body
  if (!class_id || !type || !due_at) return res.status(400).json({ error: 'class_id, type, due_at required' })
  try {
    let lid = lesson_id

    // If lesson details provided, create lesson (and optional questions)
    if (!lid && lesson) {
      const newLesson = (await query(
        `INSERT INTO lessons (title, subject, grade_band, skill_tag, difficulty, content_url)
         VALUES ($1,$2,$3,$4,$5,$6)
         RETURNING id`,
        [lesson.title, lesson.subject, lesson.grade_band, lesson.skill_tag, lesson.difficulty || 1, lesson.content_url || '#']
      ))[0]
      lid = newLesson.id

      // Add questions if provided
      for (const q of questions) {
        await query(
          `INSERT INTO questions (lesson_id, type, prompt, options, answer_key, rubric_keywords)
           VALUES ($1,$2,$3,$4,$5,$6)`,
          [
            lid,
            q.type,
            q.prompt,
            q.options ? JSON.stringify(q.options) : null,
            q.answer_key || null,
            q.rubric_keywords ? JSON.stringify(q.rubric_keywords) : null
          ]
        )
      }
    }

    if (!lid) return res.status(400).json({ error: 'Provide lesson_id or lesson payload' })

    const a = (await query(
      `INSERT INTO assignments (class_id, lesson_id, type, due_at)
       VALUES ($1,$2,$3,$4) RETURNING id`,
      [class_id, lid, type, due_at]
    ))[0]

    res.status(201).json({ assignment_id: a.id, lesson_id: lid })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Create failed' })
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
