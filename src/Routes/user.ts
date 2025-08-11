import { Router } from 'express';
import { requireHR } from '../middleware/roleMiddleware';
import { userController } from '../controllers';
import { adminJWT, VALIDATE_ROLE } from '../helper';
import { ROLES } from '../common';

const router = Router();

router.use(adminJWT);
router.post('/add', userController.AddUsers)
router.get('/get', userController.getAllUsers);
router.delete('/:id', userController.deleteUser);
router.patch('/:id/role', userController.updateUserRole);

router.patch('/:id/status', requireHR, userController.updateUserStatus);

router.get('/:id', VALIDATE_ROLE([ROLES.ADMIN]), userController.getUserById);
router.post('/edit', VALIDATE_ROLE([ROLES.ADMIN]), userController.updateUser);
router.patch('/:id', VALIDATE_ROLE([ROLES.ADMIN]), userController.deleteUser);

export const userRoutes = router;