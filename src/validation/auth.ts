import Joi from "joi";

export const loginSchema = Joi.object().keys({
    email: Joi.string().required(),
    password: Joi.string().required(),
});

export const resetPasswordSchema = Joi.object().keys({
    userId: Joi.string().optional(),
    oldPassword: Joi.string().optional(),
    newPassword: Joi.string().optional(),
    confirmPassword: Joi.string().optional(),
});

export const otpVerifySchema = Joi.object().keys({
    otp: Joi.number().required()
});

export const forgotPasswordSchema = Joi.object().keys({
    email: Joi.string().required(),
});

export const getProfileSchema = Joi.object().keys({
    email: Joi.string().required()
});

export const resetPasswordAdminSchema = Joi.object().keys({
    email: Joi.string().optional(),
    password: Joi.string().optional(),
    confirmPassword: Joi.string().optional(),
});