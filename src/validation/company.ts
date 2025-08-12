import Joi from "joi";

export const addCompanySchema = Joi.object().keys({
    name: Joi.string().required(),
    ownerName: Joi.string().required(),
    website: Joi.string().required(),
    address: Joi.string().required(),
    phoneNumber: Joi.string().required(),
    staringTime: Joi.date().required(),
    endingTime: Joi.date().required(),
});

export const editCompanySchema = Joi.object().keys({
    companyId: Joi.string().required(),
    name: Joi.string().optional(),
    ownerName: Joi.string().optional(),
    website: Joi.string().optional(),
    address: Joi.string().optional(),
    phoneNumber: Joi.string().optional(),
    staringTime: Joi.date().optional(),
    endingTime: Joi.date().optional(),
});

export const deleteCompanySchema = Joi.object().keys({
    id: Joi.string().required(),
});

export const getCompanySchema = Joi.object().keys({
    id: Joi.string().required(),
});

export const getAllCompanySchema = Joi.object().keys({
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
    activeFilter: Joi.boolean().optional(),
    search: Joi.string().min(1).optional(),
});