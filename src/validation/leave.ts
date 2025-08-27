import Joi from "joi";
import { LEAVE_DAY_TYPE, LEAVE_STATUS, LEAVE_TYPE } from "../common";

export const addLeaveSchema = Joi.object().keys({
    userId: Joi.string().optional(),
    startDate: Joi.date().required(),
    endDate: Joi.date().required(),
    type: Joi.string().valid(...Object.values(LEAVE_TYPE)).required(),
    reason: Joi.string().required(),
    count: Joi.number().required(),
    status: Joi.string().valid(...Object.values(LEAVE_STATUS)),
    dayType: Joi.string().valid(...Object.values(LEAVE_DAY_TYPE)).optional(),
});

export const updateLeaveSchema = Joi.object().keys({
    leaveId: Joi.string().required(),
    userId: Joi.string().optional(),
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional(),
    type: Joi.string().valid(...Object.values(LEAVE_TYPE)).optional(),
    reason: Joi.string().optional(),
    count: Joi.number().optional(),
    status: Joi.string().valid(...Object.values(LEAVE_STATUS)).optional(),
    approvedBy: Joi.string().optional(),
    dayType: Joi.string().valid(...Object.values(LEAVE_DAY_TYPE)).optional(),
    isBlocked: Joi.boolean().optional(),
});

export const deleteLeaveSchema = Joi.object().keys({
    id: Joi.string().required(),
});

export const getAllLeavesSchema = Joi.object().keys({
    page: Joi.number().integer().optional(),
    limit: Joi.number().integer().optional(),
    activeFilter: Joi.boolean().optional(),
    userFilter: Joi.string().optional(),
    typeFilter: Joi.string().valid(...Object.values(LEAVE_TYPE)).optional(),
    statusFilter: Joi.string().valid(...Object.values(LEAVE_STATUS)).optional(),
    startDateFilter: Joi.date().optional(),
    endDateFilter: Joi.date().optional(),
    search: Joi.string().optional()
});

export const getLeaveByIdSchema = Joi.object({
    id: Joi.string().required()
})