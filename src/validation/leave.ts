import joi from "joi";
import { LEAVE_DAY_TYPE, LEAVE_STATUS, LEAVE_TYPE } from "../common";

export const addLeaveSchema = joi.object().keys({
    userId: joi.string().optional(),
    startDate: joi.date().required(),
    endDate: joi.date().required(),
    type: joi.string().valid(...Object.values(LEAVE_TYPE)).required(),
    reason: joi.string().required(),
    status: joi.string().valid(...Object.values(LEAVE_STATUS)).default(LEAVE_STATUS.PENDING),
dayType: { type: String, enum: Object.values(LEAVE_DAY_TYPE), default: LEAVE_DAY_TYPE.FULL }
});

export const updateLeaveSchema = joi.object().keys({
    userId: joi.string().required(),
    leaveId: joi.string().required(),
    startDate: joi.date().optional(),
    endDate: joi.date().optional(),
    type: joi.string().valid(...Object.values(LEAVE_TYPE)).optional(),
    reason: joi.string().optional(),
    status: joi.string().valid(...Object.values(LEAVE_STATUS)).optional(),
    approvedBy: joi.string().optional(),
    dayType: joi.string().valid(...Object.values(LEAVE_DAY_TYPE)).optional(),
});

export const deleteLeaveSchema = joi.object().keys({
    id: joi.string().required(),
});

export const getAllLeavesSchema = joi.object().keys({
    page: joi.number().integer().min(1).default(1),
    limit: joi.number().integer().min(1).default(10),
    statusFilter: joi.string().valid(...Object.values(LEAVE_STATUS)).optional(),
    typeFilter: joi.string().valid(...Object.values(LEAVE_TYPE)).optional(),
    search: joi.string().optional()
});

export const getLeaveByIdSchema = joi.object({
    id: joi.string().required()
});