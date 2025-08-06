import Joi from "joi";

export const loginSchema = Joi.object().keys({
    email: Joi.string().required(),
    password: Joi.string().required(),
});

export const resetPasswordSchema = Joi.object().keys({
    userId: Joi.string().required(),
    oldPassword: Joi.string().required(),
    newPassword: Joi.string().required(),
});

export const otpVerifySchema = Joi.object().keys({
    otp: Joi.string().required()
});

export const forgotPasswordSchema = Joi.object().keys({
    email: Joi.string().required(),
    password: Joi.string().required()
});

export const getProfileSchema = Joi.object().keys({
    email: Joi.string().required()
});