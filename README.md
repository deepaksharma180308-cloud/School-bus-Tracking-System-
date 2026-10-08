# School Bus Tracking System

## Project Structure
```
school-bus-tracking/
├── backend/         # Node.js + Express + Socket.io
└── frontend/        # React + Vite
```

## Quick Start (Local Development)

### Step 1: Install Backend
```bash
cd backend
npm install
```

### Step 2: Install Frontend
```bash
cd frontend
npm install
```

### Step 3: Run Backend (Terminal 1)
```bash
cd backend
npm run dev
# Server starts at http://localhost:5000
```

### Step 4: Run Frontend (Terminal 2)
```bash
cd frontend
npm run dev
# App starts at http://localhost:3000
```

---

## 🔐 Demo Login Credentials

| Role      | Email                     | Password     |
|-----------|---------------------------|--------------|
| Admin     | admin@school.com          | admin123     |
| Driver    | driver@school.com         | driver123    |
| Conductor | conductor@school.com      | conductor123 |
| Parent 1  | parent1@school.com        | parent123    |
| Parent 2  | parent2@school.com        | parent123    |

---

## Features

1. **Live Bus Location** - Real-time GPS sharing with OpenStreetMap
2. **QR Check-In** - Camera QR scanner for student boarding/dropping
3. **Parent Notifications** - Real-time alerts via Socket.io
4. **SOS Button** - Emergency alert to all stakeholders
5. **Driver Details** - View driver profile, contact, license
6. **Feedback System** - Star rating + comments with admin view

---

## Deployment

### Backend (Railway / Render / Fly.io)
1. Create account at https://railway.app
2. New project → "Deploy from GitHub" or "Empty project"
3. Add environment variable: `PORT=5000`
4. Deploy the `backend/` folder

### Frontend (Vercel / Netlify)
1. Create account at https://vercel.com
2. Import GitHub repo, set root directory to `frontend/`
3. Add environment variable: `VITE_API_URL=https://your-backend.railway.app`
4. Update `vite.config.js` proxy target to your deployed backend URL

### Free Tier Options
- **Backend**: Railway.app (free tier), Render.com (free tier)
- **Frontend**: Vercel (free), Netlify (free)
- **No paid APIs needed** — OpenStreetMap is completely free!
