import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import prisma from '../utils/db';
import { z } from 'zod';

const visitorRegisterSchema = z.object({
  name: z.string().min(2),
  cnic: z.string().min(5),
  contactNumber: z.string(),
  relation: z.string(),
  studentRollNumber: z.string().min(1),
  purpose: z.string().min(2),
});

export const getVisitors = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { status, search } = req.query;

    const where: any = {};
    if (status) where.status = status as string;

    // Students see only their own visitor logs
    if (req.user?.role === 'STUDENT') {
      const student = await prisma.student.findUnique({ where: { userId: req.user.userId } });
      if (!student) {
        res.status(403).json({ error: 'Student profile not found' });
        return;
      }
      where.studentId = student.id;
    }

    if (search) {
      const searchStr = String(search);
      where.OR = [
        { name: { contains: searchStr } },
        { cnic: { contains: searchStr } },
        { student: { studentId: { contains: searchStr } } },
        { student: { user: { name: { contains: searchStr } } } },
      ];
    }

    const visitors = await prisma.visitor.findMany({
      where,
      include: {
        student: { include: { user: { select: { name: true, email: true } } } },
        approvedBy: { select: { name: true } }
      },
      orderBy: { checkInTime: 'desc' }
    });

    res.json(visitors);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const registerVisitor = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const data = visitorRegisterSchema.parse(req.body);

    const student = await prisma.student.findUnique({
      where: { studentId: data.studentRollNumber },
      include: { user: true }
    });

    if (!student) {
      res.status(404).json({ error: 'Student roll number not found' });
      return;
    }

    // Generate security token and codes
    const securityPassCode = 'PASS-' + Math.floor(100000 + Math.random() * 900000);
    const qrCodeToken = 'QR-' + Math.random().toString(36).substring(2, 15).toUpperCase();

    // Default status: APPROVED if manager/warden registered, PENDING if student registered
    const defaultStatus = (req.user?.role === 'STUDENT') ? 'PENDING' : 'APPROVED';

    const visitor = await prisma.visitor.create({
      data: {
        name: data.name,
        cnic: data.cnic,
        contactNumber: data.contactNumber,
        relation: data.relation,
        studentId: student.id,
        purpose: data.purpose,
        securityPassCode,
        qrCodeToken,
        status: defaultStatus,
        approvedById: (req.user?.role !== 'STUDENT') ? req.user?.userId : null,
      },
      include: {
        student: { include: { user: true } }
      }
    });

    // Notify Student if pending
    if (defaultStatus === 'APPROVED') {
      await prisma.notification.create({
        data: {
          userId: student.userId,
          title: 'Visitor Approved',
          message: `Visitor: ${visitor.name} (${visitor.relation}) is registered with code ${visitor.securityPassCode}`,
          type: 'VISITOR'
        }
      });
    }

    await prisma.auditLog.create({
      data: {
        userId: req.user?.userId,
        action: 'REGISTER_VISITOR',
        entity: 'Visitor',
        entityId: visitor.id,
        details: `Registered visitor ${visitor.name} for student ${visitor.student.user.name}`,
      }
    });

    res.status(201).json(visitor);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors[0].message });
      return;
    }
    res.status(500).json({ error: err.message });
  }
};

export const approveVisitor = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const visitor = await prisma.visitor.findUnique({
      where: { id },
      include: { student: true }
    });

    if (!visitor) {
      res.status(404).json({ error: 'Visitor record not found' });
      return;
    }

    const updated = await prisma.visitor.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedById: req.user?.userId
      }
    });

    await prisma.notification.create({
      data: {
        userId: visitor.student.userId,
        title: 'Visitor Pass Approved',
        message: `Your visitor request for ${visitor.name} has been approved. Pass code: ${visitor.securityPassCode}`,
        type: 'VISITOR'
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user?.userId,
        action: 'APPROVE_VISITOR',
        entity: 'Visitor',
        entityId: id,
        details: `Approved visitor request for ${visitor.name}`,
      }
    });

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const checkInVisitor = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { passCode } = req.body;
    if (!passCode) {
      res.status(400).json({ error: 'Pass code is required for check-in' });
      return;
    }

    const visitor = await prisma.visitor.findUnique({
      where: { securityPassCode: passCode },
      include: { student: true }
    });

    if (!visitor) {
      res.status(404).json({ error: 'Invalid pass code' });
      return;
    }

    if (visitor.status !== 'APPROVED') {
      res.status(400).json({ error: `Visitor status is ${visitor.status}. Check-in is only allowed for APPROVED passes.` });
      return;
    }

    const updated = await prisma.visitor.update({
      where: { id: visitor.id },
      data: {
        status: 'CHECKED_IN',
        checkInTime: new Date()
      }
    });

    await prisma.notification.create({
      data: {
        userId: visitor.student.userId,
        title: 'Visitor Checked In',
        message: `Your visitor ${visitor.name} has entered the hostel premises.`,
        type: 'VISITOR'
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user?.userId,
        action: 'VISITOR_CHECK_IN',
        entity: 'Visitor',
        entityId: visitor.id,
        details: `Checked in visitor ${visitor.name} with pass code ${passCode}`,
      }
    });

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const checkOutVisitor = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { passCode } = req.body;
    if (!passCode) {
      res.status(400).json({ error: 'Pass code is required for check-out' });
      return;
    }

    const visitor = await prisma.visitor.findUnique({
      where: { securityPassCode: passCode },
      include: { student: true }
    });

    if (!visitor) {
      res.status(404).json({ error: 'Invalid pass code' });
      return;
    }

    if (visitor.status !== 'CHECKED_IN') {
      res.status(400).json({ error: `Visitor status is ${visitor.status}. Check-out is only allowed for CHECKED_IN visitors.` });
      return;
    }

    const updated = await prisma.visitor.update({
      where: { id: visitor.id },
      data: {
        status: 'CHECKED_OUT',
        checkOutTime: new Date()
      }
    });

    await prisma.notification.create({
      data: {
        userId: visitor.student.userId,
        title: 'Visitor Checked Out',
        message: `Your visitor ${visitor.name} has left the hostel.`,
        type: 'VISITOR'
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user?.userId,
        action: 'VISITOR_CHECK_OUT',
        entity: 'Visitor',
        entityId: visitor.id,
        details: `Checked out visitor ${visitor.name} with pass code ${passCode}`,
      }
    });

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
