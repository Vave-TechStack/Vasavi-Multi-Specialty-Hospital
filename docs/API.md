# API Reference

Base URL: `http://localhost:4000/api`

Authenticated routes require `Authorization: Bearer <jwt>`.

| Method | Route | Access | Purpose |
|---|---|---|---|
| POST | `/auth/login` | Public | Exchange email/password for JWT |
| POST | `/public/appointment-requests` | Public, rate-limited | Submit website appointment request |
| POST | `/public/contact-requests` | Public, rate-limited | Submit website contact request |
| GET | `/health` | Public | Service health |
| GET | `/dashboard` | Authenticated | Live dashboard counters |
| GET | `/patients` | Authenticated | List recent patients |
| POST | `/patients` | Admin, receptionist | Register patient |
| GET | `/appointments` | Authenticated | List appointments |
| POST | `/appointments` | Authenticated | Book appointment |
| PATCH | `/appointments/:id/status` | Authenticated | Update workflow status |

Authenticated Socket.IO clients receive `patient:created`, `appointment:created`, `appointment:updated`, and `appointment-request:created`.

All mutation payloads are validated with Zod. Expand route modules under `backend/src` as business rules mature.
