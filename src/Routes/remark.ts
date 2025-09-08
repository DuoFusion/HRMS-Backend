import { Router } from "express";
import { remarkController } from "../controllers";
import { VALIDATE_ROLE } from "../helper";
import { ROLES } from "../common";

const router = Router();

router.post("/add", VALIDATE_ROLE([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR, ROLES.PROJECT_MANAGER, ROLES.EMPLOYEE]), remarkController.add_remark);
router.post('/edit', VALIDATE_ROLE([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR, ROLES.PROJECT_MANAGER, ROLES.EMPLOYEE]), remarkController.update_remark);
router.delete('/:id', VALIDATE_ROLE([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR, ROLES.PROJECT_MANAGER, ROLES.EMPLOYEE]), remarkController.delete_remark_by_id);
router.get('/all', VALIDATE_ROLE([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR, ROLES.PROJECT_MANAGER, ROLES.EMPLOYEE]), remarkController.get_all_remarks);
router.get('/:id', VALIDATE_ROLE([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR, ROLES.PROJECT_MANAGER, ROLES.EMPLOYEE]), remarkController.get_remark_by_id);

export const remarkRoutes = router;