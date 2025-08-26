import Router from 'express';
import { projectController } from '../controllers';
import { VALIDATE_ROLE } from '../helper';
import { ROLES } from '../common';

const router = Router()

router.post('/add', VALIDATE_ROLE([ROLES.ADMIN, ROLES.HR, ROLES.PROJECT_MANAGER]), projectController.add_project);
router.post('/edit', VALIDATE_ROLE([ROLES.ADMIN, ROLES.HR, ROLES.PROJECT_MANAGER]), projectController.edit_project_by_id)
router.delete('/:id', VALIDATE_ROLE([ROLES.ADMIN, ROLES.HR, ROLES.PROJECT_MANAGER]), projectController.delete_project_by_id)
router.get('/all', VALIDATE_ROLE([ROLES.ADMIN, ROLES.HR, ROLES.PROJECT_MANAGER, ROLES.EMPLOYEE]), projectController.get_all_project)
router.get('/:id', VALIDATE_ROLE([ROLES.ADMIN, ROLES.HR, ROLES.PROJECT_MANAGER, ROLES.EMPLOYEE]), projectController.get_project_by_id)

export const projectRoutes = router

