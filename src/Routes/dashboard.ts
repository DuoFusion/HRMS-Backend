import { Router } from "express";
import { dashboardController } from "../controllers";
import { adminJWT } from "../helper";

const router = Router();

router.use(adminJWT);
router.post('/get', dashboardController.get_dashboard);

export const boardRoutes = router;