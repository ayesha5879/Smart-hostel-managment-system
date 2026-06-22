import { Router } from 'express';
import { getVisitors, registerVisitor, approveVisitor, checkInVisitor, checkOutVisitor } from '../controllers/visitor.controller';
import { authenticateToken, authorizeRoles } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/', getVisitors);
router.post('/check-in', authorizeRoles('SUPER_ADMIN', 'HOSTEL_MANAGER', 'WARDEN'), checkInVisitor);
router.post('/check-out', authorizeRoles('SUPER_ADMIN', 'HOSTEL_MANAGER', 'WARDEN'), checkOutVisitor);
router.post('/register', registerVisitor);
router.put('/:id/approve', authorizeRoles('SUPER_ADMIN', 'HOSTEL_MANAGER', 'WARDEN'), approveVisitor);

export default router;
