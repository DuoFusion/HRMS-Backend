"use strict"
import { Router } from 'express'
import { authRoutes } from './auth'
import { userRoutes } from './user'
import { roleRoutes } from './role'
import { moduleRoutes } from './module'
import { permissionRoutes } from './permission'
import { uploadRoutes } from './upload'
import { companyRoutes } from './company'
import { leaveRoutes } from './leave'
import { taskRoutes } from './task'
import { holidayRoutes } from './holiday'
import { boardRoutes } from './dashboard'
import { attendanceRoutes } from './attendance'
import { adminJWT } from '../helper'
import { invoiceRoutes } from './invoice'
import { reviewRoutes } from './review'
import { projectRoutes } from './project'
const router = Router()

router.use('/auth', authRoutes)

router.use(adminJWT)
router.use('/users', userRoutes)
router.use('/role', roleRoutes)
router.use('/module', moduleRoutes)
router.use('/permission', permissionRoutes)
router.use('/upload', uploadRoutes)
router.use('/leave', leaveRoutes)
router.use('/project', projectRoutes)
router.use('/task', taskRoutes)
router.use('/holiday', holidayRoutes)
router.use('/dashboard', boardRoutes)
router.use('/company', companyRoutes)
router.use('/attendance', attendanceRoutes)
router.use('/invoice', invoiceRoutes)
router.use('/review', reviewRoutes)

export { router }