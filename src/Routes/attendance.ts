import { Router } from 'express';
import { attendanceController } from '../controllers';
import { VALIDATE_ROLE } from '../helper/middleware';
import { ROLES } from '../common';

const router = Router();

// Employee routes (require authentication)
router.post('/check-in', VALIDATE_ROLE([ROLES.HR, ROLES.PROJECT_MANAGER, ROLES.EMPLOYEE]), attendanceController.punch_in);
router.post('/check-out', VALIDATE_ROLE([ROLES.HR, ROLES.PROJECT_MANAGER, ROLES.EMPLOYEE]), attendanceController.punch_out);
router.put('/break/:id', VALIDATE_ROLE([ROLES.HR, ROLES.PROJECT_MANAGER, ROLES.EMPLOYEE]), attendanceController.update_break);

router.get('/all', VALIDATE_ROLE([ROLES.ADMIN, ROLES.HR, ROLES.PROJECT_MANAGER, ROLES.EMPLOYEE]), attendanceController.get_all_attendance);
router.get('/:id', VALIDATE_ROLE([ROLES.ADMIN, ROLES.HR]), attendanceController.getAttendanceById);
router.put('/:id', VALIDATE_ROLE([ROLES.ADMIN, ROLES.HR]), attendanceController.updateAttendance);
router.delete('/:id', VALIDATE_ROLE([ROLES.ADMIN, ROLES.HR]), attendanceController.deleteAttendance);

export const attendanceRoutes = router
