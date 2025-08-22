import Router from 'express';
import { taskController } from '../controllers';
import { adminJWT } from '../helper';

const router = Router();
router.get('/', taskController.get_all_task)
router.get('/:taskId', taskController.get_task_by_id)

router.use(adminJWT);   
router.post('/add', taskController.add_task);
router.post('/edit', taskController.edit_task_by_id)
router.delete('/delete/:taskId', taskController.delete_task_by_id)

export const taskRoutes = router