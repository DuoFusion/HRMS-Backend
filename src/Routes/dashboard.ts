import { Router } from "express";
import { dashboardController } from "../controllers";
import { adminJWT, VALIDATE_ROLE } from "../helper";
import { ROLES } from "../common";

const router = Router();

router.use(adminJWT);
router.get('/', VALIDATE_ROLE([ROLES.ADMIN, ROLES.HR, ROLES.PROJECT_MANAGER, ROLES.EMPLOYEE]), dashboardController.get_dashboard);

export const boardRoutes = router;