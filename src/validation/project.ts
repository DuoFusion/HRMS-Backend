import joi from 'joi';
import { PROJECT_STATUS } from '../common';

export const addProjectSchema = joi.object().keys({
    name: joi.string().required(),
    description: joi.string().optional(),
    userIds: joi.array().items(joi.string()).optional(),
    status: joi.string().valid(...Object.values(PROJECT_STATUS)).optional(),
    startDate: joi.string().optional(),
    endDate: joi.string().optional(),
    remarks: joi.array().items(
        joi.object({
            text: joi.string().required(),
            type: joi.string().valid('break', 'lunch', 'meeting').required()
        })
    ).optional()
});

export const updateProjectSchema = joi.object().keys({
    projectId: joi.string().required(),
    name: joi.string().optional(),
    description: joi.string().optional(),
    userIds: joi.array().items(joi.string()).optional(),
    status: joi.string().valid(...Object.values(PROJECT_STATUS)).optional(),
    startDate: joi.string().optional(),
    endDate: joi.string().optional(),
    remarks: joi.array().items(
        joi.object({
            text: joi.string().required(),
            type: joi.string().valid('break', 'lunch', 'meeting').required()
        })
    ).optional(),
    isBlocked: joi.boolean().optional(),
});

export const deleteProjectSchema = joi.object().keys({
    id: joi.string().required(),
});

export const getAllProjectsSchema = joi.object({
    page: joi.number().integer().optional(),
    limit: joi.number().integer().optional(),
    statusFilter: joi.string().valid(...Object.values(PROJECT_STATUS)).optional(),
    activeFilter: joi.boolean().optional(),
    userFilter: joi.string().optional(),
    startDate: joi.date().optional(),
    endDate: joi.date().optional(),
    search: joi.string().optional(),
});

export const getProjectByIdSchema = joi.object().keys({
    id: joi.string().required(),
});

