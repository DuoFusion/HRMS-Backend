import Joi from "joi";
import { ROLES, RELATION, LEAVE_STATUS, LEAVE_TYPE } from "../common";

export const addUserSchema = Joi.object().keys({
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    email: Joi.string().email().required(),
    phoneNumber: Joi.string().required(),
    password: Joi.string().required(),
    dob: Joi.string().required(),
    salary: Joi.number().optional(),
    profilePhoto: Joi.string().optional(),
    role: Joi.string().valid(...Object.values(ROLES)).required(),
    bankDetails: Joi.object({
        upiId: Joi.string().optional(),
        accountNumber: Joi.string().optional(),
        ifscCode: Joi.string().optional(),
        bankName: Joi.string().optional(),
        name: Joi.string().optional(),
    }).optional(),
    parentsDetails: Joi.object({
        number: Joi.string().optional(),
        name: Joi.string().optional(),
        relation: Joi.string().valid(...Object.values(RELATION)).optional(),
    }).optional(),
    workingTime: Joi.object({
        start: Joi.string().required(),
        end: Joi.string().required()
    }).required(),
    aadharCardNumber: Joi.string().optional(),
    panCardNumber: Joi.string().optional(),
    position: Joi.string().optional(),
    department: Joi.string().optional(),
    designation: Joi.string().optional(),
});

export const editUserSchema = Joi.object().keys({
    userId: Joi.string().required(),
    firstName: Joi.string().optional(),
    lastName: Joi.string().optional(),
    dob: Joi.string().optional(),
    email: Joi.string().email().optional(),
    phoneNumber: Joi.string().optional(),
    password: Joi.string().optional(),
    salary: Joi.number().optional(),
    profilePhoto: Joi.string().optional(),
    role: Joi.string().valid(...Object.values(ROLES)).optional(),
    bankDetails: Joi.object({
        upiId: Joi.string().optional(),
        accountNumber: Joi.string().optional(),
        ifscCode: Joi.string().optional(),
        bankName: Joi.string().optional(),
        name: Joi.string().optional(),
    }).optional(),
    parentsDetails: Joi.object({
        number: Joi.string().optional(),
        name: Joi.string().optional(),
        relation: Joi.string().valid(...Object.values(RELATION)).optional(),
    }).optional(),
    workingTime: Joi.object({
        start: Joi.string().optional(),
        end: Joi.string().optional()
    }).optional(),
    aadharCardNumber: Joi.string().optional(),
    panCardNumber: Joi.string().optional(),
    position: Joi.string().optional(),
    department: Joi.string().optional(),
    designation: Joi.string().optional(),
    isBlocked: Joi.boolean().optional(),
});

export const deleteUserSchema = Joi.object().keys({
    id: Joi.string().required(),
});

export const getUserSchema = Joi.object().keys({
    id: Joi.string().required(),
});

export const getAllUserSchema = Joi.object().keys({
    page: Joi.number().integer(),
    limit: Joi.number().integer(),
    statusFilter: Joi.string().valid(...Object.values(LEAVE_STATUS)).optional(),
    typeFilter: Joi.string().valid(...Object.values(LEAVE_TYPE)).optional(),
    search: Joi.string().optional(),
    activeFilter: Joi.boolean().optional()
});