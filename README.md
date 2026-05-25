# ResumAI — AI-Powered Resume Analyzer

A full-stack, production-ready resume analyzer for students, job seekers, and professionals.

## ✨ Features
- 📄 **Resume Upload** — PDF & DOCX with drag-and-drop
- 🧠 **NLP Parsing** — spaCy-based extraction (name, skills, education, experience)
- 📊 **ATS Score** — 5-dimension rule engine (0–100)
- 🎯 **Keyword Analysis** — TF-IDF + cosine similarity vs. job description
- 🤖 **AI Feedback** — OpenAI GPT-4o (primary) + Google Gemini (fallback)
- 📝 **Grammar Check** — LanguageTool API integration
- 📥 **PDF Export** — Downloadable formatted analysis report
- 🔐 **Auth** — Email/password + Google OAuth
- 🛡️ **Admin Panel** — User management + audit logs

## 🛠️ Tech Stack
| Layer | Stack |
|-------|-------|
| Frontend | React 18 + Vite + Recharts + Zustand |
| Backend | Flask + SQLAlchemy + Flask-Migrate + JWT |
| Database | PostgreSQL 16 |
| NLP | spaCy `en_core_web_sm` |
| ML | scikit-learn (TF-IDF + Cosine Similarity) |
| AI | OpenAI GPT-4o + Google Gemini 1.5 Flash |

## 🚀 Quick Start (Local with Docker)

### Prerequisites
- Docker Desktop installed and running

### 1. Clone & Configure
```bash
cd ResumAI
cp backend/.env.example backend/.env
```
Edit `backend/.env` and fill in your API keys.

### 2. Start All Services
```bash
docker-compose up --build
```

### 3. Access
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **Health Check**: http://localhost:5000/api/health

---

## 🖥️ Local Dev (Without Docker)

### Simplest Way (One-Command Start)
From the project root directory, you can install and launch both the frontend and backend automatically:

```bash
# Step 1: Install orchestrator dependencies
npm install

# Step 2: Start both Frontend and Backend
npm start
```
*Note: This automatically verifies Python, installs frontend dependencies if missing, and runs both servers simultaneously on ports 3000 and 5000.*

---

### Manual Start (Alternative)

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt
python -m spacy download en_core_web_sm

cp .env.example .env           # Fill in values

flask db init
flask db migrate -m "initial"
flask db upgrade

python run.py
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## 📡 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register with email/password |
| POST | `/api/auth/login` | Login → JWT tokens |
| GET | `/api/auth/google` | Start Google OAuth |
| POST | `/api/resume/upload` | Upload PDF/DOCX |
| GET | `/api/resume/list` | List user's resumes |
| DELETE | `/api/resume/:id` | Delete resume |
| POST | `/api/analysis/analyze` | Run full AI analysis |
| GET | `/api/analysis/:id` | Get analysis results |
| GET | `/api/analysis/history` | Analysis history |
| GET | `/api/analysis/:id/export-pdf` | Download PDF report |
| GET | `/api/admin/stats` | Admin statistics |
| GET | `/api/admin/users` | List all users |

---

## 🔑 Environment Variables

Copy `backend/.env.example` to `backend/.env` and fill in:

```env
OPENAI_API_KEY=sk-...          # Get at platform.openai.com
GEMINI_API_KEY=...             # Get at aistudio.google.com
GOOGLE_CLIENT_ID=...           # Google OAuth credentials
GOOGLE_CLIENT_SECRET=...
SECRET_KEY=your-random-secret
JWT_SECRET_KEY=another-secret
```

> **Note**: OpenAI and Gemini keys are both optional. If neither is set, the system falls back to mock AI feedback so you can test the full flow.

---

## 🏗️ Project Structure

```
ResumAI/
├── docker-compose.yml
├── backend/
│   ├── run.py
│   ├── requirements.txt
│   ├── Dockerfile
│   └── app/
│       ├── __init__.py        # App factory
│       ├── config.py
│       ├── extensions.py
│       ├── models/            # SQLAlchemy ORM
│       ├── routes/            # Flask blueprints
│       ├── services/          # AI pipeline
│       └── utils/
└── frontend/
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── App.jsx            # Router
        ├── pages/             # Route-level pages
        ├── components/        # Reusable UI
        ├── services/api.js    # Axios client
        ├── store/             # Zustand state
        └── styles/global.css  # Design system
```
