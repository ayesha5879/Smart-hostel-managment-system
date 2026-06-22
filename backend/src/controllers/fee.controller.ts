import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import prisma from '../utils/db';
import { z } from 'zod';
import { PdfService } from '../services/pdf.service';

const createFeeSchema = z.object({
  studentId: z.string().uuid(),
  billingPeriod: z.string().min(3), // e.g., "June 2026"
  dueDate: z.string().transform(str => new Date(str)),
  utilityCharges: z.number().min(0).default(0),
  securityDeposit: z.number().min(0).default(0),
  miscCharges: z.number().min(0).default(0),
});

const recordPaymentSchema = z.object({
  feeId: z.string().uuid(),
  paymentMethod: z.string(),
  transactionReference: z.string().min(4),
});

export const getFees = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { status, billingPeriod, studentId } = req.query;

    const where: any = {};
    if (status) where.status = status as string;
    if (billingPeriod) where.billingPeriod = String(billingPeriod);
    if (studentId) where.studentId = String(studentId);

    // If student role, restrict to their own records
    if (req.user?.role === 'STUDENT') {
      const student = await prisma.student.findUnique({ where: { userId: req.user.userId } });
      if (!student) {
        res.status(403).json({ error: 'Student profile not found' });
        return;
      }
      where.studentId = student.id;
    }

    const fees = await prisma.fee.findMany({
      where,
      include: {
        student: { include: { user: { select: { name: true, email: true } } } },
        roomAllocation: { include: { room: true } },
        payments: true
      },
      orderBy: { dueDate: 'desc' }
    });

    res.json(fees);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getFeeById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const fee = await prisma.fee.findUnique({
      where: { id },
      include: {
        student: { include: { user: true } },
        roomAllocation: { include: { room: true } },
        payments: true
      }
    });

    if (!fee) {
      res.status(404).json({ error: 'Invoice not found' });
      return;
    }

    // Student privacy check
    if (req.user?.role === 'STUDENT' && fee.student.userId !== req.user.userId) {
      res.status(403).json({ error: 'Forbidden: Access denied' });
      return;
    }

    res.json(fee);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const createFeeInvoice = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const data = createFeeSchema.parse(req.body);

    // Verify student has active allocation to inherit base room rent
    const allocation = await prisma.roomAllocation.findFirst({
      where: { studentId: data.studentId, isActive: true },
      include: { room: true }
    });

    if (!allocation) {
      res.status(400).json({ error: 'Student has no active room allocation to bill' });
      return;
    }

    // Check if invoice already exists for this billing period & student
    const existing = await prisma.fee.findFirst({
      where: {
        studentId: data.studentId,
        billingPeriod: data.billingPeriod
      }
    });

    if (existing) {
      res.status(400).json({ error: `Invoice already generated for ${data.billingPeriod}` });
      return;
    }

    const fee = await prisma.fee.create({
      data: {
        studentId: data.studentId,
        roomAllocationId: allocation.id,
        amount: allocation.room.baseFee,
        dueDate: data.dueDate,
        billingPeriod: data.billingPeriod,
        utilityCharges: data.utilityCharges,
        securityDeposit: data.securityDeposit,
        miscCharges: data.miscCharges,
        status: 'PENDING'
      },
      include: {
        student: { include: { user: true } }
      }
    });

    // Create Notification
    await prisma.notification.create({
      data: {
        userId: fee.student.userId,
        title: 'New Fee Invoice Generated',
        message: `Your fee invoice for ${fee.billingPeriod} of $${(fee.amount + fee.utilityCharges + fee.securityDeposit + fee.miscCharges).toFixed(2)} has been generated. Due date: ${new Date(fee.dueDate).toLocaleDateString()}`,
        type: 'FEE'
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user?.userId,
        action: 'CREATE_FEE',
        entity: 'Fee',
        entityId: fee.id,
        details: `Generated fee invoice for student ID ${fee.studentId} for period ${fee.billingPeriod}`,
      }
    });

    res.status(201).json(fee);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors[0].message });
      return;
    }
    res.status(500).json({ error: err.message });
  }
};

export const recordPayment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { feeId, paymentMethod, transactionReference } = recordPaymentSchema.parse(req.body);

    const fee = await prisma.fee.findUnique({
      where: { id: feeId },
      include: { student: true, payments: { where: { status: 'SUCCESS' } } }
    });

    if (!fee) {
      res.status(404).json({ error: 'Invoice not found' });
      return;
    }

    if (fee.status === 'PAID' || fee.payments.length > 0) {
      res.status(400).json({ error: 'Invoice is already paid' });
      return;
    }

    const totalAmount = fee.amount + fee.utilityCharges + fee.securityDeposit + fee.miscCharges + fee.lateFee;

    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          feeId,
          amountPaid: totalAmount,
          paymentMethod,
          transactionReference,
          invoiceNumber: `INV-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
          status: 'SUCCESS'
        }
      });

      const updatedFee = await tx.fee.update({
        where: { id: feeId },
        data: { status: 'PAID' }
      });

      return { payment, updatedFee };
    });

    await prisma.notification.create({
      data: {
        userId: fee.student.userId,
        title: 'Fee Paid Successfully',
        message: `Your payment of $${totalAmount.toFixed(2)} for ${fee.billingPeriod} has been registered successfully. Ref: ${transactionReference}`,
        type: 'FEE'
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user?.userId,
        action: 'RECORD_PAYMENT',
        entity: 'Payment',
        entityId: result.payment.id,
        details: `Recorded payment of $${totalAmount} for Fee Invoice ID ${feeId}`,
      }
    });

    res.json(result);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors[0].message });
      return;
    }
    res.status(500).json({ error: err.message });
  }
};

export const downloadInvoicePdf = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const fee = await prisma.fee.findUnique({
      where: { id },
      include: {
        student: { include: { user: true } },
        roomAllocation: { include: { room: true } },
        payments: {
          where: { status: 'SUCCESS' },
          take: 1
        }
      }
    });

    if (!fee) {
      res.status(404).json({ error: 'Invoice not found' });
      return;
    }

    // Student privacy
    if (req.user?.role === 'STUDENT' && fee.student.userId !== req.user.userId) {
      res.status(403).json({ error: 'Access Denied' });
      return;
    }

    const successfulPayment = fee.payments[0];
    const pdfBuffer = PdfService.generateInvoicePdf(
      fee as any,
      successfulPayment?.transactionReference,
      successfulPayment?.paymentDate
    );

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Invoice-${fee.billingPeriod.replace(' ', '_')}.pdf`);
    res.send(pdfBuffer);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
