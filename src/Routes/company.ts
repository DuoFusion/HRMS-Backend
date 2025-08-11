import { Router } from "express";
import { companyController } from "../controllers";
import { adminJWT } from "../helper";
import { ROLES } from "../common";

const router = Router();

router.use(adminJWT);

router.post('/add', companyController.AddUser);
router.get('/get', companyController.GetAllUser);
router.get('/:id', companyController.GetUserById);
router.post('/edit', companyController.updateUser);


export const companyRoutes = router;