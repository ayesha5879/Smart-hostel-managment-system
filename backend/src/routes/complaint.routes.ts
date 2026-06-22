import { Router } from 'express';
import { getComplaints, getComplaintById, submitComplaint, assignComplaint, updateComplaintStatus, addComplaintComment } from '../controllers/complaint.controller';
import { authenticateToken, authorizeRoles } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/', getComplaints);
router.get('/:id', getComplaintById);
router.post('/', submitComplaint);

router.put('/:id/assign', authorizeRoles('SUPER_ADMIN', 'HOSTEL_MANAGER', 'WARDEN'), assignComplaint);
router.put('/:id/status', authorizeRoles('SUPER_ADMIN', 'HOSTEL_MANAGER', 'WARDEN'), updateComplaintStatus);
router.post('/:id/comments', addComplaintComment);

export default router;
