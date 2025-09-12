-- ===== SCHEMA =====
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  role VARCHAR(16) NOT NULL CHECK (role IN ('student','teacher')),
  name VARCHAR(80) NOT NULL,
  email VARCHAR(120) UNIQUE
);

CREATE TABLE IF NOT EXISTS classes (
  id SERIAL PRIMARY KEY,
  name VARCHAR(80) NOT NULL,
  teacher_id INTEGER REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS enrollments (
  user_id INTEGER REFERENCES users(id),
  class_id INTEGER REFERENCES classes(id),
  PRIMARY KEY (user_id, class_id)
);

CREATE TABLE IF NOT EXISTS lessons (
  id SERIAL PRIMARY KEY,
  title VARCHAR(120) NOT NULL,
  subject VARCHAR(40) NOT NULL,
  grade_band VARCHAR(16) NOT NULL,
  skill_tag VARCHAR(40) NOT NULL,
  difficulty INT DEFAULT 1,
  content_url TEXT
);

CREATE TABLE IF NOT EXISTS assignments (
  id SERIAL PRIMARY KEY,
  class_id INTEGER REFERENCES classes(id),
  lesson_id INTEGER REFERENCES lessons(id),
  type VARCHAR(16) NOT NULL, -- quiz | practice
  due_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS questions (
  id SERIAL PRIMARY KEY,
  lesson_id INTEGER REFERENCES lessons(id),
  type VARCHAR(16) NOT NULL, -- mcq | short
  prompt TEXT NOT NULL,
  options TEXT,              -- JSON array for MCQ
  answer_key TEXT,           -- text or correct option
  rubric_keywords TEXT       -- JSON array for short answers
);

CREATE TABLE IF NOT EXISTS submissions (
  id SERIAL PRIMARY KEY,
  assignment_id INTEGER REFERENCES assignments(id),
  student_id INTEGER REFERENCES users(id),
  submitted_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS responses (
  id SERIAL PRIMARY KEY,
  submission_id INTEGER REFERENCES submissions(id),
  question_id INTEGER REFERENCES questions(id),
  student_answer TEXT,
  score NUMERIC,
  feedback TEXT
);

CREATE TABLE IF NOT EXISTS mastery (
  student_id INTEGER REFERENCES users(id),
  skill_tag VARCHAR(40),
  mastery_pct NUMERIC,
  last_updated TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (student_id, skill_tag)
);

-- ===== SEED DATA =====
INSERT INTO users (role, name, email) VALUES
  ('teacher','Ms. Rivera','teacher@example.com'),
  ('student','Ava','ava@example.com'),
  ('student','Ben','ben@example.com')
ON CONFLICT DO NOTHING;

INSERT INTO classes (name, teacher_id) VALUES
  ('Math 6A', 1)
ON CONFLICT DO NOTHING;

-- Enroll Ava and Ben
INSERT INTO enrollments (user_id, class_id) VALUES (2,1),(3,1)
ON CONFLICT DO NOTHING;

-- Lessons
INSERT INTO lessons (title, subject, grade_band, skill_tag, difficulty, content_url) VALUES
  ('Fractions Basics','Math','6-8','fractions',1,'#'),
  ('Fraction Addition','Math','6-8','fractions_add',2,'#'),
  ('Fraction Comparison','Math','6-8','fractions_compare',2,'#')
ON CONFLICT DO NOTHING;

-- One quiz assignment for the class using lesson 1
INSERT INTO assignments (class_id, lesson_id, type, due_at)
VALUES (1, 1, 'quiz', NOW() + INTERVAL '3 days');

-- Questions for lesson 1 (Fractions Basics)
INSERT INTO questions (lesson_id, type, prompt, options, answer_key, rubric_keywords) VALUES
  (1,'mcq','What is 1/2 + 1/4?','["1/4","1/2","3/4","1"]','3/4',NULL),
  (1,'mcq','Which fraction is larger? 2/3 or 3/5','["2/3","3/5"]','2/3',NULL),
  (1,'short','Explain how to add fractions with unlike denominators.',NULL,NULL,'["common denominator","equivalent fractions","simplify"]');

-- Initial mastery for Ava (low), Ben (higher)
INSERT INTO mastery (student_id, skill_tag, mastery_pct)
VALUES (2,'fractions',62), (3,'fractions',85)
ON CONFLICT (student_id, skill_tag) DO NOTHING;
