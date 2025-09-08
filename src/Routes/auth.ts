import { Router } from 'express';
import { authController } from '../controllers';
import { adminJWT, VALIDATE_ROLE } from '../helper';
import { ROLES } from '../common';

const router = Router();

router.post('/login', authController.login);

router.use(adminJWT)
router.post('/register', authController.register);
router.get('/profile', authController.get_profile);
router.post('/reset/password', authController.reset_password)
router.post('/resend-otp', VALIDATE_ROLE([ROLES.SUPER_ADMIN, ROLES.ADMIN]), authController.resend_otp);

export const authRoutes = router