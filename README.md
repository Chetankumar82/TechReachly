# TechReachly 🚀
### AI-Powered Cold Outreach & Recruiter Intelligence Platform

TechReachly is an enterprise-grade full-stack platform engineered for software engineers, tech professionals, and active job seekers to automate highly personalized, high-converting cold outreach cadences directly to verified tech recruiters and HR leaders.

---

## 🌟 Key Highlights & Capabilities

### 1. 🤖 AI Pitch Generator & Tone Presets
- Generates 3-step personalized cold email cadences (Step 1 Hook & Value, Step 2 Follow-up Proof, Step 3 Polite Breakup).
- Multi-model Gemini fallback architecture (`gemini-2.5-flash`, `gemini-1.5-flash`, and offline deterministic human fallbacks).
- 4 tailored copywriting personas:
  - ⚡ **Direct & Crisp (`<75 Words`)**: Zero fluff, direct hook for busy engineering leaders.
  - 📊 **Metrics & Scale**: Quantitative engineering achievements (latency reduction, throughput, scaling).
  - 🎓 **Fresher / Fast Learner**: Proof of work, Git commit hygiene, and production eagerness.
  - ☕ **Startup Casual**: Conversational peer-to-peer developer dialogue.

### 2. ⚡ AI Subject Line & Open-Rate Optimizer
- Generates 3 distinct high-converting subject line archetypes for any JD.
- Live Algorithmic Predictor scoring open rate probability (0–100%) and spam risk based on capitalization, spam trigger keywords, length, and personalized urgency.

### 3. 🛡️ Mailbox Health & DNS Deliverability Auditor
- Real-time DNS diagnostics querying MX, SPF (`v=spf1`), and DMARC (`v=DMARC1`) records.
- Active SSL/TLS handshake with configured SMTP relay servers.
- Calculates overall Deliverability Grade (Grade A+ to D) with actionable recommendations to prevent spam filtering.

### 4. 📬 Live Open Tracking & Read Receipts
- Embeds invisible 1x1 zero-cache PNG telemetry tracking pixels into outreach emails.
- Records exact open counts, device user-agents, IP addresses, and timestamps.
- Displays live read status badges (`Opened 2x`, `Unopened`) across campaign dashboards.

### 5. 👥 HR Recruiter Intelligence Directory
- Filter by hiring status (`Actively Hiring`, `Talent Partner`, `Lead Recruiter`).
- Instant search by company, name, location, and technical domain.
- 1-Click CSV export and permanent cascade deletion.

### 6. 🔄 Campaign Management & 1-Click Duplicate
- Clone high-performing campaigns with 1 click to target new recruiter batches without re-entering cadences.
- Send realistic test previews to your own personal inbox before launching.
- Background cron scheduler enforcing 3–5 min pacing jitter and daily warmup caps.

### 7. 🎨 Stitch "Precision Intelligence" Brand Identity
- Custom vector mark with upward reach supersonic arrow, concentric AI radar waves, and glowing cyan apex spark.
- Continuous curvature macOS/iOS squircle app icon.
- Reactive dark & light mode styling.

---

## 🛠️ Architecture & Tech Stack

```
TechReachly/
├── client/                     # React + Vite Frontend
│   ├── src/
│   │   ├── components/         # Navbar, Logo, StatCards, Modals
│   │   ├── pages/              # Dashboard, Directory, CampaignWizard, Settings
│   │   ├── context/            # AuthContext, ThemeContext
│   │   └── services/           # Axios API client
│   └── index.html
│
└── server/                     # Node.js + Express Backend
    ├── src/
    │   ├── controllers/        # Auth, HR, Campaign, Analytics controllers
    │   ├── models/             # User, HR, Campaign, Activity MongoDB schemas
    │   ├── routes/             # RESTful API routing
    │   ├── services/           # Gemini AI, Mailer, Deliverability Audit, Scheduler
    │   └── utils/              # AES-256 encryption, DNS resolvers
    └── index.js
```

- **Frontend:** React 18, Vite, Tailwind CSS, Lucide Icons, Plus Jakarta Sans.
- **Backend:** Node.js, Express, MongoDB (Mongoose), Nodemailer, Node DNS Promises.
- **Security:** JWT authentication, AES-256-CBC credential encryption, Helmet, CORS.

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [MongoDB](https://www.mongodb.com/) (running locally or MongoDB Atlas)
- Gmail / SMTP credentials (with Google App Password)

### 1. Clone the Repository
```bash
git clone https://github.com/Chetankumar82/TechReachly.git
cd TechReachly
```

### 2. Configure & Run Backend Server
```bash
cd server
npm install
cp .env.example .env
```

Configure your `.env`:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/techreachly
JWT_SECRET=your_jwt_secret_key_here
GEMINI_API_KEY=your_gemini_api_key_optional
CLIENT_URL=http://localhost:5173
ENCRYPTION_KEY=32_character_hex_secret_key_2026_techreach
```

Start backend:
```bash
node src/index.js
# Server running on http://localhost:5000
```

### 3. Configure & Run Frontend Client
```bash
cd ../client
npm install
npm run dev
# Vite dev server running on http://localhost:5173
```

---

## 🧪 Testing

Run comprehensive end-to-end API tests:
```bash
cd server
node test_all_features.js
```

Compile production client bundle:
```bash
cd client
npm run build
```

---

## 📄 License
MIT License. Created by [Chetankumar82](https://github.com/Chetankumar82).
