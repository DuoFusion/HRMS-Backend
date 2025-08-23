import Router from 'express'
import { holidayController } from '../controllers'
import { adminJWT, updateData } from '../helper'

const router = Router();

router.use(adminJWT)
router.post('/add', holidayController.add_holiday)
router.post('/edit', holidayController.edit_holiday_by_id)
router.delete('/:id', holidayController.delete_holiday_by_id)
router.get('/all', holidayController.get_all_holiday)
router.get('/:id', holidayController.get_holiday_by_id)

export const holidayRoutes = router