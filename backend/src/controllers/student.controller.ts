import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import prisma from '../utils/db';
import { z } from 'zod';
import bcrypt from 'bcrypt';

const studentCreateSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  studentId: z.string().min(3),
  cnic: z.string().min(5),
  gender: z.string(),
  department: z.string(),
  semester: z.number().int().min(1).max(12),
  phone: z.string(),
  emergencyContact: z.string(),
  address: z.string(),
  guardianName: z.string(),
  guardianRelation: z.string(),
  guardianContact: z.string(),
  guardianCnic: z.string(),
  guardianAddress: z.string(),
});

const studentUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  emergencyContact: z.string().optional(),
  address: z.string().optional(),
  department: z.string().optional(),
  semester: z.number().int().optional(),
  status: z.string().optional(),
  guardianName: z.string().optional(),
  guardianContact: z.string().optional(),
  guardianAddress: z.string().optional(),
});

export const getStudents = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { search, department, gender, status } = req.query;

    const whereClause: any = {};

    if (department) {
      whereClause.department = String(department);
    }
    if (gender) {
      whereClause.gender = String(gender);
    }
    if (status) {
      whereClause.status = status as string;
    }

    if (search) {
      const searchString = String(search);
      whereClause.OR = [
        { studentId: { contains: searchString } },
        { cnic: { contains: searchString } },
        { user: { name: { contains: searchString } } },
        { user: { email: { contains: searchString } } },
      ];
    }

    const students = await prisma.student.findMany({
      where: whereClause,
      include: {
        user: { select: { id: true, email: true, name: true, role: true, avatarUrl: true, isActive: true } },
        guardian: true,
        roomAllocations: {
          where: { isActive: true },
          include: { room: true }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(students);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getStudentById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, name: true, role: true, avatarUrl: true, isActive: true } },
        guardian: true,
        roomAllocations: {
          include: { room: true }
        },
        fees: {
          orderBy: { dueDate: 'desc' }
        },
        complaints: {
          orderBy: { createdAt: 'desc' }
        },
        attendance: {
          orderBy: { date: 'desc' },
          take: 30
        },
        visitors: {
          orderBy: { checkInTime: 'desc' }
        }
      }
    });

    if (!student) {
      res.status(404).json({ error: 'Student not found' });
      return;
    }

    res.json(student);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const createStudent = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const data = studentCreateSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) {
      res.status(400).json({ error: 'Email already registered' });
      return;
    }

    const existingRoll = await prisma.student.findUnique({ where: { studentId: data.studentId } });
    if (existingRoll) {
      res.status(400).json({ error: 'Roll number already exists' });
      return;
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const student = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: data.email,
          passwordHash,
          name: data.name,
          role: 'STUDENT',
        }
      });

      const guardian = await tx.guardian.create({
        data: {
          name: data.guardianName,
          relation: data.guardianRelation,
          contactNumber: data.guardianContact,
          cnic: data.guardianCnic,
          address: data.guardianAddress,
        }
      });

      return await tx.student.create({
        data: {
          userId: user.id,
          studentId: data.studentId,
          cnic: data.cnic,
          gender: data.gender,
          department: data.department,
          semester: data.semester,
          phone: data.phone,
          emergencyContact: data.emergencyContact,
          address: data.address,
          guardianId: guardian.id,
        },
        include: {
          user: { select: { id: true, email: true, name: true } },
          guardian: true,
        }
      });
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user?.userId,
        action: 'CREATE_STUDENT',
        entity: 'Student',
        entityId: student.id,
        details: `Created student: ${student.user.name} (${student.studentId})`,
      }
    });

    res.status(201).json(student);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors[0].message });
      return;
    }
    res.status(500).json({ error: err.message });
  }
};

export const updateStudent = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const data = studentUpdateSchema.parse(req.body);

    const student = await prisma.student.findUnique({ where: { id } });
    if (!student) {
      res.status(404).json({ error: 'Student not found' });
      return;
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (data.name) {
        await tx.user.update({
          where: { id: student.userId },
          data: { name: data.name }
        });
      }

      if (data.guardianName || data.guardianContact || data.guardianAddress) {
        const guardianData: any = {};
        if (data.guardianName) guardianData.name = data.guardianName;
        if (data.guardianContact) guardianData.contactNumber = data.guardianContact;
        if (data.guardianAddress) guardianData.address = data.guardianAddress;

        await tx.guardian.update({
          where: { id: student.guardianId },
          data: guardianData,
        });
      }

      const studentData: any = {};
      if (data.phone) studentData.phone = data.phone;
      if (data.emergencyContact) studentData.emergencyContact = data.emergencyContact;
      if (data.address) studentData.address = data.address;
      if (data.department) studentData.department = data.department;
      if (data.semester) studentData.semester = data.semester;
      if (data.status) studentData.status = data.status;

      return await tx.student.update({
        where: { id },
        data: studentData,
        include: {
          user: { select: { id: true, email: true, name: true } },
          guardian: true,
        }
      });
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user?.userId,
        action: 'UPDATE_STUDENT',
        entity: 'Student',
        entityId: id,
        details: `Updated info for ${updated.user.name}`,
      }
    });

    res.json(updated);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors[0].message });
      return;
    }
    res.status(500).json({ error: err.message });
  }
};

export const deleteStudent = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const student = await prisma.student.findUnique({
      where: { id },
      include: { user: true }
    });

    if (!student) {
      res.status(404).json({ error: 'Student not found' });
      return;
    }

    // Cascade delete is configured on database level or prisma transaction
    await prisma.$transaction([
      prisma.user.delete({ where: { id: student.userId } }), // cascade deletes student
      prisma.guardian.delete({ where: { id: student.guardianId } }),
    ]);

    await prisma.auditLog.create({
      data: {
        userId: req.user?.userId,
        action: 'DELETE_STUDENT',
        entity: 'Student',
        entityId: id,
        details: `Deleted student: ${student.user.name} (${student.studentId})`,
      }
    });

    res.json({ message: 'Student deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
