import { Router } from 'express';
import { create_invoice, update_invoice } from '../controllers/invoice';

const router = Router();

router.post('/', create_invoice);
router.put('/:id', update_invoice);

export const invoiceRoutes = router;


