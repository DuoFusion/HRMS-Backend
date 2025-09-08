import { reviewController } from "../controllers";
import { Router } from "express";
import { adminJWT, VALIDATE_ROLE } from "../helper";
import { ROLES } from "../common";

const router = Router();

router.use(adminJWT)
router.post("/add", VALIDATE_ROLE([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR, ROLES.PROJECT_MANAGER, ROLES.EMPLOYEE]), reviewController.add_review)
router.post("/edit", VALIDATE_ROLE([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR, ROLES.PROJECT_MANAGER, ROLES.EMPLOYEE]), reviewController.edit_review_by_id)
router.delete("/:id", VALIDATE_ROLE([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR, ROLES.PROJECT_MANAGER, ROLES.EMPLOYEE]), reviewController.delete_review_by_id)
router.get("/all", VALIDATE_ROLE([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR, ROLES.PROJECT_MANAGER, ROLES.EMPLOYEE]), reviewController.get_all_reviews)
router.get("/:id", VALIDATE_ROLE([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR, ROLES.PROJECT_MANAGER, ROLES.EMPLOYEE]), reviewController.get_review_by_id)

export const reviewRoutes = router