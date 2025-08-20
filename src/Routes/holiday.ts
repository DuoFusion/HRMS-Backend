import Router from 'express'
import { holidayController } from '../controllers'
import { adminJWT, updateData } from '../helper'

const router = Router();

router.use(adminJWT)
router.post('/add', holidayController.add_holiday)
router.post('/update', holidayController.edit_holiday_by_id)

export const holidayRoutes = router
