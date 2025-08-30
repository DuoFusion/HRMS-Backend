import Joi from "joi";

export const addReviewSchema = Joi.object({
    userId: Joi.string().required(),
    red: Joi.string().required(),
    yellow: Joi.string().required(),
    green: Joi.string().required(),
    rating: Joi.number().min(1).max(5).optional(),
});

export const updateReviewSchema = Joi.object({
    reviewId: Joi.string().required(),
    userId: Joi.string().optional(),
    red: Joi.string().optional(),
    yellow: Joi.string().optional(),
    green: Joi.string().optional(),
    rating: Joi.number().min(1).max(5).optional(),
});

export const deleteReviewSchema = Joi.object().keys({
    id: Joi.string().required(),
});

export const getReviewSchema = Joi.object().keys({
    id: Joi.string().required(),
});

export const getAllReviewSchema = Joi.object().keys({
    page: Joi.number().integer().optional(),
    limit: Joi.number().integer().optional(),
    search: Joi.string().optional(),
});