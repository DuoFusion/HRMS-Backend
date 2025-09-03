import Joi from "joi";

export const addSeatSchema = Joi.object({
    seatNumber: Joi.number().required(),
    floor: Joi.string().allow(null, "").optional(),
    section: Joi.string().allow(null, "").optional(),
    userId: Joi.string().optional(),
});

export const updateSeatSchema = Joi.object({
    seatId: Joi.string().required(),
    seatNumber: Joi.number().optional(),
    floor: Joi.string().allow(null, "").optional(),
    section: Joi.string().allow(null, "").optional(),
    userId: Joi.string().optional(),
});

export const deleteSeatSchema = Joi.object({
    id: Joi.string().required()
});

export const getSeatByIdSchema = Joi.object({
    id: Joi.string().required()
});

export const getAllSeatsSchema = Joi.object({
    page: Joi.number().optional(),
    limit: Joi.number().optional(),
    search: Joi.string().optional(),
    userFilter: Joi.string().optional(),
});
