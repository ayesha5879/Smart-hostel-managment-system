import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import prisma from '../utils/db';
import { z } from 'zod';

const manualAttendanceSchema = z.object({
  date: z.string().transform(str => new Date(str)),
  records: z.array(z.object({
    studentId: z.string().uuid(),
    status: z.string()
  }))
});

const qrScanSchema = z.object({
  qrToken: z.string() // Simulated token containing location/timestamp authorization
});

export const getAttendance = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { date, studentId, startDate, endDate } = req.query;

    const where: any = {};

    if (date) {
      const parsedDate = new Date(String(date));
      // Normalize to midnight UTC/local
      const startOfDay = new Date(parsedDate.setHours(0,0,0,0));
      const endOfDay = new Date(parsedDate.setHours(23,59,59,999));
      where.date = {
        gte: startOfDay,
        lte: endOfDay
      };
    } else if (startDate && endDate) {
      where.date = {
        gte: new Date(String(startDate)),
        lte: new Date(String(endDate))
      };
    }

    if (req.user?.role === 'STUDENT') {
      const student = await prisma.student.findUnique({ where: { userId: req.user.userId } });
      if (!student) {
        res.status(403).json({ error: 'Student profile not found' });
        return;
      }
      where.studentId = student.id;
    } else if (studentId) {
      where.studentId = String(studentId);
    }

    const attendance = await prisma.attendance.findMany({
      where,
      include: {
        student: { include: { user: { select: { name: true, email: true } } } },
        markedBy: { select: { name: true } }
      },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }]
    });

    res.json(attendance);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const markAttendanceManually = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { date, records } = manualAttendanceSchema.parse(req.body);

    const formattedDate = new Date(date.setHours(0,0,0,0));

    const transactions = records.map(rec => {
      return prisma.attendance.upsert({
        where: {
          studentId_date: {
            studentId: rec.studentId,
            date: formattedDate
          }
        },
        update: {
          status: rec.status,
          markedById: req.user?.userId
        },
        create: {
          studentId: rec.studentId,
          date: formattedDate,
          status: rec.status,
          markedById: req.user?.userId
        }
      });
    });

    const results = await prisma.$transaction(transactions);

    await prisma.auditLog.create({
      data: {
        userId: req.user?.userId,
        action: 'MARK_ATTENDANCE_MANUAL',
        entity: 'Attendance',
        details: `Marked attendance for ${results.length} students on date ${formattedDate.toLocaleDateString()}`,
      }
    });

    res.json({ message: 'Attendance recorded successfully', count: results.length });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors[0].message });
      return;
    }
    res.status(500).json({ error: err.message });
  }
};

export const markAttendanceViaQR = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { qrToken } = qrScanSchema.parse(req.body);

    // Verify student profile
    if (req.user?.role !== 'STUDENT') {
      res.status(400).json({ error: 'Only students can scan attendance QR codes' });
      return;
    }

    const student = await prisma.student.findUnique({
      where: { userId: req.user.userId },
      include: { user: true }
    });

    if (!student) {
      res.status(404).json({ error: 'Student profile not found' });
      return;
    }

    // Simple verification check on simulated QR token format e.g. "AEGIS-GATE-DATE"
    if (!qrToken.startsWith('AEGIS-GATE')) {
      res.status(400).json({ error: 'Invalid or expired QR code token' });
      return;
    }

    const today = new Date();
    const formattedDate = new Date(today.setHours(0,0,0,0));

    // Calculate late vs present based on checkin time
    // If scanning after 10:00 PM, flag as LATE
    const currentHour = new Date().getHours();
    const status = currentHour >= 22 ? 'LATE' : 'PRESENT';

    const attendanceRecord = await prisma.attendance.upsert({
      where: {
        studentId_date: {
          studentId: student.id,
          date: formattedDate
        }
      },
      update: {
        status,
        checkInTime: new Date(),
        qrScanned: true
      },
      create: {
        studentId: student.id,
        date: formattedDate,
        status,
        checkInTime: new Date(),
        qrScanned: true
      }
    });

    // Notify Student
    await prisma.notification.create({
      data: {
        userId: student.userId,
        title: 'Attendance Registered',
        message: `Your attendance has been registered successfully via QR. Status: ${status}`,
        type: 'ATTENDANCE'
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: student.userId,
        action: 'MARK_ATTENDANCE_QR',
        entity: 'Attendance',
        entityId: attendanceRecord.id,
        details: `Registered attendance status ${status} via QR Scan`,
      }
    });

    res.json(attendanceRecord);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors[0].message });
      return;
    }
    res.status(500).json({ error: err.message });
  }
};
