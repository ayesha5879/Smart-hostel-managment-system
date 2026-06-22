import { Router } from 'express';
import { getAttendance, markAttendanceManually, markAttendanceViaQR } from '../controllers/attendance.controller';
import { authenticateToken, authorizeRoles } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.post('/manual', authorizeRoles('SUPER_ADMIN', 'HOSTEL_MANAGER', 'WARDEN'), markAttendanceManually);
router.post('/qr-scan', authorizeRoles('STUDENT'), markAttendanceViaQR);
router.get('/', getAttendance);

export default router;
