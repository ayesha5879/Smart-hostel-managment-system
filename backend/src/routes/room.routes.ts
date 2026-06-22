import { Router } from 'express';
import { getRooms, getRoomById, createRoom, updateRoom, allocateRoom, transferStudent, vacateRoom } from '../controllers/room.controller';
import { authenticateToken, authorizeRoles } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/', getRooms);
router.get('/:id', getRoomById);

router.post('/allocate', authorizeRoles('SUPER_ADMIN', 'HOSTEL_MANAGER'), allocateRoom);
router.post('/transfer', authorizeRoles('SUPER_ADMIN', 'HOSTEL_MANAGER'), transferStudent);
router.post('/vacate', authorizeRoles('SUPER_ADMIN', 'HOSTEL_MANAGER'), vacateRoom);
router.post('/', authorizeRoles('SUPER_ADMIN', 'HOSTEL_MANAGER'), createRoom);
router.put('/:id', authorizeRoles('SUPER_ADMIN', 'HOSTEL_MANAGER'), updateRoom);

export default router;
