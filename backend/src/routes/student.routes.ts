import { Router } from 'express';
import { getStudents, getStudentById, createStudent, updateStudent, deleteStudent } from '../controllers/student.controller';
import { authenticateToken, authorizeRoles } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/', authorizeRoles('SUPER_ADMIN', 'HOSTEL_MANAGER', 'WARDEN'), getStudents);
router.get('/:id', getStudentById);
router.post('/', authorizeRoles('SUPER_ADMIN', 'HOSTEL_MANAGER'), createStudent);
router.put('/:id', authorizeRoles('SUPER_ADMIN', 'HOSTEL_MANAGER'), updateStudent);
router.delete('/:id', authorizeRoles('SUPER_ADMIN', 'HOSTEL_MANAGER'), deleteStudent);

export default router;
