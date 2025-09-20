import { Router } from 'express';
import { userController } from '../controllers';
import { VALIDATE_MODULE_ACCESS, VALIDATE_ROLE } from '../helper';
import { ROLES } from '../common';

const router = Router();

router.post('/add', VALIDATE_ROLE([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR]), VALIDATE_MODULE_ACCESS('add'), userController.add_user)
router.post('/edit', VALIDATE_ROLE([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR, ROLES.PROJECT_MANAGER, ROLES.EMPLOYEE]), VALIDATE_MODULE_ACCESS('edit'), userController.edit_user_by_id);
router.delete('/:id', VALIDATE_ROLE([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR]), VALIDATE_MODULE_ACCESS('delete'), userController.delete_user_by_id);
router.get('/all', VALIDATE_ROLE([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR]), VALIDATE_MODULE_ACCESS('view'), userController.get_all_users);
router.get('/', VALIDATE_ROLE([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR, ROLES.PROJECT_MANAGER, ROLES.EMPLOYEE]), userController.get_all_user_list);
router.get('/:id', VALIDATE_ROLE([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR, ROLES.PROJECT_MANAGER, ROLES.EMPLOYEE]), userController.get_user_by_id);

export const userRoutes = router;