import { Router } from 'express';
import { create_invoice, delete_invoice_by_id, get_invoice, update_invoice } from '../controllers/invoice';

const router = Router();

router.post('/add', create_invoice);
router.post('/edit', update_invoice);
router.get('/',get_invoice)
router.delete('/:id',delete_invoice_by_id)

export const invoiceRoutes = router;


