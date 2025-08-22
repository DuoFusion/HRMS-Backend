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

const router = Router()

router.use('/auth', authRoutes)
router.use('/users', userRoutes)
router.use('/role', roleRoutes)
router.use('/module', moduleRoutes)
router.use('/permission', permissionRoutes)
router.use('/upload', uploadRoutes)
router.use('/company', companyRoutes)
router.use('/leave', leaveRoutes)
router.use('/task', taskRoutes)
router.use('/holiday', holidayRoutes)
router.use('/dashboard', boardRoutes)

export { router }