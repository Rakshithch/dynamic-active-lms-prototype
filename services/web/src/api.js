// services/web/src/api.js
const API = 'http://localhost:3001';

// Auth helper
function getAuthHeaders() {
  const token = localStorage.getItem('authToken')
  return token ? { 'Authorization': `Bearer ${token}` } : {}
}

// Auth functions
export async function login(email, password) {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })
  
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || 'Login failed')
  }
  
  const data = await res.json()
  localStorage.setItem('authToken', data.token)
  return data
}

export function logout() {
  localStorage.removeItem('authToken')
}

export async function getCurrentUser() {
  const res = await fetch(`${API}/auth/me`, {
    headers: getAuthHeaders()
  })
  
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      logout()
      throw new Error('Session expired')
    }
    throw new Error('Failed to get user info')
  }
  
  return res.json()
}

// Student functions
export async function getStudentDashboard() {
  const res = await fetch(`${API}/student/dashboard`, {
    headers: getAuthHeaders()
  })
  if (!res.ok) throw new Error('Failed to fetch dashboard')
  return res.json()
}

export async function getQuiz(assignmentId) {
  const r = await fetch(`${API}/assignments/${assignmentId}/quiz`, {
    headers: getAuthHeaders()
  })
  if (!r.ok) throw new Error('quiz load failed')
  return r.json()
}

export async function submitQuiz({ assignment_id, answers }) {
  const r = await fetch(`${API}/submissions`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify({ assignment_id, answers })
  })
  if (!r.ok) throw new Error('submit failed')
  return r.json()
}

// Teacher functions
export async function getTeacherDashboard() {
  const r = await fetch(`${API}/teacher/dashboard`, {
    headers: getAuthHeaders()
  })
  if (!r.ok) throw new Error('teacher dashboard failed')
  return r.json()
}

export async function createAssignment(payload) {
  const r = await fetch(`${API}/assignments`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify(payload)
  })
  if (!r.ok) throw new Error('create assignment failed')
  return r.json()
}

export async function getAssignmentResults(assignmentId) {
  const r = await fetch(`${API}/assignments/${assignmentId}/results`, {
    headers: getAuthHeaders()
  })
  if (!r.ok) throw new Error('get results failed')
  return r.json()
}

// AI-powered question generation
export async function generateQuestions({ topic, difficulty, skill_tag, num_questions, grade_level }) {
  const r = await fetch(`${API}/ai/generate-questions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify({ topic, difficulty, skill_tag, num_questions, grade_level })
  })
  if (!r.ok) throw new Error('Question generation failed')
  return r.json()
}

// Create assignment with AI-generated questions
export async function createAssignmentWithAI(assignmentData) {
  const r = await fetch(`${API}/assignments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify(assignmentData)
  })
  if (!r.ok) throw new Error('Assignment creation failed')
  return r.json()
}
