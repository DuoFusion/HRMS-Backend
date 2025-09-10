import { Router } from 'express';
import { invoiceController } from '../controllers';

const router = Router();

router.post('/add', invoiceController.createMonthlyInvoice);
router.get('/all', invoiceController.get_invoice);

export const invoiceRoutes = router;


