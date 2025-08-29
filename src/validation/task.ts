import joi from 'joi';
import { TASK_STATUS, TASK_TYPE } from '../common';

export const addTaskSchema = joi.object().keys({
    title: joi.string().required(),
    userId: joi.string().optional(),
    description: joi.string(),
    status: joi.string().valid(...Object.values(TASK_STATUS)).optional(),
    boardColumn: joi.string().valid('to_do','pending','inprogress','completed').optional(),
    priority: joi.string().valid('low','medium','high').optional(),
    client: joi.string().allow('', null),
    labels: joi.array().items(joi.string()).optional(),
    startDate: joi.date().optional(),
    dueDate: joi.date().optional(),
    endDate: joi.date().optional(),
    projectId: joi.string().optional(),
    progressPercent: joi.number().min(0).max(100).optional(),
    userIds: joi.array().items(joi.string()).optional(),
    commentsCount: joi.number().min(0).optional(),
    attachmentsCount: joi.number().min(0).optional(),
    timer: joi.object({
        isRunning: joi.boolean(),
        startTime: joi.string(),
        totalTime: joi.number(),
    }).optional(),
    remarks: joi.array().items(
        joi.object({
            text: joi.string().required(),
            type: joi.string().valid(...Object.values(TASK_TYPE)).required()
        })).optional(),
    comment: joi.string().optional()
})

export const updateTaskSchema = joi.object().keys({
    taskId: joi.string().required(),
    title: joi.string(),
    userId: joi.string().optional(),
    description: joi.string().allow('', null),
    status: joi.string().valid(...Object.values(TASK_STATUS)),
    boardColumn: joi.string().valid('to_do','pending','inprogress','completed'),
    priority: joi.string().valid('low','medium','high'),
    client: joi.string().allow('', null),
    labels: joi.array().items(joi.string()),
    startDate: joi.date(),
    dueDate: joi.date(),
    endDate: joi.date(),
    projectId: joi.string().optional(),
    progressPercent: joi.number().min(0).max(100),
    userIds: joi.array().items(joi.string()),
    commentsCount: joi.number().min(0),
    attachmentsCount: joi.number().min(0),
    timer: joi.object({
        isRunning: joi.boolean(),
        startTime: joi.string(),
        totalTime: joi.number(),
    }).optional(),
    remarks: joi.array().items(
        joi.object({
            text: joi.string().required(),
            type: joi.string().valid(...Object.values(TASK_TYPE)).required()
        })
    ).optional(),
    comment: joi.string().optional()
});


export const deleteTaskSchema = joi.object().keys({
    id: joi.string().required(),
})

export const getAllTasksSchema = joi.object({
    status: joi.string().valid(...Object.values(TASK_STATUS)).optional(),
    activeFilter: joi.boolean().optional(),
    boardColumn: joi.string().valid('to_do','pending','inprogress','completed').optional(),
    priority: joi.string().valid('low','medium','high').optional(),
    client: joi.string().optional(),
assignee: joi.string().optional(),
    startDate: joi.date().optional(),
    endDate: joi.date().optional(),
    search: joi.string().optional(),
    page: joi.number().integer().optional(),
    limit: joi.number().integer().optional()
})


export const getTaskByIdSchema = joi.object().keys({
    id: joi.string().required(),
})