import dotenv from 'dotenv';
import path from 'path';
import { PrismaClient, AppointmentStatus, InvoiceStatus, BedStatus, Priority } from '@prisma/client';
import bcrypt from 'bcryptjs';

dotenv.config({ path: path.resolve(__dirname, '../.env'), override: true });

const prisma = new PrismaClient();

export async function seed() {
  console.log('Starting database seeding...');

  // 1. Seed Branch
  const branch = await prisma.branch.upsert({
    where: { code: 'HYD-01' },
    update: {},
    create: {
      name: 'Vasavi Multi Specialty Hospital',
      code: 'HYD-01',
      address: 'Banjara Hills, Hyderabad',
      phone: '+91 98765 43210',
    },
  });

  // 2. Seed Roles
  const roles = [
    ['SUPER_ADMIN', 'Super Admin'],
    ['ADMIN', 'Admin'],
    ['DOCTOR', 'Doctor'],
    ['RECEPTIONIST', 'Receptionist'],
    ['ACCOUNTANT', 'Accountant'],
  ];
  const roleMap: Record<string, string> = {};
  for (const [code, name] of roles) {
    const role = await prisma.role.upsert({
      where: { code },
      update: {},
      create: {
        code,
        name,
        permissions: { all: code === 'SUPER_ADMIN' },
      },
    });
    roleMap[code] = role.id;
  }

  // 3. Hashed Password for Seeding
  const passwordHash = await bcrypt.hash('Admin@123', 12);

  // 4. Seed Admin, Receptionist, Accountant
  const defaultUsers = [
    ['Administrator', 'admin@vasavihospital.com', 'ADMIN'],
    ['Reception Desk', 'reception@vasavihospital.com', 'RECEPTIONIST'],
    ['Accounts Team', 'accounts@vasavihospital.com', 'ACCOUNTANT'],
  ];
  for (const [name, email, role] of defaultUsers) {
    await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        name,
        email,
        passwordHash,
        roleId: roleMap[role],
        branchId: branch.id,
      },
    });
  }

  // 5. Seed Departments (Cardiology, Neurology, Orthopedics, Pediatrics, Gynecology, General Medicine, Oncology, Emergency Care)
  const departmentsData = [
    ['Cardiology', 'CARD', 'Advanced heart care, diagnostics and intervention.'],
    ['Neurology', 'NEUR', 'Specialist care for brain, spine and nervous system.'],
    ['Orthopedics', 'ORTH', 'Restoring mobility with precision and rehabilitation.'],
    ['Pediatrics', 'PEDI', 'Thoughtful, complete care for infants and children.'],
    ['Gynecology', 'GYNE', 'Comprehensive women’s health through every stage.'],
    ['General Medicine', 'GENM', 'Preventive, diagnostic and long-term medical care.'],
    ['Oncology', 'ONCO', 'Multidisciplinary cancer care and support.'],
    ['Emergency Care', 'EMER', 'Rapid response emergency medicine, around the clock.'],
  ];
  const deptMap: Record<string, string> = {};
  for (const [name, code, desc] of departmentsData) {
    const dept = await prisma.department.upsert({
      where: { branchId_code: { branchId: branch.id, code } },
      update: { name, description: desc },
      create: {
        name,
        code,
        description: desc,
        branchId: branch.id,
      },
    });
    deptMap[code] = dept.id;
  }

  // 6. Seed Doctors (Dr. Demo, Dr. Ananya Rao, Dr. Arjun Mehta, Dr. Meera Iyer, Dr. Vikram Shah)
  const doctorsData = [
    {
      email: 'doctor@vasavihospital.com',
      name: 'Dr. Demo',
      deptCode: 'CARD',
      qualification: 'MBBS, MD Cardiology',
      specialization: 'Interventional Cardiology',
      exp: 14,
      fee: 1500,
      license: 'TSMC-DEMO-001',
    },
    {
      email: 'ananya.rao@vasavihospital.com',
      name: 'Dr. Ananya Rao',
      deptCode: 'CARD',
      qualification: 'MBBS, MD Cardiology',
      specialization: 'Senior Cardiologist',
      exp: 18,
      fee: 1500,
      license: 'TSMC-ANANYA-01',
    },
    {
      email: 'arjun.mehta@vasavihospital.com',
      name: 'Dr. Arjun Mehta',
      deptCode: 'NEUR',
      qualification: 'MBBS, MD Neurology',
      specialization: 'Consultant Neurologist',
      exp: 14,
      fee: 1200,
      license: 'TSMC-ARJUN-02',
    },
    {
      email: 'meera.iyer@vasavihospital.com',
      name: 'Dr. Meera Iyer',
      deptCode: 'ORTH',
      qualification: 'MBBS, MS Orthopedics',
      specialization: 'Orthopedic Surgeon',
      exp: 16,
      fee: 1400,
      license: 'TSMC-MEERA-03',
    },
    {
      email: 'vikram.shah@vasavihospital.com',
      name: 'Dr. Vikram Shah',
      deptCode: 'PEDI',
      qualification: 'MBBS, MD Pediatrics',
      specialization: 'Pediatrician',
      exp: 12,
      fee: 1000,
      license: 'TSMC-VIKRAM-04',
    },
  ];

  const doctorMap: Record<string, string> = {}; // Name to Doctor ID
  for (const doc of doctorsData) {
    const user = await prisma.user.upsert({
      where: { email: doc.email },
      update: { name: doc.name },
      create: {
        name: doc.name,
        email: doc.email,
        passwordHash,
        roleId: roleMap['DOCTOR'],
        branchId: branch.id,
      },
    });

    const doctorRecord = await prisma.doctor.upsert({
      where: { userId: user.id },
      update: {
        qualification: doc.qualification,
        specialization: doc.specialization,
        experienceYears: doc.exp,
        consultationFee: doc.fee,
      },
      create: {
        userId: user.id,
        departmentId: deptMap[doc.deptCode],
        qualification: doc.qualification,
        specialization: doc.specialization,
        experienceYears: doc.exp,
        consultationFee: doc.fee,
        licenseNumber: doc.license,
      },
    });
    doctorMap[doc.name] = doctorRecord.id;
  }

  // 7. Seed Patients (Aarav Sharma, Mary Joseph, Ishaan Patel, Noor Khan, Saanvi Rao, Kiran Kumar, Fatima Begum, Rohan Das)
  const patientsData = [
    { code: 'VH-20481', first: 'Aarav', last: 'Sharma', dob: '1992-06-22', gender: 'Male', phone: '+91 98765 43211' },
    { code: 'VH-20480', first: 'Mary', last: 'Joseph', dob: '1974-06-22', gender: 'Female', phone: '+91 98765 43212' },
    { code: 'VH-20479', first: 'Ishaan', last: 'Patel', dob: '2018-06-22', gender: 'Male', phone: '+91 98765 43213' },
    { code: 'VH-20478', first: 'Noor', last: 'Khan', dob: '1985-06-22', gender: 'Female', phone: '+91 98765 43214' },
    { code: 'VH-20482', first: 'Saanvi', last: 'Rao', dob: '1998-06-22', gender: 'Female', phone: '+91 98765 43215' },
    { code: 'VH-20483', first: 'Kiran', last: 'Kumar', dob: '1980-06-22', gender: 'Male', phone: '+91 98765 43216' },
    { code: 'VH-20484', first: 'Fatima', last: 'Begum', dob: '1970-06-22', gender: 'Female', phone: '+91 98765 43217' },
    { code: 'VH-20485', first: 'Rohan', last: 'Das', dob: '2014-06-22', gender: 'Male', phone: '+91 98765 43218' },
  ];

  const patientMap: Record<string, string> = {}; // Code to Patient ID
  for (const pat of patientsData) {
    const patient = await prisma.patient.upsert({
      where: { patientCode: pat.code },
      update: { firstName: pat.first, lastName: pat.last, phone: pat.phone },
      create: {
        patientCode: pat.code,
        firstName: pat.first,
        lastName: pat.last,
        dateOfBirth: new Date(pat.dob),
        gender: pat.gender,
        phone: pat.phone,
        email: `${pat.first.toLowerCase()}.${pat.last.toLowerCase()}@example.com`,
      },
    });
    patientMap[pat.code] = patient.id;
  }

  // 8. Seed Appointments
  const appointmentsData = [
    {
      patientCode: 'VH-20482', // Saanvi Rao
      doctorName: 'Dr. Ananya Rao',
      deptCode: 'CARD',
      scheduledAt: new Date(Date.now() + 1 * 3600 * 1000), // in 1 hour
      status: AppointmentStatus.CONFIRMED,
      reason: 'Routine cardiac health checkup',
    },
    {
      patientCode: 'VH-20483', // Kiran Kumar
      doctorName: 'Dr. Arjun Mehta',
      deptCode: 'NEUR',
      scheduledAt: new Date(Date.now() + 2 * 3600 * 1000), // in 2 hours
      status: AppointmentStatus.SCHEDULED,
      reason: 'Persistent headache checkup',
    },
    {
      patientCode: 'VH-20484', // Fatima Begum
      doctorName: 'Dr. Meera Iyer',
      deptCode: 'ORTH',
      scheduledAt: new Date(Date.now() - 15 * 60 * 1000), // 15 mins ago
      status: AppointmentStatus.IN_CONSULTATION,
      reason: 'Post-op knee therapy follow-up',
    },
    {
      patientCode: 'VH-20485', // Rohan Das
      doctorName: 'Dr. Vikram Shah',
      deptCode: 'PEDI',
      scheduledAt: new Date(Date.now() + 4 * 3600 * 1000), // in 4 hours
      status: AppointmentStatus.CONFIRMED,
      reason: 'Annual pediatric health check',
    },
  ];

  for (const app of appointmentsData) {
    const existing = await prisma.appointment.findFirst({
      where: {
        patientId: patientMap[app.patientCode],
        doctorId: doctorMap[app.doctorName],
      },
    });
    if (!existing) {
      await prisma.appointment.create({
        data: {
          patientId: patientMap[app.patientCode],
          doctorId: doctorMap[app.doctorName],
          departmentId: deptMap[app.deptCode],
          scheduledAt: app.scheduledAt,
          status: app.status,
          reason: app.reason,
        },
      });
    }
  }

  // 9. Seed Billing/Invoices (INV-10482, INV-10481, INV-10480)
  const invoicesData = [
    {
      invoiceNumber: 'INV-10482',
      patientCode: 'VH-20482', // Saanvi Rao
      status: InvoiceStatus.PAID,
      items: [{ description: 'Cardiology Consultation Fee', unitPrice: 1500, quantity: 1 }],
    },
    {
      invoiceNumber: 'INV-10481',
      patientCode: 'VH-20483', // Kiran Kumar
      status: InvoiceStatus.ISSUED,
      items: [{ description: 'Neurology Diagnostics & Scan', unitPrice: 8400, quantity: 1 }],
    },
    {
      invoiceNumber: 'INV-10480',
      patientCode: 'VH-20484', // Fatima Begum
      status: InvoiceStatus.ISSUED,
      items: [{ description: 'Orthopedic Major Surgery', unitPrice: 124000, quantity: 1 }],
    },
  ];

  for (const inv of invoicesData) {
    const total = inv.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const invoice = await prisma.invoice.upsert({
      where: { invoiceNumber: inv.invoiceNumber },
      update: { status: inv.status },
      create: {
        invoiceNumber: inv.invoiceNumber,
        patientId: patientMap[inv.patientCode],
        status: inv.status,
        subtotal: total,
        total: total,
      },
    });

    for (const item of inv.items) {
      const existingItem = await prisma.invoiceItem.findFirst({
        where: { invoiceId: invoice.id, description: item.description },
      });
      if (!existingItem) {
        await prisma.invoiceItem.create({
          data: {
            invoiceId: invoice.id,
            description: item.description,
            unitPrice: item.unitPrice,
            quantity: item.quantity,
            total: item.unitPrice * item.quantity,
          },
        });
      }
    }
  }

  // 10. Seed Medicines & Pharmacy Inventory
  const medicinesData = [
    { sku: 'MED-0294', name: 'Atorvastatin 10mg', generic: 'Lipitor', price: 150, qty: 480, batch: 'BATCH-AT-01' },
    { sku: 'MED-0293', name: 'Amoxicillin 500mg', generic: 'Moxatag', price: 80, qty: 32, batch: 'BATCH-AM-02' },
    { sku: 'MED-0292', name: 'Metformin 500mg', generic: 'Glucophage', price: 50, qty: 760, batch: 'BATCH-ME-03' },
  ];

  for (const med of medicinesData) {
    const medicine = await prisma.medicine.upsert({
      where: { sku: med.sku },
      update: { name: med.name, unitPrice: med.price },
      create: {
        sku: med.sku,
        name: med.name,
        genericName: med.generic,
        unitPrice: med.price,
      },
    });

    await prisma.inventory.upsert({
      where: { medicineId_batchNumber: { medicineId: medicine.id, batchNumber: med.batch } },
      update: { quantity: med.qty },
      create: {
        medicineId: medicine.id,
        batchNumber: med.batch,
        quantity: med.qty,
        expiryDate: new Date('2028-12-31'),
      },
    });
  }

  // 11. Seed Lab Tests & Orders
  const labTestsData = [
    { name: 'Lipid profile', code: 'LAB-LP', price: 1500 },
    { name: 'MRI Brain', code: 'LAB-MRI', price: 8000 },
    { name: 'CBC', code: 'LAB-CBC', price: 500 },
  ];

  const testMap: Record<string, string> = {};
  for (const test of labTestsData) {
    const t = await prisma.labTest.upsert({
      where: { code: test.code },
      update: { name: test.name, price: test.price },
      create: {
        name: test.name,
        code: test.code,
        price: test.price,
      },
    });
    testMap[test.code] = t.id;
  }

  const labOrdersData = [
    { patientCode: 'VH-20482', testCode: 'LAB-LP', status: 'READY', priority: Priority.NORMAL },
    { patientCode: 'VH-20483', testCode: 'LAB-MRI', status: 'PROCESSING', priority: Priority.NORMAL },
    { patientCode: 'VH-20484', testCode: 'LAB-CBC', status: 'CRITICAL', priority: Priority.HIGH },
  ];

  for (const order of labOrdersData) {
    const existing = await prisma.labOrder.findFirst({
      where: {
        patientId: patientMap[order.patientCode],
        testId: testMap[order.testCode],
      },
    });
    if (!existing) {
      await prisma.labOrder.create({
        data: {
          patientId: patientMap[order.patientCode],
          testId: testMap[order.testCode],
          status: order.status,
          priority: order.priority,
        },
      });
    }
  }

  // 12. Seed Staff (EMP-284, EMP-283, EMP-282)
  const staffData = [
    { code: 'EMP-284', name: 'Nisha Reddy', email: 'nisha.reddy@vasavihospital.com', designation: 'Head Nurse' },
    { code: 'EMP-283', name: 'Rahul Dev', email: 'rahul.dev@vasavihospital.com', designation: 'Lab Technician' },
    { code: 'EMP-282', name: 'Sara Ali', email: 'sara.ali@vasavihospital.com', designation: 'Receptionist' },
  ];

  for (const staff of staffData) {
    const user = await prisma.user.upsert({
      where: { email: staff.email },
      update: { name: staff.name },
      create: {
        name: staff.name,
        email: staff.email,
        passwordHash,
        roleId: roleMap['RECEPTIONIST'], // default receptionist role for staff logins
        branchId: branch.id,
      },
    });

    await prisma.staff.upsert({
      where: { employeeCode: staff.code },
      update: { designation: staff.designation },
      create: {
        userId: user.id,
        employeeCode: staff.code,
        designation: staff.designation,
        joinedAt: new Date(),
      },
    });
  }

  // 13. Seed Rooms & Beds & Bed Allocations
  const roomsData = [
    { roomNumber: 'ICU-08', type: 'ICU', beds: ['ICU-08-A'] },
    { roomNumber: 'PVT-24', type: 'Private room', beds: ['PVT-24-A'] },
    { roomNumber: 'GEN-112', type: 'General ward', beds: ['GEN-112-A'] },
  ];

  for (const r of roomsData) {
    const room = await prisma.room.upsert({
      where: { branchId_roomNumber: { branchId: branch.id, roomNumber: r.roomNumber } },
      update: { type: r.type },
      create: {
        branchId: branch.id,
        roomNumber: r.roomNumber,
        type: r.type,
      },
    });

    for (const bNum of r.beds) {
      const bedStatus = bNum === 'GEN-112-A' ? BedStatus.AVAILABLE : BedStatus.OCCUPIED;
      const bed = await prisma.bed.upsert({
        where: { roomId_bedNumber: { roomId: room.id, bedNumber: bNum } },
        update: { status: bedStatus },
        create: {
          roomId: room.id,
          bedNumber: bNum,
          status: bedStatus,
        },
      });

      // Add admission mapping if occupied
      if (bedStatus === BedStatus.OCCUPIED) {
        const patientCode = bNum === 'ICU-08-A' ? 'VH-20482' : 'VH-20480'; // Saanvi Rao or Mary Joseph
        const existingAdm = await prisma.admission.findFirst({
          where: { bedId: bed.id, patientId: patientMap[patientCode] },
        });
        if (!existingAdm) {
          await prisma.admission.create({
            data: {
              bedId: bed.id,
              patientId: patientMap[patientCode],
            },
          });
        }
      }
    }
  }

  // 14. Seed Emergency cases
  const emergenciesData = [
    { caseNumber: 'ER-9042', patientName: 'Ravi Kumar', phone: '+91 98765 00001', priority: Priority.CRITICAL, status: 'ACTIVE', details: 'Chest pain, Dr. Ananya Rao' },
    { caseNumber: 'ER-9041', patientName: 'Divya Singh', phone: '+91 98765 00002', priority: Priority.HIGH, status: 'STABILIZED', details: 'Trauma, Dr. Meera Iyer' },
  ];

  for (const er of emergenciesData) {
    await prisma.emergencyCase.upsert({
      where: { caseNumber: er.caseNumber },
      update: { status: er.status, details: er.details },
      create: {
        caseNumber: er.caseNumber,
        patientName: er.patientName,
        phone: er.phone,
        priority: er.priority,
        status: er.status,
        details: er.details,
      },
    });
  }

  console.log('Database seeding finished successfully!');
}

// Allow script execution directly
if (require.main === module) {
  seed()
    .catch((e) => {
      console.error('Error during seeding:', e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
