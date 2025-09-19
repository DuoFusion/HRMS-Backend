import Joi from "joi";
import { HOLIDAY_TYPE } from "../common";

export const addHolidaySchema = Joi.object({
    userId : Joi.string().required(),
    companyId : Joi.string().required(),
    title: Joi.string().required(),
    description: Joi.string().required(),
    date: Joi.date().iso().required(),
    type: Joi.string().valid(...Object.values(HOLIDAY_TYPE)).optional(),
    isRecurring: Joi.boolean().required(),
});

export const getHolidaySchema = Joi.object().keys({
    id: Joi.string().required(),
});

export const updateHolidaySchema = Joi.object().keys({
    holidayId: Joi.string().required(),
    title: Joi.string().trim(),
    description: Joi.string().allow("", null),
    date: Joi.date(),
    type: Joi.string().valid(...Object.values(HOLIDAY_TYPE)).optional(),
    isRecurring: Joi.boolean().optional(),
    isBlocked: Joi.boolean().optional(),
});

export const deleteHolidaySchema = Joi.object().keys({
    id: Joi.string().required()
})

export const getAllHolidaySchema = Joi.object().keys({
    page: Joi.number().integer().optional(),
    limit: Joi.number().integer().optional(),
    search: Joi.string().optional(),
    activeFilter: Joi.boolean().optional(),
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional(),
})