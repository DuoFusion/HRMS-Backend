import Joi from "joi";

export const addRoleSchema = Joi.object().keys({
    name: Joi.string().required(),
});

export const editRoleSchema = Joi.object().keys({
    roleId: Joi.string().required(),
    name: Joi.string().optional(),
    isBlocked: Joi.boolean().optional(),
});

export const deleteRoleSchema = Joi.object().keys({
    id: Joi.string().required(),
});

export const getRoleSchema = Joi.object().keys({
    id: Joi.string().required(),
});

export const getAllRoleSchema = Joi.object().keys({
    page: Joi.number().integer().optional(),
    limit: Joi.number().integer().optional(),
    search: Joi.string().optional(),
    activeFilter: Joi.boolean().optional()
});