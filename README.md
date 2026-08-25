# IT HUNT Backend REST API (`ithunt-api`)

Production-ready, high-performance REST API backend for **IT HUNT | Software Solutions & Tech Academy** (Holagarh, Prayagraj, UP). Serving online admissions, job applications, student reviews & moderation, NIELIT project tracking, event RSVPs, course catalog, JWT authentication, and SuperAdmin executive metrics.

---

## 🚀 Technical Features

- **Runtime & Language**: Node.js v22+ (ES Modules)
- **Framework**: Express.js
- **Database Architecture**: Unified database layer supporting MongoDB connection or zero-dependency local persistent JSON storage.
- **Authentication**: JWT (JSON Web Tokens) with `bcryptjs` password hashing & Role-Based Access Control (`student`, `faculty`, `admin`, `superadmin`).
- **Security & Middlewares**: `helmet`, `cors`, `express-rate-limit`, request logging with `morgan`.
- **API Documentation**: OpenAPI / Swagger UI served dynamically at `/api-docs`.
- **Automated Tests**: Unit & Integration tests powered by `jest` & `supertest`.

---

## 🛠️ Installation & Setup

1. **Clone & Install Dependencies**:
```bash
cd ithunt-api
npm install
```

2. **Configure Environment Variables**:
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

3. **Start Development Server**:
```bash
npm run dev
```
The server will start at `http://localhost:3000`.

4. **Run Test Suite**:
```bash
npm test
```

---

## 📑 Default SuperAdmin Credentials

Upon first launch, the database automatically seeds a SuperAdmin director account:
- **Email**: `[EMAIL_ADDRESS]`
- **Password**: `admin@ithunt2026`

---

## 📡 API Endpoint Overview

| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/health` | Server uptime & status check | Public |
| `GET` | `/api-docs` | Interactive Swagger API Documentation | Public |
| `POST` | `/api/auth/register` | Register a new student/applicant | Public |
| `POST` | `/api/auth/login` | Authenticate & get JWT token | Public |
| `GET` | `/api/auth/me` | Fetch currently logged in user profile | Bearer Token |
| `POST` | `/api/admissions` | Submit online admission registration | Public |
| `GET` | `/api/admissions` | Fetch all admissions list | Admin / SuperAdmin |
| `GET` | `/api/admissions/:id/slip` | Generate digital admission registration slip | Public |
| `POST` | `/api/careers/apply` | Submit job or faculty application | Public |
| `GET` | `/api/reviews` | Fetch public verified student reviews | Public |
| `POST` | `/api/reviews` | Submit new student review | Public |
| `POST` | `/api/nielit-projects` | Submit NIELIT O/A Level project | Public |
| `POST` | `/api/events/rsvp` | RSVP for workshops & hackathons | Public |
| `GET` | `/api/courses` | Fetch course catalog | Public |
| `GET` | `/api/admin/stats` | SuperAdmin executive statistics | Admin / SuperAdmin |

---

## 📄 License & Attribution

- **Organization**: IT HUNT Institute of Computer Technology & Software Solutions
- **Director & Founder**: Mr. Lakshman Singh Chauhan | MCA
- **Co-Founder & Lead Software Architect**: Anup Mishra
