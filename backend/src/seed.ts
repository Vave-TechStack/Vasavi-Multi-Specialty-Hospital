import dotenv from 'dotenv';
import path from 'path';
import { PrismaClient } from './generated/client';
import bcrypt from 'bcryptjs';

dotenv.config({ path: path.resolve(__dirname, '../.env'), override: true });

const prisma = new PrismaClient();

async function main() {
  const branch = await prisma.branch.upsert({
    where: { code: 'HYD-01' },
    update: {},
    create: { name: 'Vasavi Multi Specialty Hospital', code: 'HYD-01', address: 'Banjara Hills, Hyderabad', phone: '+91 98765 43210' },
  });
  const roles = [['SUPER_ADMIN', 'Super Admin'], ['ADMIN', 'Admin'], ['DOCTOR', 'Doctor'], ['RECEPTIONIST', 'Receptionist'], ['ACCOUNTANT', 'Accountant']];
  const roleMap: Record<string, string> = {};
  for (const [code, name] of roles) {
    const role = await prisma.role.upsert({ where: { code }, update: {}, create: { code, name, permissions: { all: code === 'SUPER_ADMIN' } } });
    roleMap[code] = role.id;
  }
  const passwordHash = await bcrypt.hash('Admin@123', 12);
  const users = [['Administrator', 'admin@vasavihospital.com', 'ADMIN'], ['Dr. Demo', 'doctor@vasavihospital.com', 'DOCTOR'], ['Reception Desk', 'reception@vasavihospital.com', 'RECEPTIONIST'], ['Accounts Team', 'accounts@vasavihospital.com', 'ACCOUNTANT']];
  for (const [name, email, role] of users) {
    await prisma.user.upsert({ where: { email }, update: {}, create: { name, email, passwordHash, roleId: roleMap[role], branchId: branch.id } });
  }
  const department = await prisma.department.upsert({
    where: { branchId_code: { branchId: branch.id, code: 'CARD' } },
    update: {},
    create: { name: 'Cardiology', code: 'CARD', branchId: branch.id },
  });
  const doctorUser = await prisma.user.findUniqueOrThrow({ where: { email: 'doctor@vasavihospital.com' } });
  await prisma.doctor.upsert({
    where: { userId: doctorUser.id },
    update: {},
    create: { userId: doctorUser.id, departmentId: department.id, qualification: 'MBBS, MD Cardiology', specialization: 'Interventional Cardiology', experienceYears: 14, consultationFee: 1500, licenseNumber: 'TSMC-DEMO-001' },
  });
  console.log('Seeded demo accounts. Password: Admin@123');
}

main().finally(() => prisma.$disconnect());
