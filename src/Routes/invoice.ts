import { Router } from 'express';
import { create_invoice, update_invoice } from '../controllers/invoice';

const invoiceRoutes = Router();

invoiceRoutes.post('/', create_invoice);
invoiceRoutes.put('/:id', update_invoice);

export { invoiceRoutes };


