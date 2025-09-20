import Joi from 'joi'

export const grantUserModuleAccessSchema = Joi.object({
    userId: Joi.string().required(),
    moduleId: Joi.string().required(),
    view: Joi.boolean().default(false),
    add: Joi.boolean().default(false),
    edit: Joi.boolean().default(false),
    delete: Joi.boolean().default(false),
    isActive: Joi.boolean().default(true),
    expiresAt: Joi.date().allow(null).optional(),
    reason: Joi.string().allow(null, '').optional()
})

export const updateUserModuleAccessSchema = Joi.object({
    accessId: Joi.string().required(),
    view: Joi.boolean().optional(),
    add: Joi.boolean().optional(),
    edit: Joi.boolean().optional(),
    delete: Joi.boolean().optional(),
    isActive: Joi.boolean().optional(),
    expiresAt: Joi.date().allow(null).optional(),
    reason: Joi.string().allow(null, '').optional()
})

export const getUserModuleAccessSchema = Joi.object({
    userId: Joi.string().required(),
    page: Joi.number().min(1).default(1),
    limit: Joi.number().min(1).max(100).default(10),
    search: Joi.string().allow('').optional(),
    activeFilter: Joi.boolean().optional()
})

export const revokeUserModuleAccessSchema = Joi.object({
    accessId: Joi.string().required(),
    reason: Joi.string().allow(null, '').optional()
})

export const bulkGrantUserModuleAccessSchema = Joi.object({
    userId: Joi.string().required(),
    modules: Joi.array().items(Joi.object({
        moduleId: Joi.string().required(),
        view: Joi.boolean().default(false),
        add: Joi.boolean().default(false),
        edit: Joi.boolean().default(false),
        delete: Joi.boolean().default(false),
        isActive: Joi.boolean().default(true),
        expiresAt: Joi.date().allow(null).optional(),
        reason: Joi.string().allow(null, '').optional()
    })).min(1).required()
})
