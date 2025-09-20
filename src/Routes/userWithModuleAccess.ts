import { Router } from 'express';
import { userController } from '../controllers';
import { VALIDATE_ROLE, VALIDATE_MODULE_ACCESS, GET_USER_ACCESSIBLE_MODULES } from '../helper';
import { ROLES } from '../common';

const router = Router();

// Example routes showing different ways to use module access middleware

// 1. Basic role-based access (existing approach)
router.post('/add', VALIDATE_ROLE([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR]), userController.add_user)

// 2. Module-specific access validation
// This ensures user has 'add' permission for 'user' module
router.post('/add-with-module-check', 
    VALIDATE_ROLE([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR]),
    VALIDATE_MODULE_ACCESS('add'),
    userController.add_user
);

// 3. Get user's accessible modules
router.get('/my-modules', 
    VALIDATE_ROLE([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR, ROLES.PROJECT_MANAGER, ROLES.EMPLOYEE]),
    GET_USER_ACCESSIBLE_MODULES,
    (req: any, res) => {
        res.json({
            success: true,
            message: 'User accessible modules retrieved',
            modules: req.accessibleModules
        });
    }
);

// 4. Edit user with module access check
router.post('/edit', 
    VALIDATE_ROLE([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR, ROLES.PROJECT_MANAGER, ROLES.EMPLOYEE]),
    VALIDATE_MODULE_ACCESS('edit'),
    userController.edit_user_by_id
);

// 5. Delete user with module access check
router.delete('/:id', 
    VALIDATE_ROLE([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR]),
    VALIDATE_MODULE_ACCESS('delete'),
    userController.delete_user_by_id
);

// 6. Get all users with view permission check
router.get('/all', 
    VALIDATE_ROLE([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR]),
    VALIDATE_MODULE_ACCESS('view'),
    userController.get_all_users
);

// 7. Get user list with view permission check
router.get('/', 
    VALIDATE_ROLE([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR, ROLES.PROJECT_MANAGER, ROLES.EMPLOYEE]),
    VALIDATE_MODULE_ACCESS('view'),
    userController.get_all_user_list
);

// 8. Get user by ID with view permission check
router.get('/:id', 
    VALIDATE_ROLE([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR, ROLES.PROJECT_MANAGER, ROLES.EMPLOYEE]),
    VALIDATE_MODULE_ACCESS('view'),
    userController.get_user_by_id
);

export const userRoutes = router;
