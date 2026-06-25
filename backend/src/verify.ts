import dotenv from 'dotenv';
import path from 'path';
import { PrismaClient } from '@prisma/client';

dotenv.config({ path: path.resolve(__dirname, '../.env'), override: true });

const prisma = new PrismaClient();

async function verify() {
  console.log('Verifying database contents...');
  const counts = await Promise.all([
    prisma.branch.count(),
    prisma.role.count(),
    prisma.user.count(),
    prisma.department.count(),
    prisma.doctor.count(),
    prisma.patient.count(),
    prisma.appointment.count(),
    prisma.invoice.count(),
    prisma.medicine.count(),
    prisma.inventory.count(),
    prisma.labTest.count(),
    prisma.labOrder.count(),
    prisma.staff.count(),
    prisma.room.count(),
    prisma.bed.count(),
    prisma.admission.count(),
    prisma.emergencyCase.count(),
  ]);

  const names = [
    'Branch',
    'Role',
    'User',
    'Department',
    'Doctor',
    'Patient',
    'Appointment',
    'Invoice',
    'Medicine',
    'Inventory',
    'LabTest',
    'LabOrder',
    'Staff',
    'Room',
    'Bed',
    'Admission',
    'EmergencyCase',
  ];

  names.forEach((name, i) => {
    console.log(`${name}: ${counts[i]}`);
  });
}

verify()
  .catch((e) => {
    console.error('Verification error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
