import Router from 'express';
import { taskController } from '../controllers';
import { VALIDATE_ROLE } from '../helper';
import { ROLES } from '../common';

const router = Router()

router.post('/add', VALIDATE_ROLE([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR, ROLES.PROJECT_MANAGER, ROLES.EMPLOYEE]), taskController.add_task);
router.post('/edit', VALIDATE_ROLE([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR, ROLES.PROJECT_MANAGER, ROLES.EMPLOYEE]), taskController.edit_task_by_id)
router.delete('/:id', VALIDATE_ROLE([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR, ROLES.PROJECT_MANAGER, ROLES.EMPLOYEE]), taskController.delete_task_by_id)
router.get('/all', VALIDATE_ROLE([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR, ROLES.PROJECT_MANAGER, ROLES.EMPLOYEE]), taskController.get_all_task)
router.get('/:id', VALIDATE_ROLE([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR, ROLES.PROJECT_MANAGER, ROLES.EMPLOYEE]), taskController.get_task_by_id)

export const taskRoutes = router