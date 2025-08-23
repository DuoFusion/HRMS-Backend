import Joi from "joi";
import { HOLIDAY_TYPE } from "../common";

export const addHolidaySchema = Joi.object({
    title: Joi.string().required(),
    description: Joi.string().required(),
    date: Joi.date().iso().required(),
    type: Joi.string().valid(...Object.values(HOLIDAY_TYPE)).optional(),
    isRecurring: Joi.boolean().required(),
    createdBy: Joi.string().hex().length(24).optional(),
    updatedBy: Joi.string().hex().length(24).optional(),
    isDeleted: Joi.string().optional()
});

export const getHolidaySchema = Joi.object().keys({
    holidayId: Joi.string().required(),
});

export const updateHolidaySchema = Joi.object().keys({
    holidayId: Joi.string().required(),
    title: Joi.string().trim(),
    description: Joi.string().allow("", null),
    date: Joi.date(),
    type: Joi.string().valid(...Object.values(HOLIDAY_TYPE)).optional(),
    isRecurring: Joi.boolean(),
    updatedBy: Joi.string().optional(),
});

export const deleteHolidaySchema = Joi.object().keys({
    holidayId: Joi.string().required()
})

export const getAllHolidaySchema = Joi.object().keys({
    page: Joi.number().integer().optional(),
    limit: Joi.number().integer().optional(),
    search: Joi.string().optional(),
    activeFilter: Joi.boolean().optional()
})