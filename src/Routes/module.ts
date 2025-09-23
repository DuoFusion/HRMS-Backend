import { Router } from 'express';
import { ROLES } from "../common";
import { moduleController } from "../controllers";
import { VALIDATE_ROLE } from '../helper';

const router = Router()

router.post("/add", VALIDATE_ROLE([ROLES.ADMIN]), moduleController.add_module)
router.post("/edit", VALIDATE_ROLE([ROLES.ADMIN]), moduleController.edit_module_by_id)
router.delete("/:id", VALIDATE_ROLE([ROLES.ADMIN]), moduleController.delete_module_by_id)
router.get("/all", VALIDATE_ROLE([ROLES.ADMIN]), moduleController.get_all_module)
router.get("/:id", VALIDATE_ROLE([ROLES.ADMIN]), moduleController.get_by_id_module)
router.post("/bulk/edit", VALIDATE_ROLE([ROLES.ADMIN]), moduleController.bulk_edit_module)
router.get("/user/permissions", VALIDATE_ROLE([ROLES.ADMIN]), moduleController.get_users_permissions_by_moduleId)

export const moduleRoutes = router;
