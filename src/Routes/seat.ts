import { Router } from 'express';
import { seatController } from '../controllers';
import { VALIDATE_ROLE } from '../helper';
import { ROLES } from '../common';

const router = Router();

router.post('/add', VALIDATE_ROLE([ROLES.ADMIN, ROLES.HR]), seatController.add_seat);
router.post('/edit', VALIDATE_ROLE([ROLES.ADMIN, ROLES.HR]), seatController.edit_seat_by_id);
router.delete('/:id', VALIDATE_ROLE([ROLES.ADMIN, ROLES.HR]), seatController.delete_seat_by_id);
router.get('/all', VALIDATE_ROLE([ROLES.ADMIN, ROLES.HR]), seatController.get_all_seats);
router.get('/:id', VALIDATE_ROLE([ROLES.ADMIN, ROLES.HR, ROLES.PROJECT_MANAGER, ROLES.EMPLOYEE]), seatController.get_seat_by_id);

export const seatRoutes = router;