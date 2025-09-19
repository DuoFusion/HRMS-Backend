import { Router } from 'express';
import { authController } from '../controllers';
import { adminJWT } from '../helper';

const router = Router();

router.post('/login', authController.login);
router.post('/forgot/password', authController.forgot_password)
router.post('/otp-verification', authController.otp_verification)
router.post('/resend-otp', authController.resend_otp);
router.post('/reset/password/admin', authController.reset_password_admin);

router.use(adminJWT)
router.post('/register', authController.register);
router.get('/profile', authController.get_profile);
router.post('/reset/password', authController.reset_password);

export const authRoutes = router