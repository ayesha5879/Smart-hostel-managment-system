import { Router } from 'express';
import { getGeneralStats, getOccupancyForecast, getComplaintTrends, getFeeRiskReport, getAttendanceRiskReport } from '../controllers/analytics.controller';
import { authenticateToken, authorizeRoles } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);
router.use(authorizeRoles('SUPER_ADMIN', 'HOSTEL_MANAGER', 'WARDEN'));

router.get('/stats', getGeneralStats);
router.get('/occupancy', getOccupancyForecast);
router.get('/complaints', getComplaintTrends);
router.get('/fees', getFeeRiskReport);
router.get('/attendance', getAttendanceRiskReport);

export default router;
