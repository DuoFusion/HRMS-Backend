import Router from 'express'
import { holidayController } from '../controllers'
import { adminJWT, updateData } from '../helper'

const router = Router();

router.use(adminJWT)
router.post('/add', holidayController.addHoliday)
router.post('/update', holidayController.updateHoliday)

export const holidayRoutes = router
