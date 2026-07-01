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
import { PrismaClient } from '@prisma/client';
import { z, ZodError } from 'zod';
import { seed } from './seed';

const prisma = new PrismaClient();
const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://vasavi-multi-specialty-hospital-fro.vercel.app'
];

if (process.env.FRONTEND_URL) {
  process.env.FRONTEND_URL.split(',').forEach(url => {
    const trimmed = url.trim();
    if (trimmed && !allowedOrigins.includes(trimmed)) {
      allowedOrigins.push(trimmed);
    }
  });
}

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin) {
      callback(null, true);
      return;
    }
    const isAllowed = allowedOrigins.includes(origin) || 
                      origin.endsWith('.vercel.app') || 
                      /^http:\/\/localhost:\d+$/.test(origin);
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};

const configuredSecret = process.env.JWT_SECRET;

if (process.env.NODE_ENV === 'production' && !configuredSecret) {
  throw new Error('JWT_SECRET is required in production');
}

const secret = configuredSecret || 'development-only-secret';
const io = new Server(server, { cors: corsOptions });
type SessionUser = { id: string; role: string };
type AuthRequest = Request & { user?: SessionUser };

type AsyncRouteHandler = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => Promise<unknown> | unknown;

const startOfToday = new Date();
startOfToday.setHours(0, 0, 0, 0);

const asyncRoute = (handler: AsyncRouteHandler): RequestHandler => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(handler(req as AuthRequest, res, next)).catch(next);
};

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }));
app.use('/api', rateLimit({ windowMs: 60_000, limit: 180, standardHeaders: true, legacyHeaders: false }));

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
  const token = jwt.sign({ id: user.id, role: user.role.code }, secret, { expiresIn: '7d', issuer: 'vasavi-api', audience: 'vasavi-crm' });
  return res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role.code } });
}));

app.get('/api/dashboard', auth(), asyncRoute(async (_req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const [patients, doctors, appointments, occupiedBeds, availableBeds, emergencyActive, labPending] = await Promise.all([
    prisma.patient.count(),
    prisma.doctor.count(),
    prisma.appointment.count({ where: { scheduledAt: { gte: today } } }),
    prisma.bed.count({ where: { status: 'OCCUPIED' } }),
    prisma.bed.count({ where: { status: 'AVAILABLE' } }),
    prisma.emergencyCase.count({ where: { status: 'ACTIVE' } }),
    prisma.labOrder.count({ where: { status: 'PROCESSING' } }),
  ]);

  // Today's revenue from PAID invoices
  const paidInvoices = await prisma.invoice.findMany({ where: { status: 'PAID' } });
  const todayRevenue = paidInvoices.reduce((sum, i) => sum + Number(i.total), 0);

  res.json({
    patients,
    doctors,
    appointments,
    occupiedBeds,
    todayRevenue,
    liveOps: {
      emergencyQueue: emergencyActive,
      bedsAvailable: availableBeds,
      labPending,
    },
    updatedAt: new Date(),
  });
}));

// 7-day patient visit chart
app.get('/api/dashboard/chart', auth(), asyncRoute(async (_req, res) => {
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const results = [];
  for (let i = 6; i >= 0; i--) {
    const dayStart = new Date();
    dayStart.setDate(dayStart.getDate() - i);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayStart.getDate() + 1);
    const count = await prisma.appointment.count({
      where: { scheduledAt: { gte: dayStart, lt: dayEnd } },
    });
    results.push({ d: days[dayStart.getDay()], v: count });
  }
  res.json(results);
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
app.put('/api/patients/:id', auth(['SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST']), asyncRoute(async (req: AuthRequest, res) => {
  const data = patientSchema.parse(req.body);
  const patient = await prisma.patient.update({ where: { id: req.params.id }, data });
  await audit(req.user!.id, 'UPDATE', 'Patient', patient.id, req.ip);
  res.json(patient);
}));
app.delete('/api/patients/:id', auth(['SUPER_ADMIN', 'ADMIN']), asyncRoute(async (req: AuthRequest, res) => {
  const patient = await prisma.patient.delete({ where: { id: req.params.id } });
  await audit(req.user!.id, 'DELETE', 'Patient', patient.id, req.ip);
  res.json({ message: 'Patient deleted successfully' });
}));

// --- Lookup lists for dropdowns ---
app.get('/api/departments', auth(), asyncRoute(async (_req, res) => {
  res.json(await prisma.department.findMany({ orderBy: { name: 'asc' } }));
}));
app.get('/api/doctors-list', auth(), asyncRoute(async (_req, res) => {
  res.json(await prisma.doctor.findMany({ include: { user: true, department: true } }));
}));
app.get('/api/patients-list', auth(), asyncRoute(async (_req, res) => {
  res.json(await prisma.patient.findMany({ orderBy: { firstName: 'asc' } }));
}));
app.get('/api/labtests', auth(), asyncRoute(async (_req, res) => {
  res.json(await prisma.labTest.findMany({ orderBy: { name: 'asc' } }));
}));
app.get('/api/roles', auth(), asyncRoute(async (_req, res) => {
  res.json(await prisma.role.findMany({ orderBy: { name: 'asc' } }));
}));

// --- Appointment CRUD ---
const appointmentSchema = z.object({
  patientId: z.string().cuid(),
  doctorId: z.string().cuid(),
  departmentId: z.string().cuid(),
  scheduledAt: z.coerce.date().min(startOfToday),
  notes: z.string().trim().max(2000).optional(),
  reason: z.string().trim().max(500).optional(),
  amount: z.coerce.number().nonnegative().optional(),
  paymentStatus: z.enum(['PAID', 'PENDING']).optional(),
});
app.get('/api/appointments', auth(), asyncRoute(async (_req, res) => {
  res.json(await prisma.appointment.findMany({
    include: { patient: true, doctor: { include: { user: true } }, department: true },
    orderBy: { scheduledAt: 'asc' },
    take: 100,
  }));
}));
app.get('/api/appointments/stats', auth(), asyncRoute(async (_req, res) => {
  const today = new Date();
  today.setHours(0,0,0,0);
  const [todayCount, waitingCount, completedCount, cancelledCount] = await Promise.all([
    prisma.appointment.count({ where: { scheduledAt: { gte: today } } }),
    prisma.appointment.count({ where: { status: 'SCHEDULED' } }),
    prisma.appointment.count({ where: { status: 'COMPLETED' } }),
    prisma.appointment.count({ where: { status: 'CANCELLED' } }),
  ]);
  res.json({ today: todayCount, waiting: waitingCount, completed: completedCount, cancelled: cancelledCount });
}));
app.post('/api/appointments', auth(), asyncRoute(async (req: AuthRequest, res) => {
  const parsed = appointmentSchema.parse(req.body);
  const { reason, amount, paymentStatus, ...appointmentData } = parsed;

  const result = await prisma.$transaction(async (tx) => {
    // Create the appointment
    const item = await tx.appointment.create({
      data: { ...appointmentData, reason },
    });

    // If an amount is provided, create a linked invoice
    if (amount && amount > 0) {
      const invoiceNumber = `INV-${Math.floor(10000 + Math.random() * 90000)}`;
      const invoiceStatus = paymentStatus === 'PAID' ? 'PAID' : 'ISSUED';
      const description = reason ? `Consultation – ${reason}` : 'Consultation';

      const invoice = await tx.invoice.create({
        data: {
          invoiceNumber,
          patientId: appointmentData.patientId,
          status: invoiceStatus,
          subtotal: amount,
          total: amount,
        },
      });

      await tx.invoiceItem.create({
        data: {
          invoiceId: invoice.id,
          description,
          unitPrice: amount,
          quantity: 1,
          total: amount,
        },
      });

      // If already paid, record a Payment entry as well
      if (paymentStatus === 'PAID') {
        await tx.payment.create({
          data: {
            invoiceId: invoice.id,
            amount,
            method: 'CASH',
          },
        });
      }

      // Notify billing dashboard in real-time
      io.to('authenticated').emit('billing:updated', { invoiceId: invoice.id });
    }

    return item;
  });

  await audit(req.user!.id, 'CREATE', 'Appointment', result.id, req.ip);
  io.to('authenticated').emit('appointment:created', result);
  res.status(201).json(result);
}));
app.put('/api/appointments/:id', auth(), asyncRoute(async (req: AuthRequest, res) => {
  const data = appointmentSchema.parse(req.body);
  const item = await prisma.appointment.update({ where: { id: req.params.id }, data });
  await audit(req.user!.id, 'UPDATE', 'Appointment', item.id, req.ip);
  res.json(item);
}));
app.delete('/api/appointments/:id', auth(['SUPER_ADMIN', 'ADMIN']), asyncRoute(async (req: AuthRequest, res) => {
  const item = await prisma.appointment.delete({ where: { id: req.params.id } });
  await audit(req.user!.id, 'DELETE', 'Appointment', item.id, req.ip);
  res.json({ message: 'Appointment deleted successfully' });
}));
app.patch('/api/appointments/:id/status', auth(), asyncRoute(async (req: AuthRequest, res) => {
  const status = z.enum(['SCHEDULED', 'CONFIRMED', 'CHECKED_IN', 'IN_CONSULTATION', 'COMPLETED', 'CANCELLED']).parse(req.body.status);
  const item = await prisma.appointment.update({ where: { id: req.params.id }, data: { status } });
  await audit(req.user!.id, 'UPDATE', 'Appointment', item.id, req.ip);
  io.to('authenticated').emit('appointment:updated', item);
  res.json(item);
}));

// --- Doctors CRUD ---
const doctorCreateSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email(),
  departmentId: z.string().cuid(),
  qualification: z.string().trim().min(2),
  specialization: z.string().trim().min(2),
  experienceYears: z.coerce.number().int().nonnegative(),
  consultationFee: z.coerce.number().positive(),
  licenseNumber: z.string().trim().min(2),
});
app.get('/api/doctors', auth(), asyncRoute(async (_req, res) => {
  res.json(await prisma.doctor.findMany({
    include: { user: true, department: true },
    orderBy: { user: { name: 'asc' } }
  }));
}));
app.get('/api/doctors/stats', auth(), asyncRoute(async (_req, res) => {
  const [total, active, inConsultation] = await Promise.all([
    prisma.doctor.count(),
    prisma.user.count({ where: { role: { code: 'DOCTOR' }, status: 'ACTIVE' } }),
    prisma.appointment.count({ where: { status: { in: ['IN_CONSULTATION', 'CHECKED_IN'] } } }),
  ]);
  const onLeave = total - active;
  res.json({ totalDoctors: total, onDuty: active, inConsultation, onLeave: onLeave > 0 ? onLeave : 0 });
}));
app.post('/api/doctors', auth(['SUPER_ADMIN', 'ADMIN']), asyncRoute(async (req: AuthRequest, res) => {
  const data = doctorCreateSchema.parse(req.body);
  const passwordHash = await bcrypt.hash('Doctor@123', 12);
  const role = await prisma.role.findUnique({ where: { code: 'DOCTOR' } });
  const branch = await prisma.branch.findFirst();
  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name: data.name,
        email: data.email.toLowerCase(),
        passwordHash,
        roleId: role!.id,
        branchId: branch?.id,
      }
    });
    return await tx.doctor.create({
      data: {
        userId: user.id,
        departmentId: data.departmentId,
        qualification: data.qualification,
        specialization: data.specialization,
        experienceYears: data.experienceYears,
        consultationFee: data.consultationFee,
        licenseNumber: data.licenseNumber,
      }
    });
  });
  await audit(req.user!.id, 'CREATE', 'Doctor', result.id, req.ip);
  res.status(201).json(result);
}));
app.put('/api/doctors/:id', auth(['SUPER_ADMIN', 'ADMIN']), asyncRoute(async (req: AuthRequest, res) => {
  const data = doctorCreateSchema.parse(req.body);
  const doctor = await prisma.doctor.findUnique({ where: { id: req.params.id } });
  if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
  const result = await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: doctor.userId },
      data: { name: data.name, email: data.email.toLowerCase() }
    });
    return await tx.doctor.update({
      where: { id: req.params.id },
      data: {
        departmentId: data.departmentId,
        qualification: data.qualification,
        specialization: data.specialization,
        experienceYears: data.experienceYears,
        consultationFee: data.consultationFee,
        licenseNumber: data.licenseNumber,
      }
    });
  });
  await audit(req.user!.id, 'UPDATE', 'Doctor', result.id, req.ip);
  res.json(result);
}));
app.delete('/api/doctors/:id', auth(['SUPER_ADMIN', 'ADMIN']), asyncRoute(async (req: AuthRequest, res) => {
  const doctor = await prisma.doctor.findUnique({ where: { id: req.params.id } });
  if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
  await prisma.$transaction(async (tx) => {
    await tx.doctor.delete({ where: { id: req.params.id } });
    await tx.user.delete({ where: { id: doctor.userId } });
  });
  await audit(req.user!.id, 'DELETE', 'Doctor', req.params.id, req.ip);
  res.json({ message: 'Doctor deleted' });
}));

// --- Billing/Invoices CRUD ---
const invoiceCreateSchema = z.object({
  patientId: z.string().cuid(),
  status: z.enum(['DRAFT', 'ISSUED', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED']),
  description: z.string().trim().min(2),
  amount: z.coerce.number().positive(),
});
app.get('/api/billing', auth(), asyncRoute(async (_req, res) => {
  res.json(await prisma.invoice.findMany({
    include: { patient: true, items: true },
    orderBy: { issuedAt: 'desc' }
  }));
}));
app.get('/api/billing/stats', auth(), asyncRoute(async (_req, res) => {
  const invoices = await prisma.invoice.findMany();
  const todayRevenue = invoices.filter(i => i.status === 'PAID').reduce((sum, i) => sum + Number(i.total), 0);
  const pending = invoices.filter(i => i.status === 'ISSUED').reduce((sum, i) => sum + Number(i.total), 0);
  const claims = invoices.filter(i => i.status === 'PARTIALLY_PAID').length;
  const paidCount = invoices.filter(i => i.status === 'PAID').length;
  res.json({ todayRevenue: `₹${(todayRevenue/1000).toFixed(2)}K`, pending: `₹${(pending/1000).toFixed(2)}K`, insurance: claims, paid: paidCount });
}));
app.post('/api/billing', auth(['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT']), asyncRoute(async (req: AuthRequest, res) => {
  const data = invoiceCreateSchema.parse(req.body);
  const invoiceNumber = `INV-${Math.floor(10000 + Math.random() * 90000)}`;
  const result = await prisma.$transaction(async (tx) => {
    const invoice = await tx.invoice.create({
      data: {
        invoiceNumber,
        patientId: data.patientId,
        status: data.status,
        subtotal: data.amount,
        total: data.amount,
      }
    });
    await tx.invoiceItem.create({
      data: {
        invoiceId: invoice.id,
        description: data.description,
        unitPrice: data.amount,
        quantity: 1,
        total: data.amount,
      }
    });
    return invoice;
  });
  await audit(req.user!.id, 'CREATE', 'Invoice', result.id, req.ip);
    io.emit('billing:updated');
  res.status(201).json(result);
}));
app.put('/api/billing/:id', auth(['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT']), asyncRoute(async (req: AuthRequest, res) => {
  const data = invoiceCreateSchema.parse(req.body);
  const result = await prisma.$transaction(async (tx) => {
    const firstItem = await tx.invoiceItem.findFirst({ where: { invoiceId: req.params.id } });
    if (firstItem) {
      await tx.invoiceItem.update({
        where: { id: firstItem.id },
        data: { description: data.description, unitPrice: data.amount, total: data.amount }
      });
    }
    return await tx.invoice.update({
      where: { id: req.params.id },
      data: {
        patientId: data.patientId,
        status: data.status,
        subtotal: data.amount,
        total: data.amount,
      }
    });
  });
  await audit(req.user!.id, 'UPDATE', 'Invoice', result.id, req.ip);
  res.json(result);
}));
app.delete('/api/billing/:id', auth(['SUPER_ADMIN', 'ADMIN']), asyncRoute(async (req: AuthRequest, res) => {
  await prisma.$transaction(async (tx) => {
    await tx.invoiceItem.deleteMany({ where: { invoiceId: req.params.id } });
    await tx.payment.deleteMany({ where: { invoiceId: req.params.id } });
    await tx.invoice.delete({ where: { id: req.params.id } });
  });
  await audit(req.user!.id, 'DELETE', 'Invoice', req.params.id, req.ip);
  res.json({ message: 'Invoice deleted' });
}));

// --- Pharmacy/Medicines CRUD ---
const medicineCreateSchema = z.object({
  name: z.string().trim().min(2),
  genericName: z.string().trim().optional(),
  sku: z.string().trim().min(2),
  quantity: z.coerce.number().int().nonnegative(),
  unitPrice: z.coerce.number().positive(),
});
app.get('/api/pharmacy', auth(), asyncRoute(async (_req, res) => {
  res.json(await prisma.medicine.findMany({
    include: { inventory: true },
    orderBy: { name: 'asc' }
  }));
}));
app.get('/api/pharmacy/stats', auth(), asyncRoute(async (_req, res) => {
  const medicines = await prisma.medicine.findMany({ include: { inventory: true } });
  const totalMedicines = medicines.length;
  let lowStock = 0;
  let expiring = 0;
  medicines.forEach(m => {
    const qty = m.inventory.reduce((sum, i) => sum + i.quantity, 0);
    const reorder = m.inventory[0]?.reorderLevel ?? 20;
    if (qty <= reorder) lowStock++;
    if (m.inventory.some(i => new Date(i.expiryDate).getTime() < Date.now() + 180 * 24 * 3600 * 1000)) expiring++;
  });
  const totalSales = await prisma.payment.aggregate({ _sum: { amount: true } });
  const salesAmount = Number(totalSales._sum.amount || 0);
  const salesStr = salesAmount >= 1000 ? `₹${(salesAmount / 1000).toFixed(2)}K` : `₹${salesAmount}`;
  res.json({ medicines: totalMedicines, lowStock, expiringSoon: expiring, sales: salesStr });
}));
app.post('/api/pharmacy', auth(['SUPER_ADMIN', 'ADMIN']), asyncRoute(async (req: AuthRequest, res) => {
  const data = medicineCreateSchema.parse(req.body);
  const result = await prisma.$transaction(async (tx) => {
    const med = await tx.medicine.create({
      data: {
        sku: data.sku,
        name: data.name,
        genericName: data.genericName,
        unitPrice: data.unitPrice,
      }
    });
    await tx.inventory.create({
      data: {
        medicineId: med.id,
        batchNumber: `BATCH-${Math.floor(100 + Math.random() * 900)}`,
        quantity: data.quantity,
        expiryDate: new Date('2028-12-31'),
      }
    });
    return med;
  });
  await audit(req.user!.id, 'CREATE', 'Medicine', result.id, req.ip);
  res.status(201).json(result);
}));
app.put('/api/pharmacy/:id', auth(['SUPER_ADMIN', 'ADMIN']), asyncRoute(async (req: AuthRequest, res) => {
  const data = medicineCreateSchema.parse(req.body);
  const result = await prisma.$transaction(async (tx) => {
    const med = await tx.medicine.update({
      where: { id: req.params.id },
      data: {
        sku: data.sku,
        name: data.name,
        genericName: data.genericName,
        unitPrice: data.unitPrice,
      }
    });
    const inventory = await tx.inventory.findFirst({ where: { medicineId: med.id } });
    if (inventory) {
      await tx.inventory.update({
        where: { id: inventory.id },
        data: { quantity: data.quantity }
      });
    }
    return med;
  });
  await audit(req.user!.id, 'UPDATE', 'Medicine', result.id, req.ip);
  res.json(result);
}));
app.delete('/api/pharmacy/:id', auth(['SUPER_ADMIN', 'ADMIN']), asyncRoute(async (req: AuthRequest, res) => {
  await prisma.$transaction(async (tx) => {
    await tx.inventory.deleteMany({ where: { medicineId: req.params.id } });
    await tx.medicine.delete({ where: { id: req.params.id } });
  });
  await audit(req.user!.id, 'DELETE', 'Medicine', req.params.id, req.ip);
  res.json({ message: 'Medicine deleted' });
}));

// --- Laboratory CRUD ---
const labOrderCreateSchema = z.object({
  patientId: z.string().cuid(),
  testId: z.string().cuid(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'CRITICAL']),
  status: z.string().trim().min(2),
});
app.get('/api/laboratory', auth(), asyncRoute(async (_req, res) => {
  res.json(await prisma.labOrder.findMany({
    include: { patient: true, test: true },
    orderBy: { orderedAt: 'desc' }
  }));
}));
app.get('/api/laboratory/stats', auth(), asyncRoute(async (_req, res) => {
  const [total, pending, ready, critical] = await Promise.all([
    prisma.labOrder.count(),
    prisma.labOrder.count({ where: { status: 'PROCESSING' } }),
    prisma.labOrder.count({ where: { status: 'READY' } }),
    prisma.labOrder.count({ where: { status: 'CRITICAL' } }),
  ]);
  res.json({ testsToday: total, resultsReady: ready, pending, critical });
}));
app.post('/api/laboratory', auth(['SUPER_ADMIN', 'ADMIN']), asyncRoute(async (req: AuthRequest, res) => {
  const data = labOrderCreateSchema.parse(req.body);
  const result = await prisma.labOrder.create({ data });
  await audit(req.user!.id, 'CREATE', 'LabOrder', result.id, req.ip);
  res.status(201).json(result);
}));
app.put('/api/laboratory/:id', auth(['SUPER_ADMIN', 'ADMIN']), asyncRoute(async (req: AuthRequest, res) => {
  const data = labOrderCreateSchema.parse(req.body);
  const result = await prisma.labOrder.update({ where: { id: req.params.id }, data });
  await audit(req.user!.id, 'UPDATE', 'LabOrder', result.id, req.ip);
  res.json(result);
}));
app.delete('/api/laboratory/:id', auth(['SUPER_ADMIN', 'ADMIN']), asyncRoute(async (req: AuthRequest, res) => {
  await prisma.labOrder.delete({ where: { id: req.params.id } });
  await audit(req.user!.id, 'DELETE', 'LabOrder', req.params.id, req.ip);
  res.json({ message: 'Lab Order deleted' });
}));

// --- Staff/HR CRUD ---
const staffCreateSchema = z.object({
  name: z.string().trim().min(2),
  email: z.string().trim().email(),
  designation: z.string().trim().min(2),
  employeeCode: z.string().trim().min(2),
});
app.get('/api/staff', auth(), asyncRoute(async (_req, res) => {
  res.json(await prisma.staff.findMany({
    include: { user: true },
    orderBy: { employeeCode: 'asc' }
  }));
}));
app.get('/api/staff/stats', auth(), asyncRoute(async (_req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const total = await prisma.staff.count();
  // Count attendance for today (checked in and not checked out, or simply checked in)
  const presentToday = await prisma.attendance.count({
    where: { date: { gte: today }, status: 'PRESENT' },
  });
  const onLeave = await prisma.attendance.count({
    where: { date: { gte: today }, status: 'LEAVE' },
  });
  res.json({ totalStaff: total, presentToday: presentToday || total, onLeave, openPositions: 0 });
}));
app.post('/api/staff', auth(['SUPER_ADMIN', 'ADMIN']), asyncRoute(async (req: AuthRequest, res) => {
  const data = staffCreateSchema.parse(req.body);
  const passwordHash = await bcrypt.hash('Staff@123', 12);
  const role = await prisma.role.findUnique({ where: { code: 'RECEPTIONIST' } });
  const branch = await prisma.branch.findFirst();
  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name: data.name,
        email: data.email.toLowerCase(),
        passwordHash,
        roleId: role!.id,
        branchId: branch?.id,
      }
    });
    return await tx.staff.create({
      data: {
        userId: user.id,
        employeeCode: data.employeeCode,
        designation: data.designation,
        joinedAt: new Date(),
      }
    });
  });
  await audit(req.user!.id, 'CREATE', 'Staff', result.id, req.ip);
  res.status(201).json(result);
}));
app.put('/api/staff/:id', auth(['SUPER_ADMIN', 'ADMIN']), asyncRoute(async (req: AuthRequest, res) => {
  const data = staffCreateSchema.parse(req.body);
  const staff = await prisma.staff.findUnique({ where: { id: req.params.id } });
  if (!staff) return res.status(404).json({ message: 'Staff member not found' });
  const result = await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: staff.userId },
      data: { name: data.name, email: data.email.toLowerCase() }
    });
    return await tx.staff.update({
      where: { id: req.params.id },
      data: {
        designation: data.designation,
        employeeCode: data.employeeCode,
      }
    });
  });
  await audit(req.user!.id, 'UPDATE', 'Staff', result.id, req.ip);
  res.json(result);
}));
app.delete('/api/staff/:id', auth(['SUPER_ADMIN', 'ADMIN']), asyncRoute(async (req: AuthRequest, res) => {
  const staff = await prisma.staff.findUnique({ where: { id: req.params.id } });
  if (!staff) return res.status(404).json({ message: 'Staff member not found' });
  await prisma.$transaction(async (tx) => {
    await tx.staff.delete({ where: { id: req.params.id } });
    await tx.user.delete({ where: { id: staff.userId } });
  });
  await audit(req.user!.id, 'DELETE', 'Staff', req.params.id, req.ip);
  res.json({ message: 'Staff member deleted' });
}));

// --- Wards/Beds CRUD ---
const bedCreateSchema = z.object({
  roomNumber: z.string().trim().min(2),
  roomType: z.string().trim().min(2),
  bedNumber: z.string().trim().min(1),
  status: z.enum(['AVAILABLE', 'OCCUPIED', 'RESERVED', 'MAINTENANCE']),
});
app.get('/api/wards', auth(), asyncRoute(async (_req, res) => {
  res.json(await prisma.bed.findMany({
    include: {
      room: true,
      admissions: {
        where: { dischargedAt: null },
        include: { patient: true }
      }
    },
    orderBy: { bedNumber: 'asc' }
  }));
}));
app.get('/api/wards/stats', auth(), asyncRoute(async (_req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const [total, occupied, available, dischargesToday] = await Promise.all([
    prisma.bed.count(),
    prisma.bed.count({ where: { status: 'OCCUPIED' } }),
    prisma.bed.count({ where: { status: 'AVAILABLE' } }),
    prisma.admission.count({ where: { dischargedAt: { gte: today, lt: tomorrow } } }),
  ]);
  res.json({ totalBeds: total, occupied, available, dischargesToday });
}));
app.post('/api/wards', auth(['SUPER_ADMIN', 'ADMIN']), asyncRoute(async (req: AuthRequest, res) => {
  const data = bedCreateSchema.parse(req.body);
  const branch = await prisma.branch.findFirst();
  const result = await prisma.$transaction(async (tx) => {
    let room = await tx.room.findFirst({ where: { roomNumber: data.roomNumber } });
    if (!room) {
      room = await tx.room.create({
        data: {
          roomNumber: data.roomNumber,
          type: data.roomType,
          branchId: branch!.id,
        }
      });
    }
    return await tx.bed.create({
      data: {
        roomId: room.id,
        bedNumber: data.bedNumber,
        status: data.status,
      }
    });
  });
  await audit(req.user!.id, 'CREATE', 'Bed', result.id, req.ip);
  res.status(201).json(result);
}));
app.put('/api/wards/:id', auth(['SUPER_ADMIN', 'ADMIN']), asyncRoute(async (req: AuthRequest, res) => {
  const data = bedCreateSchema.parse(req.body);
  const bed = await prisma.bed.findUnique({ where: { id: req.params.id }, include: { room: true } });
  if (!bed) return res.status(404).json({ message: 'Bed not found' });
  const result = await prisma.$transaction(async (tx) => {
    await tx.room.update({
      where: { id: bed.roomId },
      data: { roomNumber: data.roomNumber, type: data.roomType }
    });
    return await tx.bed.update({
      where: { id: req.params.id },
      data: {
        bedNumber: data.bedNumber,
        status: data.status,
      }
    });
  });
  await audit(req.user!.id, 'UPDATE', 'Bed', result.id, req.ip);
  res.json(result);
}));
app.delete('/api/wards/:id', auth(['SUPER_ADMIN', 'ADMIN']), asyncRoute(async (req: AuthRequest, res) => {
  await prisma.$transaction(async (tx) => {
    await tx.admission.deleteMany({ where: { bedId: req.params.id } });
    await tx.bed.delete({ where: { id: req.params.id } });
  });
  await audit(req.user!.id, 'DELETE', 'Bed', req.params.id, req.ip);
  res.json({ message: 'Bed deleted' });
}));

// --- Emergency CRUD ---
const emergencyCreateSchema = z.object({
  patientName: z.string().trim().min(2),
  phone: z.string().trim().optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'CRITICAL']),
  status: z.string().trim().min(2),
  details: z.string().trim().optional(),
});
app.get('/api/emergency', auth(), asyncRoute(async (_req, res) => {
  res.json(await prisma.emergencyCase.findMany({
    orderBy: { createdAt: 'desc' }
  }));
}));
app.get('/api/emergency/stats', auth(), asyncRoute(async (_req, res) => {
  const [active, critical] = await Promise.all([
    prisma.emergencyCase.count({ where: { status: 'ACTIVE' } }),
    prisma.emergencyCase.count({ where: { priority: 'CRITICAL' } }),
  ]);
  // ambulancesActive and avgResponse require ambulance tracking (not in schema yet)
  res.json({ activeCases: active, critical, ambulancesActive: 0, avgResponse: 'N/A' });
}));
app.post('/api/emergency', auth(['SUPER_ADMIN', 'ADMIN']), asyncRoute(async (req: AuthRequest, res) => {
  const data = emergencyCreateSchema.parse(req.body);
  const caseNumber = `ER-${Math.floor(1000 + Math.random() * 9000)}`;
  const result = await prisma.emergencyCase.create({
    data: { ...data, caseNumber }
  });
  await audit(req.user!.id, 'CREATE', 'EmergencyCase', result.id, req.ip);
  res.status(201).json(result);
}));
app.put('/api/emergency/:id', auth(['SUPER_ADMIN', 'ADMIN']), asyncRoute(async (req: AuthRequest, res) => {
  const data = emergencyCreateSchema.parse(req.body);
  const result = await prisma.emergencyCase.update({ where: { id: req.params.id }, data });
  await audit(req.user!.id, 'UPDATE', 'EmergencyCase', result.id, req.ip);
  res.json(result);
}));
app.delete('/api/emergency/:id', auth(['SUPER_ADMIN', 'ADMIN']), asyncRoute(async (req: AuthRequest, res) => {
  await prisma.emergencyCase.delete({ where: { id: req.params.id } });
  await audit(req.user!.id, 'DELETE', 'EmergencyCase', req.params.id, req.ip);
  res.json({ message: 'Emergency Case deleted' });
}));

// --- Settings/Users CRUD ---
const userCreateSchema = z.object({
  name: z.string().trim().min(2),
  email: z.string().trim().email(),
  roleId: z.string().cuid(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']),
});
app.get('/api/settings', auth(), asyncRoute(async (_req, res) => {
  res.json(await prisma.user.findMany({
    include: { role: true, branch: true },
    orderBy: { name: 'asc' }
  }));
}));
app.get('/api/settings/stats', auth(), asyncRoute(async (_req, res) => {
  const [users, roles, branches, auditCount] = await Promise.all([
    prisma.user.count(),
    prisma.role.count(),
    prisma.branch.count(),
    prisma.auditLog.count(),
  ]);
  res.json({ activeUsers: users, roles, branches, auditEventsToday: auditCount });
}));
app.post('/api/settings', auth(['SUPER_ADMIN', 'ADMIN']), asyncRoute(async (req: AuthRequest, res) => {
  const data = userCreateSchema.parse(req.body);
  const passwordHash = await bcrypt.hash('User@123', 12);
  const branch = await prisma.branch.findFirst();
  const result = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email.toLowerCase(),
      roleId: data.roleId,
      status: data.status,
      passwordHash,
      branchId: branch?.id,
    }
  });
  await audit(req.user!.id, 'CREATE', 'User', result.id, req.ip);
  res.status(201).json(result);
}));
app.put('/api/settings/:id', auth(['SUPER_ADMIN', 'ADMIN']), asyncRoute(async (req: AuthRequest, res) => {
  const data = userCreateSchema.parse(req.body);
  const result = await prisma.user.update({
    where: { id: req.params.id },
    data: {
      name: data.name,
      email: data.email.toLowerCase(),
      roleId: data.roleId,
      status: data.status,
    }
  });
  await audit(req.user!.id, 'UPDATE', 'User', result.id, req.ip);
  res.json(result);
}));
app.delete('/api/settings/:id', auth(['SUPER_ADMIN', 'ADMIN']), asyncRoute(async (req: AuthRequest, res) => {
  await prisma.user.delete({ where: { id: req.params.id } });
  await audit(req.user!.id, 'DELETE', 'User', req.params.id, req.ip);
  res.json({ message: 'User deleted' });
}));

// --- Appointment Requests CRM CRUD ---
const backendRequestSchema = z.object({
  patientName: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(8).max(20),
  departmentId: z.string().cuid().nullable().optional(),
  preferredDoctor: z.string().trim().max(120).optional().nullable(),
  preferredDate: z.coerce.date(),
  status: z.enum(['NEW', 'CONFIRMED', 'CANCELLED']),
});

app.get('/api/requests', auth(), asyncRoute(async (_req, res) => {
  res.json(await prisma.appointmentRequest.findMany({
    include: { department: true },
    orderBy: { createdAt: 'desc' },
    take: 100,
  }));
}));

app.get('/api/requests/stats', auth(), asyncRoute(async (_req, res) => {
  const [total, newCount, confirmedCount, cancelledCount] = await Promise.all([
    prisma.appointmentRequest.count(),
    prisma.appointmentRequest.count({ where: { status: 'NEW' } }),
    prisma.appointmentRequest.count({ where: { status: 'CONFIRMED' } }),
    prisma.appointmentRequest.count({ where: { status: 'CANCELLED' } }),
  ]);
  res.json({
    totalRequests: total,
    new: newCount,
    confirmed: confirmedCount,
    cancelled: cancelledCount,
  });
}));

app.post('/api/requests', auth(), asyncRoute(async (req: AuthRequest, res) => {
  const data = backendRequestSchema.parse(req.body);
  const item = await prisma.appointmentRequest.create({
    data: {
      patientName: data.patientName,
      phone: data.phone,
      departmentId: data.departmentId,
      preferredDoctor: data.preferredDoctor,
      preferredDate: data.preferredDate,
      status: data.status,
    }
  });
  await audit(req.user!.id, 'CREATE', 'AppointmentRequest', item.id, req.ip);
  io.to('authenticated').emit('appointment-request:created', item);
  res.status(201).json(item);
}));

app.put('/api/requests/:id', auth(), asyncRoute(async (req: AuthRequest, res) => {
  const data = backendRequestSchema.parse(req.body);
  const item = await prisma.appointmentRequest.update({
    where: { id: req.params.id },
    data: {
      patientName: data.patientName,
      phone: data.phone,
      departmentId: data.departmentId,
      preferredDoctor: data.preferredDoctor,
      preferredDate: data.preferredDate,
      status: data.status,
    }
  });
  await audit(req.user!.id, 'UPDATE', 'AppointmentRequest', item.id, req.ip);
  io.to('authenticated').emit('appointment-request:updated', item);
  res.json(item);
}));

app.delete('/api/requests/:id', auth(['SUPER_ADMIN', 'ADMIN']), asyncRoute(async (req: AuthRequest, res) => {
  const item = await prisma.appointmentRequest.delete({ where: { id: req.params.id } });
  await audit(req.user!.id, 'DELETE', 'AppointmentRequest', item.id, req.ip);
  io.to('authenticated').emit('appointment-request:deleted', item);
  res.json({ message: 'Appointment request deleted successfully' });
}));

// --- Reports & Analytics ---
app.get('/api/reports/stats', auth(), asyncRoute(async (_req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const lastMonthEnd = thisMonthStart;

  const [invoicesThisMonth, invoicesLastMonth, totalBeds, occupiedBeds, paidInvoices, totalInvoices, patientsThisMonth, patientsLastMonth] = await Promise.all([
    prisma.invoice.aggregate({ _sum: { total: true }, where: { status: 'PAID', issuedAt: { gte: thisMonthStart } } }),
    prisma.invoice.aggregate({ _sum: { total: true }, where: { status: 'PAID', issuedAt: { gte: lastMonthStart, lt: lastMonthEnd } } }),
    prisma.bed.count(),
    prisma.bed.count({ where: { status: 'OCCUPIED' } }),
    prisma.invoice.count({ where: { status: 'PAID' } }),
    prisma.invoice.count({ where: { status: { not: 'CANCELLED' } } }),
    prisma.patient.count({ where: { createdAt: { gte: thisMonthStart } } }),
    prisma.patient.count({ where: { createdAt: { gte: lastMonthStart, lt: lastMonthEnd } } }),
  ]);

  const revenueThis = Number(invoicesThisMonth._sum.total || 0);
  const revenueLast = Number(invoicesLastMonth._sum.total || 1);
  const revenueGrowth = revenueLast > 0 ? (((revenueThis - revenueLast) / revenueLast) * 100).toFixed(1) : '0.0';

  const patGrowth = patientsLastMonth > 0 ? (((patientsThisMonth - patientsLastMonth) / patientsLastMonth) * 100).toFixed(1) : '0.0';
  const bedOccupancy = totalBeds > 0 ? ((occupiedBeds / totalBeds) * 100).toFixed(1) : '0.0';
  const collectionRate = totalInvoices > 0 ? ((paidInvoices / totalInvoices) * 100).toFixed(1) : '0.0';

  res.json({
    revenueGrowth: `${revenueGrowth}%`,
    patientGrowth: `${patGrowth}%`,
    bedOccupancy: `${bedOccupancy}%`,
    collectionRate: `${collectionRate}%`,
  });
}));

app.get('/api/reports', auth(), asyncRoute(async (_req, res) => {
  const today = new Date();
  const monthStr = today.toLocaleString('default', { month: 'long', year: 'numeric' });
  const quarterStr = `Q${Math.ceil((today.getMonth() + 1) / 3)} ${today.getFullYear()}`;

  // Return metadata about available reports (not real PDF files yet, but real date context)
  res.json([
    { name: 'Monthly revenue report', category: 'Finance', period: monthStr, format: 'PDF / Excel', status: 'Ready' },
    { name: 'Patient outcomes', category: 'Clinical', period: quarterStr, format: 'PDF', status: 'Ready' },
    { name: 'Doctor performance', category: 'Operations', period: monthStr, format: 'Excel', status: 'Ready' },
    { name: 'Bed utilisation', category: 'Operations', period: monthStr, format: 'PDF', status: 'Ready' },
    { name: 'Lab turnaround times', category: 'Clinical', period: monthStr, format: 'Excel', status: 'Ready' },
  ]);
}));

const requestLimiter = rateLimit({ windowMs: 60 * 60_000, limit: 20, standardHeaders: true, legacyHeaders: false });

const appointmentRequestSchema = z.object({
  patientName: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(8).max(20),
  department: z.string().trim().min(2).max(100),
  preferredDoctor: z.string().trim().max(120).optional(),
  preferredDate: z.coerce.date(),
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

// Get list of appointment requests
app.get('/api/requests', auth(['ADMIN', 'SUPER_ADMIN']), asyncRoute(async (req, res) => {
  const requests = await prisma.appointmentRequest.findMany({
    include: { department: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json(requests);
}));

// Get stats for appointment requests
app.get('/api/requests/stats', auth(['ADMIN', 'SUPER_ADMIN']), asyncRoute(async (req, res) => {
  const [total, newCount, confirmed, cancelled] = await Promise.all([
    prisma.appointmentRequest.count(),
    prisma.appointmentRequest.count({ where: { status: 'NEW' } }),
    prisma.appointmentRequest.count({ where: { status: 'CONFIRMED' } }),
    prisma.appointmentRequest.count({ where: { status: 'CANCELLED' } }),
  ]);
  res.json({ totalRequests: total, new: newCount, confirmed, cancelled });
}));

app.post('/api/public/appointments', requestLimiter, asyncRoute(async (req, res) => {
  const publicAppointmentSchema = z.object({
    patient: z.object({
      firstName: z.string().trim().min(2).max(80),
      lastName: z.string().trim().min(2).max(80),
      phone: z.string().trim().min(8).max(20),
      email: z.string().trim().email().optional(),
      dateOfBirth: z.coerce.date().max(new Date()),
      gender: z.string().trim().min(1).max(30),
      address: z.string().optional(),
      emergencyName: z.string().optional(),
      emergencyPhone: z.string().optional(),
    }),
    appointment: z.object({
      departmentId: z.string().cuid(),
      doctorId: z.string().cuid(),
      scheduledAt: z.coerce.date().min(startOfToday),
      reason: z.string().optional(),
    }),
  });

  const { patient, appointment } = publicAppointmentSchema.parse(req.body);

  // Upsert patient by unique phone or email
  const existingPatient = await prisma.patient.findFirst({
    where: {
      OR: [{ phone: patient.phone }, { email: patient.email?.toLowerCase() }],
    },
  });

  const patientRecord = existingPatient
    ? await prisma.patient.update({
        where: { id: existingPatient.id },
        data: { ...patient, email: patient.email?.toLowerCase() },
      })
    : await prisma.patient.create({
        data: {
          ...patient,
          email: patient.email?.toLowerCase(),
          patientCode: `VH-${randomUUID().slice(0, 8).toUpperCase()}`,
        },
      });

  const created = await prisma.appointment.create({
    data: {
      patientId: patientRecord.id,
      doctorId: appointment.doctorId,
      departmentId: appointment.departmentId,
      scheduledAt: appointment.scheduledAt,
      reason: appointment.reason,
      status: 'SCHEDULED',
    },
  });

  await audit(req.user?.id ?? 'public', 'CREATE', 'Appointment', created.id, req.ip);
  io.to('authenticated').emit('appointment:created', created);
  res.status(201).json({ id: created.id, message: 'Appointment booked' });
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

app.get('/api/health', (_req: Request, res: Response) => res.json({ status: 'ok', service: 'vasavi-api', time: new Date() }));
app.use((_req: Request, res: Response) => res.status(404).json({ message: 'Route not found' }));
app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof ZodError) return res.status(400).json({ message: 'Validation failed', issues: error.flatten() });
  console.error(error);
  
  const isProduction = process.env.NODE_ENV === 'production';
  return res.status(500).json({ 
    message: 'Unexpected server error', 
    ...(isProduction ? {} : { error: error.message, stack: error.stack })
  });
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
