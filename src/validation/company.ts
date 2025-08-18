import Joi from "joi";

export const addCompanySchema = Joi.object().keys({
    name: Joi.string().required(),
    ownerName: Joi.string().required(),
    address: Joi.string().required(),
    phoneNumber: Joi.string().required(),
    email: Joi.string().email().optional(),
    website: Joi.string().required(),
    logo: Joi.string().optional(),
    workingHours: Joi.object({
        start: Joi.date().required(),
        end: Joi.date().required()
    }).required(),
});

export const editCompanySchema = Joi.object().keys({
    companyId: Joi.string().required(),
    name: Joi.string().optional(),
    ownerName: Joi.string().optional(),
    website: Joi.string().optional(),
    address: Joi.string().optional(),
    phoneNumber: Joi.string().optional(),
    email: Joi.string().email().optional(),
    logo: Joi.string().optional(),
    workingHours: Joi.object({
        start: Joi.date().optional(),
        end: Joi.date().optional()
    }).optional(),
    isBlocked: Joi.boolean().optional(),
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