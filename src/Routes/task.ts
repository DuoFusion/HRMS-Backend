import Router from 'express';
import { taskController } from '../controllers';
import { adminJWT } from '../helper';

const router = Router();

router.use(adminJWT);
router.post('/add', taskController.AddTask);
router.get('/get', taskController.getAllTask)
router.post('/update', taskController.updateTask)
router.delete('/:id', taskController.DeleteTask)
router.get('/:id', taskController.getTaskById)

export const taskRoutes = router