# Production Deployment

## Required configuration

- Set a long random `JWT_SECRET`.
- Use a managed PostgreSQL 16 instance and a least-privilege database user.
- Set `FRONTEND_URL`, `NEXT_PUBLIC_API_URL`, and `NEXT_PUBLIC_SOCKET_URL` to HTTPS origins.
- Pass `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_SOCKET_URL` as frontend image build arguments; public Next.js variables are embedded at build time.
- Put both services behind a TLS reverse proxy and enable persistent Socket.IO connections.

## Release process

1. Build immutable frontend and backend images.
2. Create and review Prisma migrations, then run `npm run prisma:migrate` from the backend image before traffic is shifted.
3. Deploy the backend, confirm `/api/health`, then deploy the frontend.
4. Run smoke tests for login, appointment creation, patient registration, billing, and real-time events.
5. Seed demo data only in non-production environments.

## Production controls

- Store secrets in a managed secret store; never commit `.env`.
- Enable encrypted backups and perform restore drills.
- Add object storage and malware scanning for patient documents.
- Connect an approved SMS/email provider and retain delivery logs.
- Add CSRF protection when using cookie-based authentication.
- Prefer secure, HTTP-only cookies over browser local storage before handling real patient data.
- Forward audit logs to immutable centralized storage.
- Perform clinical workflow validation, accessibility testing, penetration testing, and applicable regulatory review before handling real patient data.
