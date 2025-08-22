import { Router } from "express";
import { companyController } from "../controllers";

const router = Router();

router.post('/add', companyController.add_company);
router.post('/edit', companyController.edit_company_by_id);
router.delete('/:id', companyController.delete_company_by_id);
router.get('/all', companyController.get_all_company);
router.get('/:id', companyController.get_company_by_id);

export const companyRoutes = router;