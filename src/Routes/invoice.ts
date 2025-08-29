import { Router } from 'express';
import { create_invoice, get_invoice, update_invoice } from '../controllers/invoice';

const router = Router();

router.post('/add', create_invoice);
router.post('/edit', update_invoice);
router.get('/',get_invoice)

export const invoiceRoutes = router;


