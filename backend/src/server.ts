import dotenv from 'dotenv';
import path from 'path';
import { randomUUID } from 'crypto';
import http from 'http';
import express, { NextFunction, Request, RequestHandler, Response } from 'express';

dotenv.config({ path: path.resolve(__dirname, '../.env'), override: true });
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Server } from 'socket.io';
import { PrismaClient } from './generated/client';
import { z, ZodError } from 'zod';
import { seed } from './seed';

const prisma = new PrismaClient();
const app = express();
const server = http.createServer(app);
const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:3000';
const configuredSecret = process.env.JWT_SECRET;

if (process.env.NODE_ENV === 'production' && !configuredSecret) {
  throw new Error('JWT_SECRET is required in production');
}

const secret = configuredSecret || 'development-only-secret';
const io = new Server(server, { cors: { origin: allowedOrigin } });
const startOfToday = new Date();
startOfToday.setHours(0, 0, 0, 0);
const asyncRoute = (handler: RequestHandler): RequestHandler => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({ origin: allowedOrigin, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use('/api', rateLimit({ windowMs: 60_000, limit: 180, standardHeaders: true, legacyHeaders: false }));

type SessionUser = { id: string; role: string };
type AuthRequest = Request & { user?: SessionUser };

function readToken(value?: string) {
  return value?.match(/^Bearer\s+(.+)$/i)?.[1];
}

function auth(roles?: string[]): RequestHandler {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const token = readToken(req.headers.authorization);
    if (!token) return res.status(401).json({ message: 'Authentication required' });
    try {
      const user = jwt.verify(token, secret, { issuer: 'vasavi-api', audience: 'vasavi-crm' }) as SessionUser;
      if (roles && !roles.includes(user.role)) return res.status(403).json({ message: 'Insufficient permission' });
      req.user = user;
      next();
    } catch {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
  };
}

const loginLimiter = rateLimit({ windowMs: 15 * 60_000, limit: 10, standardHeaders: true, legacyHeaders: false });
const loginSchema = z.object({ email: z.string().email(), password: z.string().min(8).max(128) });
app.post('/api/auth/login', loginLimiter, asyncRoute(async (req, res) => {
  const credentials = loginSchema.parse(req.body);
  const user = await prisma.user.findUnique({ where: { email: credentials.email.toLowerCase() }, include: { role: true } });
  if (!user || user.status !== 'ACTIVE' || !(await bcrypt.compare(credentials.password, user.passwordHash))) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }
  const token = jwt.sign({ id: user.id, role: user.role.code }, secret, { expiresIn: '8h', issuer: 'vasavi-api', audience: 'vasavi-crm' });
  return res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role.code } });
}));

app.get('/api/dashboard', auth(), asyncRoute(async (_req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [patients, doctors, appointments, occupiedBeds] = await Promise.all([
    prisma.patient.count(),
    prisma.doctor.count(),
    prisma.appointment.count({ where: { scheduledAt: { gte: today } } }),
    prisma.bed.count({ where: { status: 'OCCUPIED' } }),
  ]);
  res.json({ patients, doctors, appointments, occupiedBeds, updatedAt: new Date() });
}));

const patientSchema = z.object({
  firstName: z.string().trim().min(2).max(80),
  lastName: z.string().trim().min(2).max(80),
  phone: z.string().trim().min(8).max(20),
  dateOfBirth: z.coerce.date().max(new Date()),
  gender: z.string().trim().min(1).max(30),
});
app.get('/api/patients/stats', auth(), asyncRoute(async (_req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const totalPatients = await prisma.patient.count();
  const newThisMonth = await prisma.patient.count({ where: { createdAt: { gte: firstDayOfMonth } } });
  const currentlyAdmitted = await prisma.admission.count({ where: { dischargedAt: null } });
  const dischargedToday = await prisma.admission.count({
    where: {
      dischargedAt: {
        gte: today,
        lt: tomorrow,
      }
    }
  });

  // User requested "Inpatients" to mean people who came just for checkups (not admitted)
  const inpatients = totalPatients - currentlyAdmitted;

  res.json({ totalPatients, newThisMonth, inpatients, dischargedToday });
}));

app.get('/api/patients', auth(), asyncRoute(async (_req, res) => {
  res.json(await prisma.patient.findMany({ 
    include: { admissions: { orderBy: { admittedAt: 'desc' } } },
    orderBy: { createdAt: 'desc' }, 
    take: 100 
  }));
}));

app.get('/api/beds/available', auth(), asyncRoute(async (_req, res) => {
  res.json(await prisma.bed.findMany({
    where: { status: 'AVAILABLE' },
    include: { room: true },
    orderBy: { bedNumber: 'asc' }
  }));
}));

app.post('/api/patients/:id/admit', auth(['SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST']), asyncRoute(async (req: AuthRequest, res) => {
  const { bedId } = req.body;
  if (!bedId) return res.status(400).json({ message: 'bedId is required' });
  
  const result = await prisma.$transaction(async (tx) => {
    const admission = await tx.admission.create({
      data: {
        patientId: req.params.id,
        bedId,
      }
    });
    await tx.bed.update({
      where: { id: bedId },
      data: { status: 'OCCUPIED' }
    });
    return admission;
  });
  await audit(req.user!.id, 'CREATE', 'Admission', result.id, req.ip);
  io.to('authenticated').emit('patient:admitted', result);
  res.status(201).json(result);
}));

app.post('/api/patients/:id/discharge', auth(['SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST']), asyncRoute(async (req: AuthRequest, res) => {
  const patient = await prisma.patient.findUnique({
    where: { id: req.params.id },
    include: { admissions: { where: { dischargedAt: null } } }
  });
  
  if (!patient || patient.admissions.length === 0) {
    return res.status(400).json({ message: 'Patient is not currently admitted' });
  }

  const activeAdmission = patient.admissions[0];
  
  const result = await prisma.$transaction(async (tx) => {
    const admission = await tx.admission.update({
      where: { id: activeAdmission.id },
      data: { dischargedAt: new Date() }
    });
    await tx.bed.update({
      where: { id: activeAdmission.bedId },
      data: { status: 'AVAILABLE' }
    });
    return admission;
  });
  await audit(req.user!.id, 'UPDATE', 'Admission', result.id, req.ip);
  io.to('authenticated').emit('patient:discharged', result);
  res.json(result);
}));
app.post('/api/patients', auth(['SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST']), asyncRoute(async (req: AuthRequest, res) => {
  const data = patientSchema.parse(req.body);
  const patient = await prisma.patient.create({ data: { ...data, patientCode: `VH-${randomUUID().slice(0, 8).toUpperCase()}` } });
  await audit(req.user!.id, 'CREATE', 'Patient', patient.id, req.ip);
  io.to('authenticated').emit('patient:created', patient);
  res.status(201).json(patient);
}));

const appointmentSchema = z.object({
  patientId: z.string().cuid(),
  doctorId: z.string().cuid(),
  departmentId: z.string().cuid(),
  scheduledAt: z.coerce.date().min(startOfToday),
  notes: z.string().trim().max(2000).optional(),
});
app.get('/api/appointments', auth(), asyncRoute(async (_req, res) => {
  res.json(await prisma.appointment.findMany({
    include: { patient: true, doctor: { include: { user: true } }, department: true },
    orderBy: { scheduledAt: 'asc' },
    take: 100,
  }));
}));
app.post('/api/appointments', auth(), asyncRoute(async (req: AuthRequest, res) => {
  const item = await prisma.appointment.create({ data: appointmentSchema.parse(req.body) });
  await audit(req.user!.id, 'CREATE', 'Appointment', item.id, req.ip);
  io.to('authenticated').emit('appointment:created', item);
  res.status(201).json(item);
}));
app.patch('/api/appointments/:id/status', auth(), asyncRoute(async (req: AuthRequest, res) => {
  const status = z.enum(['SCHEDULED', 'CONFIRMED', 'CHECKED_IN', 'IN_CONSULTATION', 'COMPLETED', 'CANCELLED']).parse(req.body.status);
  const item = await prisma.appointment.update({ where: { id: req.params.id }, data: { status } });
  await audit(req.user!.id, 'UPDATE', 'Appointment', item.id, req.ip);
  io.to('authenticated').emit('appointment:updated', item);
  res.json(item);
}));

const requestLimiter = rateLimit({ windowMs: 60 * 60_000, limit: 5, standardHeaders: true, legacyHeaders: false });
const appointmentRequestSchema = z.object({
  patientName: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(8).max(20),
  department: z.string().trim().min(2).max(100),
  preferredDoctor: z.string().trim().max(120).optional(),
  preferredDate: z.coerce.date().min(startOfToday),
});
app.post('/api/public/appointment-requests', requestLimiter, asyncRoute(async (req, res) => {
  const data = appointmentRequestSchema.parse(req.body);
  const department = await prisma.department.findFirst({ where: { name: data.department } });
  const request = await prisma.appointmentRequest.create({
    data: {
      patientName: data.patientName,
      phone: data.phone,
      departmentId: department?.id,
      preferredDoctor: data.preferredDoctor,
      preferredDate: data.preferredDate,
    },
  });
  io.to('authenticated').emit('appointment-request:created', request);
  res.status(201).json({ id: request.id, message: 'Appointment request received' });
}));

const contactRequestSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().max(20).optional(),
  subject: z.string().trim().min(2).max(100),
  message: z.string().trim().min(10).max(3000),
});
app.post('/api/public/contact-requests', requestLimiter, asyncRoute(async (req, res) => {
  const request = await prisma.contactRequest.create({ data: contactRequestSchema.parse(req.body) });
  io.to('authenticated').emit('contact-request:created', request);
  res.status(201).json({ id: request.id, message: 'Contact request received' });
}));

app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'vasavi-api', time: new Date() }));
app.use((_req, res) => res.status(404).json({ message: 'Route not found' }));
app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof ZodError) return res.status(400).json({ message: 'Validation failed', issues: error.flatten() });
  console.error(error);
  return res.status(500).json({ message: 'Unexpected server error' });
});

async function audit(userId: string, action: string, entity: string, entityId: string, ipAddress?: string) {
  await prisma.auditLog.create({ data: { userId, action, entity, entityId, ipAddress } });
}

io.use((socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (typeof token !== 'string') return next(new Error('Authentication required'));
    jwt.verify(token, secret, { issuer: 'vasavi-api', audience: 'vasavi-crm' });
    next();
  } catch {
    next(new Error('Invalid or expired token'));
  }
});
io.on('connection', socket => {
  socket.join('authenticated');
  socket.emit('connected', { time: new Date() });
});

const port = Number(process.env.PORT || 4000);
server.listen(port, async () => {
  console.log(`Vasavi API listening on port ${port}`);
  try {
    await seed();
  } catch (e) {
    console.error('Error during auto-seeding on startup:', e);
  }
});

async function shutdown() {
  server.close();
  await prisma.$disconnect();
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
