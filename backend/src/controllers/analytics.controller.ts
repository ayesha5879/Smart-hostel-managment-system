import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import prisma from '../utils/db';
import { AIService } from '../services/ai.service';

export const getGeneralStats = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const totalStudents = await prisma.student.count({ where: { status: 'ACTIVE' } });
    const totalRooms = await prisma.room.count();

    const activeAllocations = await prisma.roomAllocation.findMany({
      where: { isActive: true },
      include: { room: true }
    });

    const occupiedBeds = activeAllocations.length;
    const rooms = await prisma.room.findMany();
    const totalCapacity = rooms.reduce((acc, r) => acc + r.capacity, 0);
    const availableBeds = Math.max(0, totalCapacity - occupiedBeds);

    const pendingComplaints = await prisma.complaint.count({
      where: { status: { in: ['SUBMITTED', 'ASSIGNED', 'IN_PROGRESS'] } }
    });

    const activeVisitors = await prisma.visitor.count({ where: { status: 'CHECKED_IN' } });

    const totalAttendanceRecords = await prisma.attendance.count({
      where: { date: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }
    });
    const presentAttendanceRecords = await prisma.attendance.count({
      where: {
        date: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        status: { in: ['PRESENT', 'LATE'] }
      }
    });
    const attendanceRate = totalAttendanceRecords > 0 ? (presentAttendanceRecords / totalAttendanceRecords) * 100 : 100;

    const paidFees = await prisma.fee.findMany({ where: { status: 'PAID' } });
    const unpaidFees = await prisma.fee.findMany({ where: { status: { in: ['PENDING', 'OVERDUE'] } } });

    const totalCollected = paidFees.reduce((acc, f) => acc + f.amount + f.utilityCharges + f.securityDeposit + f.miscCharges + f.lateFee, 0);
    const totalOutstanding = unpaidFees.reduce((acc, f) => acc + f.amount + f.utilityCharges + f.securityDeposit + f.miscCharges + f.lateFee, 0);

    res.json({
      totalStudents, totalRooms, totalCapacity, occupiedBeds, availableBeds,
      pendingComplaints, activeVisitors,
      attendanceRate: Math.round(attendanceRate),
      finance: { collected: totalCollected, outstanding: totalOutstanding }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getOccupancyForecast = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const forecast = await AIService.forecastOccupancy();
    res.json(forecast);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getComplaintTrends = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const analysis = await AIService.analyzeComplaints();
    res.json(analysis);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getFeeRiskReport = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const risks = await AIService.predictLatePayments();
    res.json(risks);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getAttendanceRiskReport = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const risks = await AIService.predictAttendanceRisks();
    res.json(risks);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
