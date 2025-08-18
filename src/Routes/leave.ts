import { Router } from "express";
import { leaveController } from "../controllers";
import { adminJWT, VALIDATE_ROLE } from "../helper";
import { ROLES } from "../common";

const router = Router();

router.use(adminJWT);
router.post("/add", leaveController.add_Leave);
router.post('/edit', leaveController.update_Leave);
router.delete('/:id', leaveController.Delete_leave);
router.get('/allLeaves', leaveController.GetAllLeaves);
router.get('/:id', leaveController.GetLeaveById);

export const leaveRoutes = router;