import joi from 'joi';
import { TASK_STATUS, TASK_TYPE } from '../common';

export const addTaskSchema = joi.object().keys({
    title: joi.string().required(),
    userId: joi.string().required(),
    description: joi.string(),
    status: joi.string().valid(...Object.values(TASK_STATUS)).optional(),
    startDate: joi.string(),
    endDate: joi.string(),
    timer: joi.object({
        isRunning: joi.boolean(),
        startTime: joi.string(),
        totalTime: joi.number(),
    }),
    remarks: joi.array().items(
        joi.object({
            text: joi.string().required(),
            type: joi.string().valid(...Object.values(TASK_TYPE)).required()
        })
    ).optional()
})

export const updateTaskSchema = joi.object().keys({
    taskId: joi.string().required(),
    title: joi.string(),
    description: joi.string(),
    status: joi.string().valid(...Object.values(TASK_STATUS)),
    startDate: joi.string(),
    endDate: joi.string(),
    timer: joi.object({
        isRunning: joi.boolean(),
        startTime: joi.string(),
        totalTime: joi.number(),
    }),
    remarks: joi.array().items(
        joi.object({
            text: joi.string().required(),
            type: joi.string().valid(...Object.values(TASK_TYPE)).required()
        })
    ).optional()
});


export const deleteTaskSchema = joi.object().keys({
    id: joi.string().required(),
})

export const getAllTasksSchema = joi.object().keys({
    status: joi.string().valid(...Object.values(TASK_STATUS)).optional(),
    startDate: joi.string(),
    endDate: joi.string(),
    search: joi.string().optional(),
    page: joi.number().integer().min(1).optional(),
    limit: joi.number().integer().min(1).optional(),
    timer: joi.object({
        isRunning: joi.boolean(),
        startTime: joi.string(),
        totalTime: joi.number(),
    }),
    remarks: joi.array().items(
        joi.object({
            text: joi.string().required(),
            type: joi.string().valid(...Object.values(TASK_TYPE)).required()
        })
    ).optional()
})

export const getTaskByIdSchema = joi.object().keys({
    id: joi.string().required(),
})