# Bihar Board Class 10 Online Test Platform

A full-stack, production-ready examination and quiz preparation platform designed for BSEB (Bihar School Examination Board) Class 10 candidates. This system features dual dashboards (Student Workstation and Administrator Console), streak trackers, state-wide leaderboard standings, graphical progress reporting, and bulk data uploads using Excel sheets.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, React Router v6, Redux Toolkit (State Management), TanStack Query v5 (Data Fetching), Recharts (Progress Analytics), Framer Motion (Animations), Tailwind CSS.
- **Backend**: Node.js, Express.js, MongoDB (Mongoose schemas), JWT Authentication (Access & Refresh tokens), bcrypt (Security), Multer (Excel file capture), Nodemailer (Mock notifications).
- **Reporting**: Excel generation and imports (`xlsx`), PDF report rendering (`jspdf`/`html2canvas`).

---

## 📁 Folder Structure

```
a:/test10th/
├── README.md                  # Project Documentation
├── client/                    # Frontend React Vite Client
│   ├── index.html             # Client HTML Wrapper
│   ├── package.json           # Client packages
│   ├── tailwind.config.js     # Tailwind setup
│   ├── vite.config.js         # Reverse Proxy configured to :5000
│   └── src/
│       ├── main.jsx           # App Bootstrap & Routes Layout
│       ├── index.css          # Styling & Webkit custom scrollbars
│       ├── assets/            # Theme assets
│       ├── components/        # Sleek widgets & ToastContext Alerts
│       ├── layouts/           # Panel dividers (Auth, Student, Admin)
│       ├── pages/             # Interface Pages (Exam attempt, CRUD panels)
│       ├── redux/             # Redux Slices (Auth, Theme switches)
│       ├── hooks/             # Custom triggers (useAuth, useTheme)
│       └── constants/         # Static district lists
└── server/                    # Backend Node Express Server
    ├── package.json           # Server packages
    ├── server.js              # Express main file
    ├── config/                # Database connections
    ├── models/                # 11 Mongoose Schemas
    ├── routes/                # Express API endpoints
    ├── controllers/           # API handlers (Scoring, Excel parser)
    ├── middlewares/           # JWT verification, Role authorization
    ├── scripts/               # Seed file to populate Bihar content
    └── utils/                 # JWT tokens helper
```

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18+)
- MongoDB Community Server (Running on localhost port `27017`)

---

### Step 1: Seed the Database

1. Navigate to the `/server` folder.
2. Verify that your MongoDB service is running locally.
3. Run the database seed script:
   ```bash
   node scripts/seed.js
   ```
   *This script drops old collections, creates seed subjects (Mathematics, Science, etc.) with chapters, registers mock questions, creates exams, and configures default logins.*

---

### Step 2: Start the Backend API Server

1. From the `/server` folder, start the development server:
   ```bash
   npm run dev
   ```
   *The server binds to port `5000` (`http://localhost:5000`). All security policies, helmet headers, and express rate limits are loaded automatically.*

---

### Step 3: Run the Frontend Client

1. Navigate to the `/client` folder.
2. Start the Vite React development server:
   ```bash
   npm run dev
   ```
   *The client starts on port `5173` (`http://localhost:5173`). In development, Vite will automatically reverse-proxy requests starting with `/api` to the backend server.*

---

## 🔑 Default Credentials (For Testing)

1. **Student Account**:
   - **Email**: `student@biharboard.org`
   - **Password**: `studentpassword123`
   - *Use this to attempt tests, view streaks, charts, and check the leaderboard.*

2. **Administrator Account**:
   - **Email**: `admin@biharboard.org`
   - **Password**: `adminpassword123`
   - *Use this to add/edit students, import question pools, and inspect scorecards.*

---

## 📊 Bulk Upload Excel Columns

### 1. Student Bulk Upload (`/admin/students`)
Create an Excel file with the first sheet containing the following column headers:
- **FullName** (e.g. Rahul Kumar)
- **Email** (e.g. rahul@gmail.com)
- **Password** (e.g. securepass123)
- **RollNumber** (e.g. 260015)
- **SchoolName** (e.g. Miller High School, Patna)
- **District** (e.g. Patna)
- **Block** (e.g. Patna Sadar)
- **MobileNumber** (e.g. 9876543210)
- **ParentName** (e.g. Ramesh Singh)
- **ParentMobile** (e.g. 9876543211)

### 2. Question Bank Upload (`/admin/questions`)
Create an Excel file with the first sheet containing the following column headers:
- **QuestionText** (e.g. What is sin 90°?)
- **Options** (e.g. `0, 1, -1, 2` - Comma-separated choice values)
- **CorrectOptionIndex** (e.g. `1` - 0-indexed correct key. Option B is correct)
- **Explanation** (e.g. Trigonometric identity value of sin 90 is 1)
- **Difficulty** (e.g. easy, medium, hard)
- **SubjectName** (e.g. Mathematics)
- **ChapterName** (e.g. Trigonometry)

---

## 🔌 API Endpoints Reference

### 1. Authentication
- `POST /api/auth/register` (Register student)
- `POST /api/auth/login` (Admin/Student sessions)
- `POST /api/auth/refresh-token` (JWT tokens rotating check)
- `POST /api/auth/logout` (Invalidate refresh token)
- `PUT /api/auth/change-password` (Update current password)
- `POST /api/auth/forgot-password` (Password recovery codes)
- `POST /api/auth/reset-password` (Update password via token)

### 2. Student Dashboard & Activity
- `GET /api/students/profile` (Get profile info)
- `PUT /api/students/profile` (Update info / Photo uploads)
- `GET /api/students/dashboard` (Streak, Rank, Today's test logs)
- `GET /api/students/progress` (Progress line / Bar charts logs)
- `GET /api/students/leaderboard` (State-wide standings list)
- `GET /api/students/results` (Attempts history)
- `GET /api/students/results/:id` (Populate answers & teacher explanations)

### 3. Exam Templates
- `GET /api/tests/student` (Available, upcoming, completed tests)
- `GET /api/tests/:id` (Get exam paper - strips answers for students)
- `POST /api/tests/:id/submit` (Score exam, updates streaks, and progress records)

### 4. Admin Management
- `GET /api/admin/dashboard` (Counters, subject stats charts, operator logs)
- `GET /api/admin/students` (Roster, filter search)
- `POST /api/admin/students` (Add candidate manually)
- `PUT /api/admin/students/:id` (Edit details)
- `DELETE /api/admin/students/:id` (Deletes student and tests logs)
- `PUT /api/admin/students/:id/suspend` (Blocks portal log-ins)
- `POST /api/admin/students/bulk-import` (Multer Excel sheets upload)
- `GET /api/admin/students/export` (Excel sheets export downloader)
- `GET /api/admin/results` (Overall results roster)
