import Joi from "joi";
import { LEAVE_TYPE } from "../common";

export const addRemarkSchema = Joi.object({
  userId: Joi.string().required(),
  note: Joi.string().required(),
  companyId: Joi.string().required(),
  type: Joi.string().valid(...Object.values(LEAVE_TYPE)).optional(),
});

export const updateRemarkSchema = Joi.object({
  remarkId: Joi.string().required(),
  userId: Joi.string().optional(),
  note: Joi.string().optional(),
});

export const deleteRemarkSchema = Joi.object({
  id: Joi.string().required(),
});

export const getAllRemarksSchema = Joi.object({
  page: Joi.number().optional(),
  limit: Joi.number().optional(),
  search: Joi.string().optional(),
  userFilter: Joi.string().optional(),
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),
});

export const getRemarkByIdSchema = Joi.object({
  id: Joi.string().required(),
});