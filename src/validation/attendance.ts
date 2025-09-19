import Joi from 'joi'
import { HOLIDAY_TYPE } from '../common'

export const checkInSchema = Joi.object({
    remarks: Joi.string().optional().allow('', null)
})

export const checkOutSchema = Joi.object({
    remarks: Joi.string().optional().allow('', null)
})

export const manualPunchOutSchema = Joi.object({
    remarks: Joi.string().optional().allow('', null),
    customTime: Joi.string().required()
})

export const updateBreakSchema = Joi.object({
    breakMinutes: Joi.number().min(0).max(1440).required() // Max 24 hours in minutes
})

export const breakInSchema = Joi.object({
})

export const breakOutSchema = Joi.object({
})

export const add_attendanceSchema = Joi.object({
    userId: Joi.string().required(),
    companyId: Joi.string().required(),
    date: Joi.date().iso().required(),
    checkIn: Joi.date().iso().required(),
    title: Joi.string().required(),
    description: Joi.string().required(),
    type: Joi.string().valid(...Object.values(HOLIDAY_TYPE)).optional(),
})

// Minimal, leave-like schema for manual attendance creation
export const addManualAttendanceSchema = Joi.object({
    userId: Joi.string().optional(),
    date: Joi.date().iso().required(),
    status: Joi.string().valid("Present", "Absent", "Half Day", "Leave").optional(),
    remarks: Joi.string().optional().allow('', null),
    checkIn: Joi.date().iso().optional(),
    checkOut: Joi.date().iso().optional(),
    sessions: Joi.array().items(Joi.object({
        checkIn: Joi.date().iso().optional(),
        checkOut: Joi.date().iso().optional(),
        breaks: Joi.array().items(Joi.object({
            breakIn: Joi.date().iso().optional(),
            breakOut: Joi.date().iso().optional()
        })).optional()
    })).optional()
})

export const getAttendanceSchema = Joi.object({
    page: Joi.number().integer().optional(),
    limit: Joi.number().integer().optional(),
    userFilter: Joi.string().optional(),
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional(),
    statusFilter: Joi.string().valid("Present", "Absent", "Half Day", "Leave").optional(),
    dateFilter: Joi.string().valid("asc", "desc").optional(),
    search: Joi.string().optional().allow('', null)
})

export const getAttendanceByIdSchema = Joi.object({
    id: Joi.string().required()
})

export const updateAttendanceSchema = Joi.object({
    checkIn: Joi.date().optional(),
    checkOut: Joi.date().optional(),
    status: Joi.string().valid("Present", "Absent", "Half Day", "Leave").optional(),
    breakMinutes: Joi.number().min(0).max(1440).optional(),
    lateMinutes: Joi.number().min(0).optional(),
    overtimeMinutes: Joi.number().min(0).optional(),
    productionHours: Joi.number().min(0).optional(),
    totalWorkingHours: Joi.number().min(0).optional(),
    productiveHours: Joi.number().min(0).optional(),
    remarks: Joi.string().optional().allow('', null)
})

export const deleteAttendanceSchema = Joi.object({
    id: Joi.string().required()
})
