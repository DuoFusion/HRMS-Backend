import { Router } from 'express';
import { userModuleAccessController } from '../controllers';
import { VALIDATE_ROLE } from '../helper/middleware';
import { ROLES } from '../common';

const router = Router();

router.post('/add', VALIDATE_ROLE([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR]), userModuleAccessController.add_user_module_access);
router.post('/update', VALIDATE_ROLE([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR]), userModuleAccessController.edit_user_module_access);
router.post('/bulk-grant', VALIDATE_ROLE([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR]), userModuleAccessController.bulk_grant_user_module_access);
router.delete('/revoke', VALIDATE_ROLE([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR]), userModuleAccessController.revoke_user_module_access);
router.get('/user/:userId', VALIDATE_ROLE([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR, ROLES.PROJECT_MANAGER]), userModuleAccessController.get_user_module_access);
router.get('/effective-permissions/:userId', VALIDATE_ROLE([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR, ROLES.PROJECT_MANAGER]), userModuleAccessController.get_user_effective_permissions);
router.get('/summary', VALIDATE_ROLE([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR]), userModuleAccessController.get_users_module_access_summary);

export const userModuleAccessRoutes = router;
