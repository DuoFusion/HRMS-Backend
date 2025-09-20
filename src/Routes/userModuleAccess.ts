import { Router } from 'express';
import { userModuleAccessController } from '../controllers';
import { VALIDATE_ROLE } from '../helper/middleware';
import { ROLES } from '../common';

const router = Router();

// Grant module access to a specific user
router.post('/grant', VALIDATE_ROLE([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR]), userModuleAccessController.grant_user_module_access);

// Update user module access
router.put('/update', VALIDATE_ROLE([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR]), userModuleAccessController.update_user_module_access);

// Get all module access for a specific user
router.get('/user/:userId', VALIDATE_ROLE([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR, ROLES.PROJECT_MANAGER]), userModuleAccessController.get_user_module_access);

// Revoke user module access
router.delete('/revoke', VALIDATE_ROLE([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR]), userModuleAccessController.revoke_user_module_access);

// Bulk grant module access to a user
router.post('/bulk-grant', VALIDATE_ROLE([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR]), userModuleAccessController.bulk_grant_user_module_access);

// Get user's effective permissions (role + user-specific)
router.get('/effective-permissions/:userId', VALIDATE_ROLE([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR, ROLES.PROJECT_MANAGER]), userModuleAccessController.get_user_effective_permissions);

// Get all users with their module access summary
router.get('/summary', VALIDATE_ROLE([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR]), userModuleAccessController.get_users_module_access_summary);

export const userModuleAccessRoutes = router;
