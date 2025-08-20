import Joi from "joi";
import { HOLIDAY_TYPE } from "../common";


export const addHolidaySchema = Joi.object().keys({
    title: Joi.string().required(),
    description: Joi.string().required(),
    date: Joi.string().required(),
    type: Joi.string().valid(...Object.values(HOLIDAY_TYPE)).optional(),
    isRecurring: Joi.boolean().required(),
    createdBy: Joi.string().required(),
    // updatedBy: Joi.string().required(),
    // isDeleted: Joi.string().required()
});

export const getHolidaytSchema = Joi.object().keys({
    id: Joi.string().required(),
});


export const updateHolidaySchema = Joi.object().keys({
    id: Joi.string().required(),
    title: Joi.string().trim(),
    description: Joi.string().allow("", null),
    date: Joi.date(),
    type: Joi.string().valid(...Object.values(HOLIDAY_TYPE)).optional(),
    isRecurring: Joi.boolean(),
    updatedBy: Joi.string().optional(),
});

export const deleteHolidaySchema = Joi.object().keys({
    id : Joi.string().required()
})

export const getAllHolidaySchema = Joi.object().keys({
    title: Joi.string().required(),
    description: Joi.string().required(),
    date: Joi.string().required(),
    type: Joi.string().valid(...Object.values(HOLIDAY_TYPE)).optional(),
    isRecurring: Joi.boolean().required(),
    createdBy: Joi.string().required(),
    updatedBy: Joi.string().required(),
    isDeleted: Joi.string().required()
})