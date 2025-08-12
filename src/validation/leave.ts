import joi from "joi";
import { DAY_TYPE, LEAVE_STATUS, LEAVE_TYPE } from "../common";

export const addLeaveSchema = joi.object().keys({
    userId: joi.string().required(),
    startDate: joi.date().required(),
    endDate: joi.date().required(),
    type: joi.string().valid(...Object.values(LEAVE_TYPE)).required(),
    reason: joi.string().required(),
    dayType: joi.string().valid(...Object.values(DAY_TYPE)).default("full"),
});

export const updateLeaveSchema = joi.object().keys({
    userId: joi.string().required(),
    startDate: joi.date().optional(),
    endDate: joi.date().optional(),
    type: joi.string().valid(...Object.values(LEAVE_TYPE)).optional(),
    reason: joi.string().optional(),
    status: joi.string().valid(...Object.values(LEAVE_STATUS)).optional(),
    approvedBy: joi.string().optional(),
    dayType: joi.string().valid(...Object.values(DAY_TYPE)).optional(),
});

export const deleteLeaveSchema = joi.object().keys({
    leaveId: joi.string().required(),
});