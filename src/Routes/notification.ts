import { Router } from 'express'
import { list_notifications, mark_all_read, mark_notification_read, mark_notification_unread } from '../controllers/notification'

const router = Router()

router.get('/', list_notifications)
router.patch('/:id/read', mark_notification_read)
router.patch('/:id/unread', mark_notification_unread)
router.patch('/mark-all/read', mark_all_read)

export { router as notificationRoutes }


