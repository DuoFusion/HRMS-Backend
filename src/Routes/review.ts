import { reviewController } from "../controllers";
import { Router } from "express";
import { adminJWT } from "../helper";

const router = Router();

router.use(adminJWT)
router.post("/add", reviewController.add_review)
router.post("/edit", reviewController.edit_review_by_id)
router.delete("/:id", reviewController.delete_review_by_id)
router.get("/all", reviewController.get_all_reviews)
router.get("/:id", reviewController.get_review_by_id)


export const reviewRoutes = router