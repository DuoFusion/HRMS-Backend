import Joi from "joi";

export const addReviewSchema = Joi.object({
    userId: Joi.string().required(),
    description: Joi.string().required(),
    rating: Joi.number().min(1).max(5).optional(),
});

export const updateReviewSchema = Joi.object({
    reviewId: Joi.string().required(),
    description: Joi.string().optional(),
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