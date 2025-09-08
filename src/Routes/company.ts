import { Router } from "express";
import { companyController } from "../controllers";
import { VALIDATE_ROLE } from "../helper";
import { ROLES } from "../common";

const router = Router();

router.post('/add', VALIDATE_ROLE([ROLES.SUPER_ADMIN]), companyController.add_company);
router.post('/edit', VALIDATE_ROLE([ROLES.SUPER_ADMIN]), companyController.edit_company_by_id);
router.delete('/:id', VALIDATE_ROLE([ROLES.SUPER_ADMIN]), companyController.delete_company_by_id);
router.get('/all', VALIDATE_ROLE([ROLES.SUPER_ADMIN]), companyController.get_all_company);
router.get('/:id', VALIDATE_ROLE([ROLES.SUPER_ADMIN]), companyController.get_company_by_id);

export const companyRoutes = router;