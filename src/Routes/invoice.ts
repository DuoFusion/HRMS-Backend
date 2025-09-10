import { Router } from 'express';
import { invoiceController } from '../controllers';

const router = Router();

router.post('/add', invoiceController.createMonthlyInvoice);

export const invoiceRoutes = router;


