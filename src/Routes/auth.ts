import { Router } from 'express';
import { authController } from '../controllers';
import { adminJWT } from '../helper';

const router = Router();

router.post('/login', authController.login);

router.use(adminJWT)
router.post('/register', authController.register);
router.get('/profile', authController.getProfile);

export const authRoutes = router;   