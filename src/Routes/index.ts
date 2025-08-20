"use strict"
import { Router } from 'express'
import { authRoutes } from './auth'
import { userRoutes } from './user'
import { roleRoutes } from './role'
import { moduleRoutes } from './module'
import { permissionRoutes } from './permission'
import { uploadRoutes } from './upload'
import { companyController } from '../controllers'
import { companyRoutes } from './company'
import { leaveRoutes } from './leave'
import { taskRoutes } from './task'

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

export { router }