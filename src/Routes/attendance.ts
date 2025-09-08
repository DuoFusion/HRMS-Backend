import { Router } from 'express';
import { attendanceController } from '../controllers';
import { VALIDATE_ROLE } from '../helper/middleware';
import { ROLES } from '../common';

const router = Router();

router.post('/check-in', VALIDATE_ROLE([ROLES.SUPER_ADMIN, ROLES.HR, ROLES.PROJECT_MANAGER, ROLES.EMPLOYEE]), attendanceController.punch_in);
router.post('/check-out', VALIDATE_ROLE([ROLES.SUPER_ADMIN, ROLES.HR, ROLES.PROJECT_MANAGER, ROLES.EMPLOYEE]), attendanceController.punch_out);
router.post('/break-in', VALIDATE_ROLE([ROLES.SUPER_ADMIN, ROLES.HR, ROLES.PROJECT_MANAGER, ROLES.EMPLOYEE]), attendanceController.break_in);
router.post('/break-out', VALIDATE_ROLE([ROLES.SUPER_ADMIN, ROLES.HR, ROLES.PROJECT_MANAGER, ROLES.EMPLOYEE]), attendanceController.break_out);
router.post('/manual-punch-out', VALIDATE_ROLE([ROLES.HR, ROLES.PROJECT_MANAGER, ROLES.EMPLOYEE]), attendanceController.manual_punch_out);
router.get('/today', VALIDATE_ROLE([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR, ROLES.PROJECT_MANAGER, ROLES.EMPLOYEE]), attendanceController.get_today_attendance);
router.get('/summary', VALIDATE_ROLE([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR, ROLES.PROJECT_MANAGER, ROLES.EMPLOYEE]), attendanceController.get_attendance_summary);
router.get('/all', VALIDATE_ROLE([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR, ROLES.PROJECT_MANAGER, ROLES.EMPLOYEE]), attendanceController.get_all_attendance);
router.get('/:id', VALIDATE_ROLE([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR]), attendanceController.getAttendanceById);

export const attendanceRoutes = router
