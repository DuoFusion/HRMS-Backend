"use strict"
import { Router } from 'express'
import { authRoutes } from './auth'
import { userRoutes } from './user'
import { roleRoutes } from './role'
import { moduleRoutes } from './module'
import { uploadRoutes } from './upload'

const router = Router()

router.use('/auth', authRoutes)
router.use('/users', userRoutes)
router.use('/role', roleRoutes)
router.use('/module', moduleRoutes)
router.use('/upload', uploadRoutes)

export { router }