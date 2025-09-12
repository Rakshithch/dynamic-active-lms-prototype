// services/web/src/api.js
const API = 'http://localhost:8080';

export async function getStudentDashboard(studentId = 2) {
  const r = await fetch(`${API}/student/${studentId}/dashboard`);
  if (!r.ok) throw new Error('dashboard failed');
  return r.json();
}

export async function getQuiz(assignmentId) {
  const r = await fetch(`${API}/assignments/${assignmentId}/quiz`);
  if (!r.ok) throw new Error('quiz load failed');
  return r.json();
}

export async function submitQuiz({ assignment_id, student_id, answers }) {
  const r = await fetch(`${API}/submissions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ assignment_id, student_id, answers })
  });
  if (!r.ok) throw new Error('submit failed');
  return r.json();
}

// --- Teacher ---
export async function getTeacherDashboard(teacherId = 1) {
  const r = await fetch(`http://localhost:8080/teacher/${teacherId}/dashboard`);
  if (!r.ok) throw new Error('teacher dashboard failed');
  return r.json();
}

export async function createAssignment(payload) {
  const r = await fetch(`http://localhost:8080/assignments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!r.ok) throw new Error('create assignment failed');
  return r.json();
}

export async function getAssignmentResults(assignmentId) {
  const r = await fetch(`http://localhost:8080/assignments/${assignmentId}/results`);
  if (!r.ok) throw new Error('get results failed');
  return r.json();
}
