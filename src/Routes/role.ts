import { Router } from 'express';
import { roleController } from '../controllers';
import { VALIDATE_ROLE } from '../helper';
import { ROLES } from '../common';

const router = Router();

router.post('/add', VALIDATE_ROLE([ROLES.SUPER_ADMIN]), roleController.add_role);
router.post('/edit', VALIDATE_ROLE([ROLES.SUPER_ADMIN]), roleController.edit_role_by_id);
router.delete('/:id', VALIDATE_ROLE([ROLES.SUPER_ADMIN]), roleController.delete_role_by_id);
router.get('/all', VALIDATE_ROLE([ROLES.SUPER_ADMIN]), roleController.get_all_role);
router.get('/:id', VALIDATE_ROLE([ROLES.SUPER_ADMIN]), roleController.get_role_by_id);

export const roleRoutes = router;