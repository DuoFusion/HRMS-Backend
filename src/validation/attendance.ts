import Joi from 'joi'

export const checkInSchema = Joi.object({
    remarks: Joi.string().optional().allow('', null)
})

export const checkOutSchema = Joi.object({
    remarks: Joi.string().optional().allow('', null)
})

export const updateBreakSchema = Joi.object({
    breakMinutes: Joi.number().min(0).max(1440).required() // Max 24 hours in minutes
})

export const getAttendanceSchema = Joi.object({
    page: Joi.number().min(1).optional(),
    limit: Joi.number().min(1).max(100).optional(),
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional(),
    status: Joi.string().valid("Present", "Absent", "Half Day", "Leave").optional(),
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
