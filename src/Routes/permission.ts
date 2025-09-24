import { adminJWT, VALIDATE_ROLE } from "../helper"
import { Router } from 'express';
import { ROLES } from "../common";
import { permissionController } from "../controllers";

const router = Router();

router.use(adminJWT)
router.post("/edit", VALIDATE_ROLE([ROLES.SUPER_ADMIN, ROLES.ADMIN]), permissionController.edit_permission_by_id)
router.get("/details", VALIDATE_ROLE([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR, ROLES.PROJECT_MANAGER, ROLES.EMPLOYEE]), permissionController.get_permission_by_userId)

export const permissionRoutes = router