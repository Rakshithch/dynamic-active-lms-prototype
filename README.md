# Dynamic Active — LMS Prototype (Rakshith Chandupatla)

A K–12 LMS prototype that demonstrates:
- Student dashboard with **AI recommendation**
- Quiz player (MCQ + short answer) with **AI grading & feedback**
- Teacher dashboard to **create assignments**, view **results & insights**

## Stack
- **Web**: React + Vite
- **API**: Node.js (Express) + PostgreSQL
- **AI**: FastAPI (Python) – rubric-keyword scoring + simple recommendation
- **Infra**: Docker Compose

## Quick Start
```bash
# 1) Configure env
cp .env.example .env

# 2) Start all services
docker compose up --build -d

# 3) Open:
# Web: http://localhost:5173
# API: http://localhost:8080/health
# AI:  http://localhost:8000/health
