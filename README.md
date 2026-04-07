<div align="center">

<img src="public/examizLogo.png" alt="Examiz Logo" height="80" />

# Examiz

**Smart Online Examination Platform for Institutions**

[![Next.js](https://img.shields.io/badge/Next.js-16.2-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![Prisma](https://img.shields.io/badge/Prisma-7.5-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-336791?style=flat-square&logo=postgresql)](https://supabase.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38BDF8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com)

*Built for colleges, coaching institutes, and teachers — create tests, manage students, and analyse results all in one place.*

</div>

---

## ✨ Features

### 🏫 For Organizations
- **Test Creation** — Build multi-section tests with question images, solution images, and per-section marking schemes
- **4 Question Types** — Single Correct, Multiple Correct, Matrix Match, Integer Type, and Numerical Value (with fixed or range answers)
- **Draft System** — Save and resume test creation at any time without losing progress
- **Bulk Image Upload** — Upload all question/solution images at once per section or across the entire test
- **Live Test Control** — Toggle tests live/offline, set start/end times, and monitor students in real time
- **Class Management** — Create classes, enroll students, and assign tests to specific classes
- **Answer Key Modal** — View the full answer key for any test at a glance
- **Results & Export** — View per-student results and export class data to Excel

### 👨‍🎓 For Students
- **Secure Test Window** — Fullscreen-enforced exam environment with warning system for tab switching
- **Virtual Keypad** — On-screen numeric keypad for integer and numerical value questions
- **Real-time Sync** — Answers auto-sync every 15 seconds; remaining time saved every 60 seconds
- **Resume Support** — Students can request to resume a disconnected attempt (with org approval)
- **Detailed Analysis** — Post-test breakdown with correct/wrong/unattempted stats, time spent per question, and graphical charts

### 📊 Analytics
- Subject-wise performance breakdown
- Question-wise time distribution
- Score trend charts
- Comparison against JEE Mains statistics

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 |
| Database | PostgreSQL (Supabase) |
| ORM | Prisma 7 |
| Auth | JWT + HTTP-only cookies |
| Image Storage | Cloudinary |
| Charts | Recharts |
| Animations | Framer Motion |
| Email | Nodemailer |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (or a [Supabase](https://supabase.com) project)
- Cloudinary account

### Installation

```bash
# Clone the repository
git clone https://github.com/amanrj03/Examiz.git
cd Examiz

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
```

### Environment Variables

Fill in your `.env` file:

```env
DATABASE_URL=postgresql://...
JWT_SECRET=your_jwt_secret

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

### Database Setup

```bash
# Run migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate
```

### Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 📁 Project Structure

```
├── app/
│   ├── (auth)/              # Login, register, forgot password
│   ├── api/                 # API routes (attempts, auth, tests, org)
│   ├── dashboard/           # Organization dashboard
│   ├── test/[attemptId]/    # Live test window
│   ├── analyse/[attemptId]/ # Post-test analysis
│   └── student/             # Student dashboard
├── components/              # Shared UI components
├── lib/                     # Prisma client, auth, utilities
├── prisma/                  # Schema and migrations
└── services/                # Axios API service layer
```

---

## 🔐 Roles

| Role | Access |
|---|---|
| **Organization** | Create/manage tests, classes, students, view results |
| **Student** | Take assigned tests, view own analysis |

---

## 📝 Question Types

| Type | Description |
|---|---|
| Single Correct | One correct option from A–D |
| Multiple Correct | One or more correct options, partial marking supported |
| Matrix Match | Single correct from A–D (matrix format) |
| Integer Type | Exact whole number answer |
| Numerical Value | Decimal answer up to 2 places; supports fixed or range correct answer |

---

## 📄 License

This project is private. All rights reserved.

---

<div align="center">
  Made with ❤️ for smarter examinations
</div>
