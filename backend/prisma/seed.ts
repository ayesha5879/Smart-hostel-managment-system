import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  await prisma.aIAnalytics.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.attendance.deleteMany({});
  await prisma.visitor.deleteMany({});
  await prisma.complaintComment.deleteMany({});
  await prisma.complaint.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.fee.deleteMany({});
  await prisma.roomAllocation.deleteMany({});
  await prisma.room.deleteMany({});
  await prisma.student.deleteMany({});
  await prisma.guardian.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('🧹 Cleaned existing tables.');

  const passwordHash = await bcrypt.hash('password123', 10);

  console.log('👤 Seeding staff members...');
  const staffData = [
    { email: 'admin@aegis.com', name: 'Dr. Sarah Connor', role: 'SUPER_ADMIN' },
    { email: 'manager1@aegis.com', name: 'James Carter', role: 'HOSTEL_MANAGER' },
    { email: 'manager2@aegis.com', name: 'Elena Rostova', role: 'HOSTEL_MANAGER' },
    { email: 'warden1@aegis.com', name: 'John Doe', role: 'WARDEN' },
    { email: 'warden2@aegis.com', name: 'David Miller', role: 'WARDEN' },
    { email: 'warden3@aegis.com', name: 'Sofia Rodriguez', role: 'WARDEN' },
    { email: 'warden4@aegis.com', name: 'Arthur Pendragon', role: 'WARDEN' },
    { email: 'warden5@aegis.com', name: 'Bred Pitt', role: 'WARDEN' },
    { email: 'warden6@aegis.com', name: 'Chris Evans', role: 'WARDEN' },
    { email: 'warden7@aegis.com', name: 'Diana Prince', role: 'WARDEN' },
  ];

  const staffUsers = [];
  for (const s of staffData) {
    const user = await prisma.user.create({
      data: { email: s.email, passwordHash, name: s.name, role: s.role, isActive: true }
    });
    staffUsers.push(user);
  }

  console.log('🏢 Seeding 50 rooms...');
  const buildings = ['Block A', 'Block B', 'Block C'];
  const roomTypes = ['SINGLE', 'DOUBLE', 'TRIPLE', 'DORMITORY'];
  const capacities: { [key: string]: number } = { SINGLE: 1, DOUBLE: 2, TRIPLE: 3, DORMITORY: 6 };
  const baseFees: { [key: string]: number } = { SINGLE: 350.00, DOUBLE: 220.00, TRIPLE: 150.00, DORMITORY: 90.00 };

  const rooms = [];
  for (let i = 1; i <= 50; i++) {
    const building = buildings[i % buildings.length];
    const floor = Math.floor((i - 1) / 10) + 1;
    const roomNumber = `${building.substring(6)}${floor}${String(i % 10).padStart(2, '0')}`;
    const roomType = roomTypes[i % roomTypes.length];
    const room = await prisma.room.create({
      data: {
        roomNumber, floor, building,
        capacity: capacities[roomType],
        roomType,
        baseFee: baseFees[roomType],
        isMaintenance: i === 47
      }
    });
    rooms.push(room);
  }

  console.log('🎓 Seeding 100 students and guardians...');
  const depts = ['Computer Science', 'Software Engineering', 'Electrical Engineering', 'Mechanical Engineering', 'Business Admin', 'Data Science'];
  const genders = ['Male', 'Female'];
  const students = [];

  for (let i = 1; i <= 100; i++) {
    const gender = genders[i % genders.length];
    const dept = depts[i % depts.length];
    const semester = (i % 8) + 1;
    const name = `${gender === 'Male' ? 'Alex' : 'Emma'} ${['Stone', 'Johnson', 'Smith', 'Williams', 'Brown', 'Davis', 'Miller', 'Wilson', 'Moore', 'Taylor'][i % 10]} ${i}`;

    const user = await prisma.user.create({
      data: { email: `student${i}@university.edu`, passwordHash, name, role: 'STUDENT', isActive: true }
    });

    const guardian = await prisma.guardian.create({
      data: {
        name: `Parent of student ${i}`,
        relation: i % 2 === 0 ? 'Father' : 'Mother',
        contactNumber: `+1-555-${String(100000 + i * 123)}`,
        cnic: `CNIC-${String(40000 + i * 258)}-P`,
        address: `House #${i * 3}, main boulevard, City ${i}`,
      }
    });

    const student = await prisma.student.create({
      data: {
        userId: user.id,
        studentId: `ROLL-${2020 + (i % 5)}-${String(1000 + i)}`,
        cnic: `CNIC-${String(10000 + i * 587)}-S`,
        gender, department: dept, semester,
        phone: `+1-555-${String(300000 + i * 456)}`,
        emergencyContact: `+1-555-${String(900000 - i * 111)}`,
        address: `Student address road, Block #${i}`,
        status: i > 95 ? 'VACATED' : 'ACTIVE',
        guardianId: guardian.id,
      }
    });
    students.push(student);
  }

  console.log('🔑 Allocating rooms to students...');
  const allocations = [];
  let studentIdx = 0;
  const roomOccupants: { [key: string]: number } = {};
  rooms.forEach(r => roomOccupants[r.id] = 0);

  for (const room of rooms) {
    if (room.isMaintenance) continue;
    const toAllocateCount = Math.min(room.capacity, 100 - studentIdx);
    for (let c = 0; c < toAllocateCount; c++) {
      if (studentIdx >= 95) break;
      const student = students[studentIdx];
      const alloc = await prisma.roomAllocation.create({
        data: {
          studentId: student.id, roomId: room.id, isActive: true,
          allocatedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
        }
      });
      allocations.push(alloc);
      roomOccupants[room.id]++;
      studentIdx++;
    }
  }

  for (let i = 95; i < 100; i++) {
    await prisma.roomAllocation.create({
      data: {
        studentId: students[i].id, roomId: rooms[i % rooms.length].id, isActive: false,
        allocatedAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000),
        vacatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      }
    });
  }

  console.log('💵 Seeding fee invoices and transaction histories...');
  const billingPeriods = ['April 2026', 'May 2026', 'June 2026'];
  const activeAllocations = allocations.filter(a => a.isActive);

  for (const alloc of activeAllocations) {
    const room = rooms.find(r => r.id === alloc.roomId)!;
    const student = students.find(s => s.id === alloc.studentId)!;

    for (let m = 0; m < billingPeriods.length; m++) {
      let status = 'PAID';
      if (m === 2) status = m % 3 === 0 ? 'OVERDUE' : 'PENDING';

      const dueDate = new Date();
      dueDate.setDate(5);
      dueDate.setMonth(dueDate.getMonth() - (2 - m));

      const utilityCharges = 15.00 + (parseInt(student.studentId.substring(8)) % 25);
      const miscCharges = 5.00;
      const lateFee = status === 'OVERDUE' ? 20.00 : 0.00;

      const fee = await prisma.fee.create({
        data: {
          studentId: alloc.studentId, roomAllocationId: alloc.id,
          amount: room.baseFee, dueDate, status,
          billingPeriod: billingPeriods[m], utilityCharges, miscCharges, lateFee,
        }
      });

      if (status === 'PAID') {
        await prisma.payment.create({
          data: {
            feeId: fee.id,
            amountPaid: room.baseFee + utilityCharges + miscCharges,
            paymentDate: new Date(dueDate.getTime() - 2 * 24 * 60 * 60 * 1000),
            paymentMethod: m % 2 === 0 ? 'ONLINE' : 'CARD',
            transactionReference: `TXN-REF-${fee.id.substring(0, 6).toUpperCase()}-${m}`,
            invoiceNumber: `INV-${fee.id.substring(0, 8).toUpperCase()}-${m}`,
            status: 'SUCCESS'
          }
        });
      }
    }
  }

  console.log('🔧 Seeding student complaints & comments...');
  const complaintsData = [
    { category: 'ELECTRICITY', title: 'Fan socket not working', desc: 'The ceiling fan socket in Room A102 is sparkling and not operating.', priority: 'HIGH' },
    { category: 'WATER', title: 'Leaky tap in common washroom', desc: 'Water is dripping constantly from the central tap, creating wet floor hazards.', priority: 'MEDIUM' },
    { category: 'INTERNET', title: 'Wi-Fi keeps dropping', desc: 'Wi-Fi connection is extremely unstable during evening hours, cannot attend classes.', priority: 'CRITICAL' },
    { category: 'FURNITURE', title: 'Bed frame loose', desc: 'My wooden bed frame is shaky and makes heavy noises when moving.', priority: 'LOW' },
    { category: 'CLEANLINESS', title: 'Dustbins not emptied', desc: 'Common room waste bin has not been cleared for the past 3 days.', priority: 'MEDIUM' },
  ];

  const wardens = staffUsers.filter(u => u.role === 'WARDEN');

  for (let i = 0; i < 15; i++) {
    const alloc = activeAllocations[i % activeAllocations.length];
    const sample = complaintsData[i % complaintsData.length];
    const status = ['SUBMITTED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED'][i % 4];

    const timeline = [
      { status: 'SUBMITTED', time: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), note: 'Complaint reported by student.' }
    ];
    if (status !== 'SUBMITTED') {
      timeline.push({ status: 'ASSIGNED', time: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), note: `Assigned to Warden ${wardens[i % wardens.length].name}` });
    }
    if (status === 'IN_PROGRESS' || status === 'RESOLVED') {
      timeline.push({ status: 'IN_PROGRESS', time: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), note: 'Inspection completed, waiting for electrician/plumber.' });
    }
    if (status === 'RESOLVED') {
      timeline.push({ status: 'RESOLVED', time: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), note: 'Issue fixed and verified.' });
    }

    const complaint = await prisma.complaint.create({
      data: {
        studentId: alloc.studentId,
        title: `${sample.title} #${i}`,
        description: sample.desc,
        category: sample.category,
        priority: sample.priority,
        status,
        assignedWardenId: status !== 'SUBMITTED' ? wardens[i % wardens.length].id : null,
        timeline: timeline,
      }
    });

    const commentStudent = students.find(s => s.id === alloc.studentId)!;
    await prisma.complaintComment.create({
      data: { complaintId: complaint.id, authorId: commentStudent.userId, content: 'Please look into this ASAP, it is disrupting my exam prep.' }
    });

    if (status !== 'SUBMITTED') {
      await prisma.complaintComment.create({
        data: { complaintId: complaint.id, authorId: wardens[i % wardens.length].id, content: 'Electrician has been informed. Expected resolution by tomorrow.' }
      });
    }
  }

  console.log('🚪 Seeding visitor check-ins & passes...');
  for (let i = 0; i < 20; i++) {
    const student = students[i % students.length];
    const status = ['PENDING', 'APPROVED', 'CHECKED_IN', 'CHECKED_OUT'][i % 4];
    await prisma.visitor.create({
      data: {
        name: `Visitor ${i}`,
        cnic: `35201-${1000000 + i * 2589}-4`,
        contactNumber: `+1-555-900${i}`,
        relation: i % 3 === 0 ? 'Father' : i % 3 === 1 ? 'Brother' : 'Friend',
        studentId: student.id,
        purpose: 'Drop off books and monthly pocket allowance.',
        securityPassCode: `PASS-${200000 + i}`,
        qrCodeToken: `QR-${Math.random().toString(36).substring(2, 12).toUpperCase()}`,
        status,
        checkInTime: status === 'CHECKED_IN' || status === 'CHECKED_OUT' ? new Date(Date.now() - 2 * 60 * 60 * 1000) : new Date(),
        checkOutTime: status === 'CHECKED_OUT' ? new Date(Date.now() - 10 * 60 * 1000) : null,
        approvedById: status !== 'PENDING' ? staffUsers[1].id : null
      }
    });
  }

  console.log('📅 Seeding 14 days of attendance logs...');
  const activeStudents = students.filter(s => s.status === 'ACTIVE');
  const wardenUser = wardens[0];

  for (let d = 0; d < 14; d++) {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() - d);
    targetDate.setHours(0, 0, 0, 0);

    const transactions = activeStudents.map((stud, idx) => {
      const rng = (idx + d) % 20;
      let status = 'PRESENT';
      if (rng === 0) status = 'ABSENT';
      else if (rng === 1) status = 'LATE';

      return prisma.attendance.create({
        data: {
          studentId: stud.id,
          date: targetDate,
          status,
          checkInTime: status !== 'ABSENT' ? new Date(targetDate.getTime() + (18 * 60 * 60 * 1000) + (rng * 10 * 60 * 1000)) : null,
          qrScanned: rng % 2 === 0,
          markedById: wardenUser.id
        }
      });
    });

    await prisma.$transaction(transactions);
  }

  console.log('🤖 Pre-calculating AI analytics models...');
  const totalCapacity = rooms.reduce((acc, r) => acc + r.capacity, 0);
  const occupiedBeds = activeAllocations.length;

  await prisma.aIAnalytics.create({
    data: {
      metricType: 'OCCUPANCY_FORECAST',
      forecastData: JSON.stringify({
        historical: [
          { month: '2026-03', actual: Math.round(totalCapacity * 0.70), predicted: Math.round(totalCapacity * 0.70), capacity: totalCapacity },
          { month: '2026-04', actual: Math.round(totalCapacity * 0.75), predicted: Math.round(totalCapacity * 0.74), capacity: totalCapacity },
          { month: '2026-05', actual: Math.round(totalCapacity * 0.79), predicted: Math.round(totalCapacity * 0.78), capacity: totalCapacity },
          { month: '2026-06', actual: occupiedBeds, predicted: Math.round(totalCapacity * 0.81), capacity: totalCapacity },
        ],
        forecast: [
          { month: '2026-07', actual: null, predicted: Math.round(totalCapacity * 0.83), capacity: totalCapacity },
          { month: '2026-08', actual: null, predicted: Math.round(totalCapacity * 0.85), capacity: totalCapacity },
          { month: '2026-09', actual: null, predicted: Math.round(totalCapacity * 0.88), capacity: totalCapacity },
          { month: '2026-10', actual: null, predicted: Math.round(totalCapacity * 0.90), capacity: totalCapacity },
          { month: '2026-11', actual: null, predicted: Math.round(totalCapacity * 0.91), capacity: totalCapacity },
          { month: '2026-12', actual: null, predicted: Math.round(totalCapacity * 0.92), capacity: totalCapacity },
        ]
      }),
      insights: `Occupancy metrics show steady growth from 70% in March 2026 to ${Math.round(occupiedBeds / totalCapacity * 100)}% in June. Linear regression predicts demand to rise to 92% by December 2026. Recommended: reserve Block C spare beds for incoming Autumn admissions.`,
      confidenceScore: 0.89,
    }
  });

  await prisma.aIAnalytics.create({
    data: {
      metricType: 'COMPLAINT_TRENDS',
      forecastData: JSON.stringify({
        statistics: [
          { category: 'ELECTRICITY', count: 12, percentage: 30, recent: 5, prior: 4 },
          { category: 'WATER', count: 8, percentage: 20, recent: 3, prior: 2 },
          { category: 'INTERNET', count: 15, percentage: 37, recent: 8, prior: 4 },
          { category: 'FURNITURE', count: 3, percentage: 7, recent: 1, prior: 2 },
          { category: 'CLEANLINESS', count: 2, percentage: 6, recent: 1, prior: 1 },
        ],
        avgResolutionHours: 28.5
      }),
      insights: 'Internet and Wi-Fi outages account for 37% of complaints. Recent month-on-month data reveals a 100% surge (+4 complaints) in internet tickets. Recommendation: Audit routers in Block B corridors for heat/overloading issues.',
      confidenceScore: 0.91,
    }
  });

  console.log('🚀 Database seeding completed successfully!');
}

main()
  .catch((e) => { console.error('❌ Error during seeding:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
