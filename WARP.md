# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

Dynamic Active LMS is a K-12 Learning Management System prototype featuring:
- Student dashboard with AI-powered recommendations
- Quiz system with MCQ and short answer questions
- AI-powered grading with rubric-based feedback
- Teacher dashboard for assignment creation and analytics
- Mastery tracking system

## Architecture

This is a microservices-based application with 4 main services:

### Service Architecture
- **Web** (`services/web/`): React + Vite frontend (port 5173)
- **API** (`services/api/`): Node.js/Express backend (port 8080)
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
curl http://localhost:8080/health    # API
curl http://localhost:8000/health    # AI service

# Student dashboard (Ava = user ID 2)
curl http://localhost:8080/student/2/dashboard

# Teacher dashboard (Ms. Rivera = user ID 1)
curl http://localhost:8080/teacher/1/dashboard
```

## Code Architecture & Patterns

### API Service (`services/api/src/`)
- `index.js`: Main Express app with all route handlers
- `db.js`: PostgreSQL connection pool and query helper
- Routes follow REST patterns: `/student/:id/dashboard`, `/assignments/:id/quiz`, etc.
- Auto-grading logic: MCQ uses exact string matching, short answers call AI service
- Mastery updates: After each submission, recalculates skill mastery percentage

### Web Service (`services/web/src/`)
- `App.jsx`: Main component with role switching (student/teacher views)
- `Teacher.jsx`: Teacher dashboard and assignment creation
- `api.js`: API client functions
- State management: React hooks, no external state library
- Styling: Simple CSS classes in `styles.css`

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
- API: http://localhost:8080
- AI Service: http://localhost:8000  
- Database: localhost:5432

## Key Files to Understand
- `docker-compose.yml`: Service orchestration and port mapping
- `services/db/init.sql`: Complete database schema and seed data
- `services/api/src/index.js`: Main API logic including auto-grading
- `services/web/src/App.jsx`: Frontend component structure
- `services/ai/app.py`: AI service endpoints and grading logic

When modifying this codebase, pay attention to the data flow between services and ensure API contracts between services remain consistent.
