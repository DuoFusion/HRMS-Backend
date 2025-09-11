import { Router } from 'express';
import { authController } from '../controllers';
import { adminJWT, VALIDATE_ROLE } from '../helper';
import { ROLES } from '../common';

const router = Router();

router.post('/login', authController.login);

router.use(adminJWT)
router.post('/register', authController.register);
router.get('/profile', authController.get_profile);
router.post('/otp-verification', authController.otp_verification)
router.post('/forgot', authController.forgot_password)
router.post('/resend-otp', authController.resend_otp);
router.post('/reset/password', authController.reset_password);

export const authRoutes = router