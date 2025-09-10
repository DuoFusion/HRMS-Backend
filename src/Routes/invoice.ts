import { Router } from 'express';
import { invoiceController } from '../controllers';

const router = Router();

router.post('/add', invoiceController.create_invoice);
router.post('/edit', invoiceController.edit_invoice_by_id);
router.delete('/:id', invoiceController.delete_invoice_by_id);
router.get('/all', invoiceController.get_invoice);
router.get('/:id', invoiceController.get_invoice_by_id);

export const invoiceRoutes = router;