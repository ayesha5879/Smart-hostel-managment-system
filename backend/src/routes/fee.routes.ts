import { Router } from 'express';
import { getFees, getFeeById, createFeeInvoice, recordPayment, downloadInvoicePdf } from '../controllers/fee.controller';
import { authenticateToken, authorizeRoles } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/', getFees);
router.get('/:id', getFeeById);
router.get('/:id/pdf', downloadInvoicePdf);

router.post('/pay', recordPayment);
router.post('/', authorizeRoles('SUPER_ADMIN', 'HOSTEL_MANAGER'), createFeeInvoice);

export default router;
