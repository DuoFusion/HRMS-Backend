import { Router } from 'express';
import { requireHR } from '../middleware/roleMiddleware';
import { userController } from '../controllers';
import { adminJWT, VALIDATE_ROLE } from '../helper';
import { ROLES } from '../common';

const router = Router();

router.use(adminJWT);

router.get('/', userController.getAllUsers);
router.delete('/:id', userController.deleteUser);
router.patch('/:id/role', userController.updateUserRole);

router.patch('/:id/status', requireHR, userController.updateUserStatus);

router.get('/:id', VALIDATE_ROLE([ROLES.ADMIN]), userController.getUserById);
router.put('/:id', VALIDATE_ROLE([ROLES.ADMIN]), userController.updateUser);
router.patch('/:id', VALIDATE_ROLE([ROLES.ADMIN]), userController.updateUser);

export const userRoutes = router;