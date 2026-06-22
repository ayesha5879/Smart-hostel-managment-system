import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import prisma from '../utils/db';
import { z } from 'zod';

const roomSchema = z.object({
  roomNumber: z.string().min(1),
  floor: z.number().int(),
  building: z.string().min(1),
  capacity: z.number().int().min(1),
  roomType: z.string(),
  baseFee: z.number().min(0),
});

const allocationSchema = z.object({
  studentId: z.string().uuid(),
  roomId: z.string().uuid(),
});

export const getRooms = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const rooms = await prisma.room.findMany({
      include: {
        roomAllocations: {
          where: { isActive: true },
          include: { student: { include: { user: true } } }
        }
      },
      orderBy: { roomNumber: 'asc' }
    });

    const enrichedRooms = rooms.map(room => {
      const occupiedBeds = room.roomAllocations.length;
      const availableBeds = Math.max(0, room.capacity - occupiedBeds);
      return {
        ...room,
        occupiedBeds,
        availableBeds
      };
    });

    res.json(enrichedRooms);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getRoomById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const room = await prisma.room.findUnique({
      where: { id },
      include: {
        roomAllocations: {
          include: { student: { include: { user: true } } }
        }
      }
    });

    if (!room) {
      res.status(404).json({ error: 'Room not found' });
      return;
    }

    const occupiedBeds = room.roomAllocations.filter(a => a.isActive).length;
    const availableBeds = Math.max(0, room.capacity - occupiedBeds);

    res.json({
      ...room,
      occupiedBeds,
      availableBeds
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const createRoom = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const data = roomSchema.parse(req.body);

    const existing = await prisma.room.findUnique({ where: { roomNumber: data.roomNumber } });
    if (existing) {
      res.status(400).json({ error: 'Room number already exists' });
      return;
    }

    const room = await prisma.room.create({ data });

    await prisma.auditLog.create({
      data: {
        userId: req.user?.userId,
        action: 'CREATE_ROOM',
        entity: 'Room',
        entityId: room.id,
        details: `Created room: ${room.roomNumber} in building ${room.building}`,
      }
    });

    res.status(201).json(room);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors[0].message });
      return;
    }
    res.status(500).json({ error: err.message });
  }
};

export const updateRoom = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const data = roomSchema.partial().parse(req.body);

    const room = await prisma.room.findUnique({ where: { id } });
    if (!room) {
      res.status(404).json({ error: 'Room not found' });
      return;
    }

    const updated = await prisma.room.update({
      where: { id },
      data
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user?.userId,
        action: 'UPDATE_ROOM',
        entity: 'Room',
        entityId: id,
        details: `Updated room parameters for ${room.roomNumber}`,
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

export const allocateRoom = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { studentId, roomId } = allocationSchema.parse(req.body);

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { roomAllocations: { where: { isActive: true } } }
    });

    if (!student) {
      res.status(404).json({ error: 'Student not found' });
      return;
    }

    if (student.roomAllocations.length > 0) {
      res.status(400).json({ error: 'Student already has an active room allocation' });
      return;
    }

    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: { roomAllocations: { where: { isActive: true } } }
    });

    if (!room) {
      res.status(404).json({ error: 'Room not found' });
      return;
    }

    if (room.roomAllocations.length >= room.capacity) {
      res.status(400).json({ error: 'Room is fully occupied' });
      return;
    }

    if (room.isMaintenance) {
      res.status(400).json({ error: 'Room is under maintenance' });
      return;
    }

    const allocation = await prisma.roomAllocation.create({
      data: {
        studentId,
        roomId,
        isActive: true
      },
      include: {
        room: true,
        student: { include: { user: true } }
      }
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId: student.userId,
        title: 'Room Allocated',
        message: `You have been allocated Room ${allocation.room.roomNumber} in building ${allocation.room.building}.`,
        type: 'ROOM'
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user?.userId,
        action: 'ALLOCATE_ROOM',
        entity: 'RoomAllocation',
        entityId: allocation.id,
        details: `Allocated student ${allocation.student.user.name} to room ${allocation.room.roomNumber}`,
      }
    });

    res.status(201).json(allocation);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors[0].message });
      return;
    }
    res.status(500).json({ error: err.message });
  }
};

export const transferStudent = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { studentId, roomId } = allocationSchema.parse(req.body);

    const activeAlloc = await prisma.roomAllocation.findFirst({
      where: { studentId, isActive: true },
      include: { room: true }
    });

    if (!activeAlloc) {
      res.status(400).json({ error: 'Student has no active allocation to transfer' });
      return;
    }

    const targetRoom = await prisma.room.findUnique({
      where: { id: roomId },
      include: { roomAllocations: { where: { isActive: true } } }
    });

    if (!targetRoom) {
      res.status(404).json({ error: 'Target room not found' });
      return;
    }

    if (targetRoom.roomAllocations.length >= targetRoom.capacity) {
      res.status(400).json({ error: 'Target room is fully occupied' });
      return;
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Vacate old room
      await tx.roomAllocation.update({
        where: { id: activeAlloc.id },
        data: { isActive: false, vacatedAt: new Date() }
      });

      // 2. Allocate new room
      return await tx.roomAllocation.create({
        data: {
          studentId,
          roomId,
          isActive: true
        },
        include: {
          room: true,
          student: { include: { user: true } }
        }
      });
    });

    await prisma.notification.create({
      data: {
        userId: result.student.userId,
        title: 'Room Transfer Approved',
        message: `Your transfer from Room ${activeAlloc.room.roomNumber} to Room ${result.room.roomNumber} is complete.`,
        type: 'ROOM'
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user?.userId,
        action: 'TRANSFER_ROOM',
        entity: 'RoomAllocation',
        entityId: result.id,
        details: `Transferred ${result.student.user.name} from room ${activeAlloc.room.roomNumber} to room ${result.room.roomNumber}`,
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

export const vacateRoom = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { allocationId } = req.body;
    if (!allocationId) {
      res.status(400).json({ error: 'Allocation ID is required' });
      return;
    }

    const allocation = await prisma.roomAllocation.findUnique({
      where: { id: allocationId },
      include: { room: true, student: true }
    });

    if (!allocation || !allocation.isActive) {
      res.status(404).json({ error: 'Active allocation not found' });
      return;
    }

    const updated = await prisma.roomAllocation.update({
      where: { id: allocationId },
      data: { isActive: false, vacatedAt: new Date() }
    });

    await prisma.notification.create({
      data: {
        userId: allocation.student.userId,
        title: 'Room Vacated',
        message: `Your room allocation for Room ${allocation.room.roomNumber} has been vacated.`,
        type: 'ROOM'
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user?.userId,
        action: 'VACATE_ROOM',
        entity: 'RoomAllocation',
        entityId: allocationId,
        details: `Vacated allocation for student ID ${allocation.studentId} from room ${allocation.room.roomNumber}`,
      }
    });

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
