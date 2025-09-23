import { adminJWT, VALIDATE_ROLE } from "../helper"
import { Router } from 'express';
import { ROLES } from "../common";
import { permissionController } from "../controllers";

const router = Router();

router.use(adminJWT)
router.post("/edit", VALIDATE_ROLE([ROLES.ADMIN]), permissionController.edit_permission_by_id)
router.post("/details", VALIDATE_ROLE([ROLES.ADMIN, ROLES.EMPLOYEE]), permissionController.get_permission_by_userId)

export const permissionRoutes = router