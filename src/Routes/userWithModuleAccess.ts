import { Router } from 'express';
import { userController } from '../controllers';
import { VALIDATE_ROLE, VALIDATE_MODULE_ACCESS, GET_USER_ACCESSIBLE_MODULES } from '../helper';
import { ROLES } from '../common';

const router = Router();

router.get('/my-modules', VALIDATE_ROLE([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR, ROLES.PROJECT_MANAGER, ROLES.EMPLOYEE]), GET_USER_ACCESSIBLE_MODULES,
    (req: any, res) => {
        res.json({
            success: true,
            message: 'User accessible modules retrieved',
            modules: req.accessibleModules
        });
    }
);

router.post('/add', VALIDATE_ROLE([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR, ROLES.PROJECT_MANAGER, ROLES.EMPLOYEE]), VALIDATE_MODULE_ACCESS('edit'), userController.edit_user_by_id);
router.post('/edit', VALIDATE_ROLE([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR, ROLES.PROJECT_MANAGER, ROLES.EMPLOYEE]), VALIDATE_MODULE_ACCESS('edit'), userController.edit_user_by_id);
router.delete('/:id', VALIDATE_ROLE([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR]), VALIDATE_MODULE_ACCESS('delete'), userController.delete_user_by_id);
router.get('/all', VALIDATE_ROLE([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR]), VALIDATE_MODULE_ACCESS('view'), userController.get_all_users);
router.get('/', VALIDATE_ROLE([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR, ROLES.PROJECT_MANAGER, ROLES.EMPLOYEE]), VALIDATE_MODULE_ACCESS('view'), userController.get_all_user_list);
router.get('/:id', VALIDATE_ROLE([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR, ROLES.PROJECT_MANAGER, ROLES.EMPLOYEE]), VALIDATE_MODULE_ACCESS('view'), userController.get_user_by_id);

export const userRoutes = router;
