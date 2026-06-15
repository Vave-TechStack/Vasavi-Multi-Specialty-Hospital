# Vasavi Multi Specialty Hospital

A production-shaped hospital website and Hospital Management CRM built with Next.js 15, Express, PostgreSQL, Prisma, JWT/RBAC, and Socket.IO.

## Included

- Premium, responsive public website with appointments, doctors, departments, testimonials, articles, contact, SEO metadata, sitemap, robots, and medical organization schema
- Role-demo CRM for admin, doctor, receptionist, and accountant workflows
- Patient, appointment, doctor, billing, pharmacy, laboratory, HR, ward, emergency, reports, and settings modules
- Express API with Zod validation, JWT authorization, RBAC, Helmet, rate limiting, audit logs, and live Socket.IO events
- Multi-branch-ready PostgreSQL schema, seed accounts, Docker Compose, and CI workflow

## Quick Start

```bash
docker compose -f docker/docker-compose.yml up --build
```

Or run services locally:

```bash
cd frontend && npm install && npm run dev
cd backend && npm install && npm run prisma:generate && npm run dev
```

Copy each `.env.example` to `.env` first. Demo password for all seeded accounts is `Admin@123`.
The login and appointment forms require the backend and PostgreSQL services to be running.

| Role | Email |
|---|---|
| Admin | admin@vasavihospital.com |
| Doctor | doctor@vasavihospital.com |
| Receptionist | reception@vasavihospital.com |
| Accountant | accounts@vasavihospital.com |

See [docs/API.md](docs/API.md) and [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).
