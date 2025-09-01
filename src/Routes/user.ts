import { Router } from 'express';
import { userController } from '../controllers';
import { VALIDATE_ROLE } from '../helper';
import { ROLES } from '../common';

const router = Router();

router.post('/add', VALIDATE_ROLE([ROLES.ADMIN]), userController.add_user)
router.post('/edit', VALIDATE_ROLE([ROLES.ADMIN, ROLES.HR, ROLES.PROJECT_MANAGER, ROLES.EMPLOYEE]), userController.edit_user_by_id);
router.delete('/:id', VALIDATE_ROLE([ROLES.ADMIN]), userController.delete_user_by_id);
router.get('/all', VALIDATE_ROLE([ROLES.ADMIN]), userController.get_all_users);
router.get('/:id', VALIDATE_ROLE([ROLES.ADMIN, ROLES.HR, ROLES.PROJECT_MANAGER, ROLES.EMPLOYEE]), userController.get_user_by_id);

export const userRoutes = router;