# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

Dynamic Active LMS is a K-12 Learning Management System prototype featuring:
- **Student dashboard** with AI-powered recommendations and timer-based quizzes
- **Quiz system** with MCQ and short answer questions, time limits, and auto-submission
- **AI-powered grading** with rubric-based feedback and instant results
- **Teacher dashboard** with assignment creation, analytics, and mobile support
- **Mobile-responsive design** with touch optimization and swipeable interfaces
- **Advanced features**: Theme toggle, form validation, notifications, analytics charts
- **Authentication system** with JWT tokens and role-based access
- **Mastery tracking** with visual progress indicators

## Architecture

This is a microservices-based application with 4 main services:

### Service Architecture
- **Web** (`services/web/`): React + Vite frontend (port 5173)
- **API** (`services/api/`): Node.js/Express backend (port 3001, mapped from 8080)
- **AI** (`services/ai/`): FastAPI Python service for grading and recommendations (port 8000)
- **DB**: PostgreSQL database (port 5432)

### Key Data Flow
1. Student accesses dashboard → API fetches due assignments and calls AI service for recommendations
2. Student takes quiz → Web sends answers to API → API calls AI service for short answer grading
3. API calculates overall score and updates mastery tracking in PostgreSQL
4. Teacher creates assignments → API stores in DB and optionally calls AI service for question generation

### Database Schema
Core entities: `users` (students/teachers), `classes`, `lessons`, `assignments`, `questions`, `submissions`, `responses`, `mastery`

Key relationships:
- Students enroll in classes taught by teachers
- Assignments link classes to lessons containing questions
- Submissions contain student responses with AI-generated scores/feedback
- Mastery table tracks student progress by skill tags

## Development Commands

### Full Environment
```bash
# Start all services with Docker Compose
docker compose up --build -d

# View logs for all services
docker compose logs -f

# Stop all services
docker compose down
```

### Individual Service Development
```bash
# API service (Node.js)
cd services/api
npm install
npm start

# Web service (React)
cd services/web  
npm install
npm run dev

# AI service (Python)
cd services/ai
pip install -r requirements.txt
uvicorn app:app --host 0.0.0.0 --port 8000
```

### Database Operations
```bash
# Access PostgreSQL directly
docker compose exec db psql -U lms -d lmsdb

# Reset database (recreate with fresh seed data)
docker compose down
docker compose up --build -d db
```

### Testing Endpoints
```bash
# Health checks
curl http://localhost:3001/health    # API
curl http://localhost:8000/health    # AI service

# Authentication endpoints
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"student.demo@example.com","password":"password123"}'

# With authentication token (replace TOKEN with actual JWT)
curl -H "Authorization: Bearer TOKEN" http://localhost:3001/student/dashboard
curl -H "Authorization: Bearer TOKEN" http://localhost:3001/teacher/dashboard

# AI question generation
curl -X POST http://localhost:8000/generate_questions \
  -H "Content-Type: application/json" \
  -d '{"topic":"Fractions","difficulty":1,"skill_tag":"math_fractions","num_questions":3}'
```

## Code Architecture & Patterns

### API Service (`services/api/src/`)
- `index.js`: Main Express app with all route handlers
- `db.js`: PostgreSQL connection pool and query helper
- Routes follow REST patterns: `/student/:id/dashboard`, `/assignments/:id/quiz`, etc.
- Auto-grading logic: MCQ uses exact string matching, short answers call AI service
- Mastery updates: After each submission, recalculates skill mastery percentage

### Web Service (`services/web/src/`)
- `App.jsx`: Main component with authentication, theming, and error boundaries
- `Teacher.jsx`: Teacher dashboard with mobile navigation and analytics
- `TeacherAnalytics.jsx`: Interactive charts and performance metrics
- `Timer.jsx`: Quiz countdown with visual warnings and auto-submission
- `ThemeContext.jsx` & `ThemeToggle.jsx`: Dark/light mode switching
- `MobileUtils.jsx`: Mobile-responsive components and touch utilities
- `FormValidation.jsx`: Real-time validation with success/error states
- `Toast.jsx`: Non-intrusive notification system
- `api.js`: API client functions with authentication
- State management: React Context API with hooks
- Styling: CSS with mobile-first responsive design

### AI Service (`services/ai/`)
- `app.py`: FastAPI app with two main endpoints:
  - `/grade_short_answer`: Keyword-based rubric scoring
  - `/recommend_next`: Simple rule-based lesson recommendations
- Current AI logic is rule-based/keyword matching (prototype stage)
- Designed for easy replacement with actual ML models

### Database Patterns
- Foreign key relationships maintain referential integrity  
- JSON columns for flexible data (question options, rubric keywords)
- Mastery tracking uses UPSERT pattern for skill progress updates
- Seed data provides working demo (teacher Ms. Rivera, students Ava & Ben)

## Environment Configuration

Required environment variables in `.env`:
- `DB_USER`: PostgreSQL username
- `DB_PASSWORD`: PostgreSQL password  
- `DB_NAME`: Database name

Copy `.env.example` to `.env` and modify as needed.

## Service URLs & Ports
- Web UI: http://localhost:5173
- API: http://localhost:3001 (mapped from internal 8080)
- AI Service: http://localhost:8000  
- Database: localhost:5432

## Key Files to Understand
- `docker-compose.yml`: Service orchestration and port mapping
- `services/db/init.sql`: Complete database schema and seed data
- `services/api/src/index.js`: Main API logic including auto-grading
- `services/web/src/App.jsx`: Frontend component structure
- `services/ai/app.py`: AI service endpoints and grading logic

When modifying this codebase, pay attention to the data flow between services and ensure API contracts between services remain consistent.
