import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import prisma from '../utils/db';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-12345!hostel-secret';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'super-secret-refresh-key-12345!hostel-refresh-secret';

// Schema validations
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  role: z.string().default('STUDENT'),
  // Student specific details if role is STUDENT
  studentId: z.string().optional(),
  cnic: z.string().optional(),
  gender: z.string().optional(),
  department: z.string().optional(),
  semester: z.number().int().optional(),
  phone: z.string().optional(),
  emergencyContact: z.string().optional(),
  address: z.string().optional(),
  // Guardian details if student
  guardianName: z.string().optional(),
  guardianRelation: z.string().optional(),
  guardianContact: z.string().optional(),
  guardianCnic: z.string().optional(),
  guardianAddress: z.string().optional(),
});

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email },
      include: { studentProfile: true }
    });

    if (!user || !user.isActive) {
      res.status(401).json({ error: 'Invalid email or inactive account' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Generate tokens
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'USER_LOGIN',
        entity: 'User',
        entityId: user.id,
        details: 'User successfully authenticated',
      }
    });

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatarUrl: user.avatarUrl,
        studentProfileId: user.studentProfile?.id || null
      }
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors[0].message });
      return;
    }
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = registerSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) {
      res.status(400).json({ error: 'Email already registered' });
      return;
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Base User
      const user = await tx.user.create({
        data: {
          email: data.email,
          passwordHash,
          name: data.name,
          role: data.role,
          isActive: true
        }
      });

      // 2. If User is STUDENT, build Student & Guardian profile
      if (data.role === 'STUDENT') {
        if (!data.studentId || !data.cnic || !data.gender || !data.department || !data.semester || !data.phone || !data.emergencyContact || !data.address || !data.guardianName || !data.guardianRelation || !data.guardianContact || !data.guardianCnic || !data.guardianAddress) {
          throw new Error('All student and guardian registration details are required for student accounts.');
        }

        // Check if studentId is unique
        const existingStudent = await tx.student.findUnique({ where: { studentId: data.studentId } });
        if (existingStudent) {
          throw new Error('Student roll number already registered');
        }

        // Create or connect Guardian
        const guardian = await tx.guardian.create({
          data: {
            name: data.guardianName,
            relation: data.guardianRelation,
            contactNumber: data.guardianContact,
            cnic: data.guardianCnic,
            address: data.guardianAddress,
          }
        });

        await tx.student.create({
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
          }
        });
      }

      return user;
    });

    await prisma.auditLog.create({
      data: {
        userId: result.id,
        action: 'USER_REGISTER',
        entity: 'User',
        entityId: result.id,
        details: `Registered new account with role: ${data.role}`,
      }
    });

    res.status(201).json({ message: 'User registered successfully', userId: result.id });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors[0].message });
      return;
    }
    res.status(400).json({ error: err.message });
  }
};

export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    res.status(400).json({ error: 'Refresh token is required' });
    return;
  }

  try {
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as any;
    
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user || !user.isActive) {
      res.status(403).json({ error: 'User is inactive or not found' });
      return;
    }

    const newAccessToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({ accessToken: newAccessToken });
  } catch (err) {
    res.status(403).json({ error: 'Invalid or expired refresh token' });
  }
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ error: 'Email is required' });
    return;
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(404).json({ error: 'No account found with this email' });
      return;
    }

    // Mock verification code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // In production, send email here. We return it for testing/mock purposes.
    res.json({
      message: 'Password reset code generated and sent to email (simulated)',
      resetCode, // Dev verification shortcut
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;
  if (!email || !password || password.length < 6) {
    res.status(400).json({ error: 'Valid email and password (min 6 chars) are required' });
    return;
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { email },
      data: { passwordHash }
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'PASSWORD_RESET',
        entity: 'User',
        entityId: user.id,
        details: 'Password updated successfully',
      }
    });

    res.json({ message: 'Password reset successful' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
