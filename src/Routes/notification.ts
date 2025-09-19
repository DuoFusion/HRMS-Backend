import { Router } from 'express'
import { notificationController } from '../controllers'

const router = Router()

router.get('/all', notificationController.get_all_notifications)
router.post('/read/:id', notificationController.mark_notification_read)
router.post('/unread/:id', notificationController.mark_notification_unread)
router.post('/mark-all/read', notificationController.mark_all_read)

export { router as notificationRoutes }


