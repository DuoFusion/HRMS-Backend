import { VALIDATE_ROLE } from "../helper"
import { Router } from 'express';
import { ROLES } from "../common";
import { permissionController } from "../controllers";
import { adminJWT, VALIDATE_ROLE } from '../helper';

const router = Router();

router.post("/roledetails/edit", VALIDATE_ROLE([ADMIN_ROLES.ADMIN]), permissionController.edit_role_details_by_id)
// router.delete("/roledetails/:id",VALIDATE_ROLE([ADMIN_ROLES.ADMIN]),adminController.delete_role_details_by_id)
router.post("/role/details", VALIDATE_ROLE([ADMIN_ROLES.ADMIN]), permissionController.get_role_details_by_roleId)