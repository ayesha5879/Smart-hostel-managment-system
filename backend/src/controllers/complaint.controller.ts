import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import prisma from '../utils/db';
import { z } from 'zod';

const createComplaintSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(5),
  category: z.string(),
  priority: z.string().default('MEDIUM'),
  imageUrl: z.string().optional(),
});

const updateStatusSchema = z.object({
  status: z.string(),
  note: z.string().optional(),
});

const assignComplaintSchema = z.object({
  wardenId: z.string().uuid(),
});

const commentSchema = z.object({
  content: z.string().min(1),
});

export const getComplaints = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { status, category, priority } = req.query;

    const where: any = {};
    if (status) where.status = status as string;
    if (category) where.category = category as string;
    if (priority) where.priority = priority as string;

    // Students only see their own complaints
    if (req.user?.role === 'STUDENT') {
      const student = await prisma.student.findUnique({ where: { userId: req.user.userId } });
      if (!student) {
        res.status(403).json({ error: 'Student profile not found' });
        return;
      }
      where.studentId = student.id;
    }

    const complaints = await prisma.complaint.findMany({
      where,
      include: {
        student: { include: { user: { select: { name: true, email: true } } } },
        assignedWarden: { select: { name: true, email: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(complaints);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getComplaintById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const complaint = await prisma.complaint.findUnique({
      where: { id },
      include: {
        student: { include: { user: { select: { name: true, email: true } } } },
        assignedWarden: { select: { name: true, email: true } },
        comments: {
          include: { author: { select: { name: true, role: true, avatarUrl: true } } },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!complaint) {
      res.status(404).json({ error: 'Complaint not found' });
      return;
    }

    // Student privacy
    if (req.user?.role === 'STUDENT' && complaint.student.userId !== req.user.userId) {
      res.status(403).json({ error: 'Access Denied' });
      return;
    }

    res.json(complaint);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const submitComplaint = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const data = createComplaintSchema.parse(req.body);

    const student = await prisma.student.findUnique({
      where: { userId: req.user?.userId }
    });

    if (!student) {
      res.status(403).json({ error: 'Only students can submit complaints' });
      return;
    }

    const timeline = [
      { status: 'SUBMITTED', time: new Date().toISOString(), note: 'Complaint submitted by student.' }
    ];

    const complaint = await prisma.complaint.create({
      data: {
        studentId: student.id,
        title: data.title,
        description: data.description,
        category: data.category,
        priority: data.priority,
        imageUrl: data.imageUrl || null,
        timeline: JSON.stringify(timeline),
        status: 'SUBMITTED'
      },
      include: {
        student: { include: { user: true } }
      }
    });

    // Notify Managers/Wardens (simulated via general broadcast or database updates)
    await prisma.auditLog.create({
      data: {
        userId: req.user?.userId,
        action: 'SUBMIT_COMPLAINT',
        entity: 'Complaint',
        entityId: complaint.id,
        details: `Submitted complaint: "${complaint.title}" under category ${complaint.category}`,
      }
    });

    res.status(201).json(complaint);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors[0].message });
      return;
    }
    res.status(500).json({ error: err.message });
  }
};

export const assignComplaint = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { wardenId } = assignComplaintSchema.parse(req.body);

    const complaint = await prisma.complaint.findUnique({ where: { id } });
    if (!complaint) {
      res.status(404).json({ error: 'Complaint not found' });
      return;
    }

    const warden = await prisma.user.findUnique({ where: { id: wardenId } });
    if (!warden || warden.role !== 'WARDEN') {
      res.status(400).json({ error: 'Assigned staff must be a WARDEN' });
      return;
    }

    const currentTimeline = JSON.parse(complaint.timeline as string) as Array<any>;
    const updatedTimeline = [
      ...currentTimeline,
      { status: 'ASSIGNED', time: new Date().toISOString(), note: `Assigned to Warden ${warden.name}.` }
    ];

    const updated = await prisma.complaint.update({
      where: { id },
      data: {
        assignedWardenId: wardenId,
        status: 'ASSIGNED',
        timeline: JSON.stringify(updatedTimeline)
      },
      include: { student: true }
    });

    await prisma.notification.create({
      data: {
        userId: updated.student.userId,
        title: 'Complaint Assigned',
        message: `Your complaint "${updated.title}" has been assigned to Warden ${warden.name} for inspection.`,
        type: 'COMPLAINT'
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user?.userId,
        action: 'ASSIGN_COMPLAINT',
        entity: 'Complaint',
        entityId: id,
        details: `Assigned complaint "${complaint.title}" to warden ID ${wardenId}`,
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

export const updateComplaintStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, note } = updateStatusSchema.parse(req.body);

    const complaint = await prisma.complaint.findUnique({ where: { id } });
    if (!complaint) {
      res.status(404).json({ error: 'Complaint not found' });
      return;
    }

    const currentTimeline = JSON.parse(complaint.timeline as string) as Array<any>;
    const updatedTimeline = [
      ...currentTimeline,
      { status, time: new Date().toISOString(), note: note || `Status updated to ${status}.` }
    ];

    const updated = await prisma.complaint.update({
      where: { id },
      data: {
        status,
        timeline: JSON.stringify(updatedTimeline)
      },
      include: { student: true }
    });

    await prisma.notification.create({
      data: {
        userId: updated.student.userId,
        title: `Complaint Update: ${status}`,
        message: `Your complaint "${updated.title}" status has changed to ${status}. Note: ${note || 'No notes left.'}`,
        type: 'COMPLAINT'
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user?.userId,
        action: 'UPDATE_COMPLAINT_STATUS',
        entity: 'Complaint',
        entityId: id,
        details: `Updated status of "${complaint.title}" to ${status}`,
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

export const addComplaintComment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { content } = commentSchema.parse(req.body);

    const complaint = await prisma.complaint.findUnique({ where: { id } });
    if (!complaint) {
      res.status(404).json({ error: 'Complaint not found' });
      return;
    }

    const comment = await prisma.complaintComment.create({
      data: {
        complaintId: id,
        authorId: req.user!.userId,
        content
      },
      include: {
        author: { select: { name: true, role: true, avatarUrl: true } }
      }
    });

    res.status(201).json(comment);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors[0].message });
      return;
    }
    res.status(500).json({ error: err.message });
  }
};
