import Router from 'express'
import { holidayController } from '../controllers'
import { adminJWT, VALIDATE_ROLE } from '../helper'
import { ROLES } from '../common';

const router = Router();

router.use(adminJWT)
router.post('/add', VALIDATE_ROLE([ROLES.ADMIN]), holidayController.add_holiday)
router.post('/edit', VALIDATE_ROLE([ROLES.ADMIN]), holidayController.edit_holiday_by_id)
router.delete('/:id', VALIDATE_ROLE([ROLES.ADMIN]), holidayController.delete_holiday_by_id)
router.get('/all', VALIDATE_ROLE([ROLES.ADMIN]), holidayController.get_all_holiday)
router.get('/:id', VALIDATE_ROLE([ROLES.ADMIN]), holidayController.get_holiday_by_id)

export const holidayRoutes = router