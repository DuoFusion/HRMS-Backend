import { Router } from "express";
import { leaveController } from "../controllers";
import { VALIDATE_ROLE } from "../helper";
import { ROLES } from "../common";

const router = Router();

router.post("/add", VALIDATE_ROLE([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR, ROLES.PROJECT_MANAGER, ROLES.EMPLOYEE]), leaveController.add_leave);
router.post('/edit', VALIDATE_ROLE([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR, ROLES.PROJECT_MANAGER, ROLES.EMPLOYEE]), leaveController.update_leave);
router.delete('/:id', VALIDATE_ROLE([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR, ROLES.PROJECT_MANAGER, ROLES.EMPLOYEE]), leaveController.delete_leave_by_id);
router.get('/all', VALIDATE_ROLE([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR, ROLES.PROJECT_MANAGER, ROLES.EMPLOYEE]), leaveController.get_all_leaves);
router.get('/:id', VALIDATE_ROLE([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR, ROLES.PROJECT_MANAGER, ROLES.EMPLOYEE]), leaveController.get_leave_by_id);

export const leaveRoutes = router;