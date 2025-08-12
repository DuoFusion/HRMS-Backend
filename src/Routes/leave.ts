import { Router } from "express";
import { leaveController } from "../controllers";
import { adminJWT, VALIDATE_ROLE } from "../helper";
import { ROLES } from "../common";

const router = Router();

router.use(adminJWT);
router.post("/add", leaveController.add_Leave);

export const leaveRoutes = router;