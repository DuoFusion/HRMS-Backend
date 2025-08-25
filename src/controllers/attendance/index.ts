import { attendanceModel, userModel, companyModel } from "../../database";
import { apiResponse, ROLES } from "../../common";
import { computeLateMinutesIst, countData, createData, findAllWithPopulateWithSorting, formatDateForResponse, formatTimeForResponse, getDataWithSorting, getEndOfDayIst, getFirstMatch, getHoursDifference, getStartOfDayIst, parseIstTimeStringToUtcToday, reqInfo, responseMessage, updateData } from "../../helper";
import { checkInSchema, checkOutSchema, updateBreakSchema, getAttendanceSchema, getAttendanceByIdSchema, updateAttendanceSchema, deleteAttendanceSchema } from "../../validation";

const ObjectId = require("mongoose").Types.ObjectId;

export const punch_in = async (req, res) => {
    reqInfo(req);
    let { user } = req.headers;
    try {
        const { error, value } = checkInSchema.validate(req.body);
        if (error) return res.status(501).json(new apiResponse(501, error?.details[0]?.message, {}, {}));

        const today = getStartOfDayIst();
        const tomorrow = getEndOfDayIst();

        const existingAttendance = await getFirstMatch(attendanceModel, { userId: new ObjectId(user._id), date: { $gte: today, $lt: tomorrow }, isDeleted: false }, {}, {});
        if (existingAttendance && existingAttendance.checkIn) return res.status(400).json(new apiResponse(400, "Already checked in today", {}, {}));

        const currentTime = new Date();
        let lateMinutes = 0;
        let status = "Present";

        let grace = 10;
        const dbUser = await getFirstMatch(userModel, { _id: new ObjectId(user._id), isDeleted: false }, { workingTime: 1, companyId: 1 }, {});
        if (dbUser?.companyId) {
            const company = await getFirstMatch(companyModel, { _id: new ObjectId(dbUser.companyId), isDeleted: false }, { lateMinutes: 1 }, {});
            const parsedGrace = Number(company?.lateMinutes);
            if (!isNaN(parsedGrace)) {
                grace = parsedGrace;
            }
        }

        const userStartStr: string | undefined = dbUser?.workingTime?.start;
        lateMinutes = computeLateMinutesIst(currentTime, userStartStr, grace);
        const attendanceData = {
            userId: new ObjectId(user._id),
            date: today,
            checkIn: currentTime,
            status,
            lateMinutes,
            remarks: value.remarks || null
        };

        let response;
        if (existingAttendance) {
            response = await updateData(attendanceModel, { _id: new ObjectId(existingAttendance._id) }, attendanceData);
        } else {
            response = await createData(attendanceModel, attendanceData);
        }

        if (!response) return res.status(404).json(new apiResponse(404, responseMessage?.addDataError, {}, {}));

        const baseResponse: any = (response && typeof (response as any).toObject === 'function') ? (response as any).toObject() : response;
        const formattedResponse = {
            ...baseResponse,
            checkIn: formatTimeForResponse(baseResponse.checkIn),
            date: formatDateForResponse(baseResponse.date)
        };

        return res.status(200).json(new apiResponse(200, "Check-in successful", formattedResponse, {}));
    } catch (error) {
        console.log(error);
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, error));
    }
};

export const punch_out = async (req, res) => {
    reqInfo(req);
    let { user } = req.headers;
    try {
        const { error, value } = checkOutSchema.validate(req.body);
        if (error) return res.status(501).json(new apiResponse(501, error?.details[0]?.message, {}, {}));

        const today = getStartOfDayIst();
        const tomorrow = getEndOfDayIst();

        const attendance = await getFirstMatch(attendanceModel, { userId: new ObjectId(user._id), date: { $gte: today, $lt: tomorrow }, isDeleted: false }, {}, {});

        if (!attendance || !attendance.checkIn) return res.status(400).json(new apiResponse(400, "No check-in record found for today", {}, {}));

        if (attendance.checkOut) return res.status(400).json(new apiResponse(400, "Already checked out today", {}, {}));

        const currentTime = new Date();
        const totalWorkingHours = getHoursDifference(attendance.checkIn, currentTime);
        const productiveHours = Math.max(0, totalWorkingHours - (attendance.breakMinutes / 60));
        const overtimeMinutes = Math.max(0, (totalWorkingHours - 9) * 60); // 9 hours standard work day
        const productionHours = Math.round(productiveHours * 100) / 100; // Round to 2 decimal places

        const updateDataObj = {
            checkOut: currentTime,
            totalWorkingHours,
            productiveHours,
            overtimeMinutes,
            productionHours,
            remarks: value.remarks || attendance.remarks
        };

        const response = await updateData(attendanceModel, { _id: attendance._id }, updateDataObj);

        if (!response) return res.status(404).json(new apiResponse(404, responseMessage?.updateDataError("attendance"), {}, {}));

        // Format response with IST times
        const baseResponse2: any = (response && typeof (response as any).toObject === 'function') ? (response as any).toObject() : response;
        const formattedResponse = {
            ...baseResponse2,
            checkIn: formatTimeForResponse(baseResponse2.checkIn),
            checkOut: formatTimeForResponse(baseResponse2.checkOut),
            date: formatDateForResponse(baseResponse2.date)
        };

        return res.status(200).json(new apiResponse(200, "Check-out successful", formattedResponse, {}));
    } catch (error) {
        console.log(error);
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, error));
    }
};

// Update break minutes
export const update_break = async (req, res) => {
    reqInfo(req);
    let { user } = req.headers, { id } = req.params;
    try {
        const { error, value } = updateBreakSchema.validate(req.body);
        if (error) return res.status(501).json(new apiResponse(501, error?.details[0]?.message, {}, {}));

        const attendance = await getFirstMatch(attendanceModel, { _id: new ObjectId(id), userId: new ObjectId(user._id), isDeleted: false }, {}, {});
        if (!attendance) return res.status(404).json(new apiResponse(404, responseMessage?.getDataNotFound("attendance"), {}, {}));

        let productiveHours = attendance.productiveHours;
        let productionHours = attendance.productionHours;

        if (attendance.totalWorkingHours > 0) {
            productiveHours = Math.max(0, attendance.totalWorkingHours - (value.breakMinutes / 60));
            productionHours = Math.round(productiveHours * 100) / 100;
        }

        const updateBreakData = {
            breakMinutes: value.breakMinutes,
            productiveHours,
            productionHours
        };

        const response = await updateData(
            attendanceModel,
            { _id: attendance._id },
            updateBreakData
        );

        if (!response) return res.status(404).json(new apiResponse(404, responseMessage?.updateDataError("attendance"), {}, {}));

        const formattedResponse = {
            ...response.toObject(),
            checkIn: formatTimeForResponse(response.checkIn),
            checkOut: formatTimeForResponse(response.checkOut),
            date: formatDateForResponse(response.date)
        };

        return res.status(200).json(new apiResponse(200, responseMessage?.updateDataSuccess("break"), formattedResponse, {}));
    } catch (error) {
        console.log(error);
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, error));
    }
};

export const get_all_attendance = async (req, res) => {
    reqInfo(req);
    let { user } = req.headers, criteria: any = {}, options: any = {}
    try {
        const { error, value } = getAttendanceSchema.validate(req.query);
        if (error) return res.status(501).json(new apiResponse(501, error?.details[0]?.message, {}, {}));

        let { userFilter, startDate, endDate } = req.query

        criteria.isDeleted = false

        if (user.role !== ROLES.ADMIN) criteria.userId = new ObjectId(user._id)

        if (userFilter) criteria.userId = new ObjectId(userFilter)

        if (startDate && endDate) criteria.date = { $gte: startDate, $lte: endDate }

        options.sort = { date: -1 }

        if (value.page && value.limit) {
            options.skip = (parseInt(value.page) - 1) * parseInt(value.limit);
            options.limit = parseInt(value.limit);
        }

        let populate = [
            { path: "userId", select: "fullName" },
        ];

        const response = await findAllWithPopulateWithSorting(attendanceModel, criteria, {}, options, populate);
        const totalCount = await countData(attendanceModel, criteria);

        const formattedResponse = response.map(attendance => ({
            ...attendance,
            checkIn: formatTimeForResponse(attendance.checkIn),
            checkOut: formatTimeForResponse(attendance.checkOut),
            date: formatDateForResponse(attendance.date)
        }))

        const stateObj = {
            page: parseInt(value.page) || 1,
            limit: parseInt(value.limit) || totalCount,
            page_limit: Math.ceil(totalCount / (parseInt(value.limit) || totalCount)) || 1,
        };

        return res.status(200).json(new apiResponse(200, responseMessage?.getDataSuccess('attendance'), {
            attendance_data: formattedResponse || [],
            totalData: totalCount,
            state: stateObj
        }, {}));
    } catch (error) {
        console.log(error);
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, error));
    }
};

// Get all attendance records (Admin only)
export const getAllAttendance = async (req, res) => {
    reqInfo(req);
    try {
        const { error, value } = getAttendanceSchema.validate(req.query);
        if (error) return res.status(501).json(new apiResponse(501, error?.details[0]?.message, {}, {}));

        let criteria: any = { isDeleted: false };
        let options: any = {};

        // Date range filter
        if (value.startDate && value.endDate) {
            const startDate = getStartOfDayIst(new Date(value.startDate));
            const endDate = getEndOfDayIst(new Date(value.endDate));
            criteria.date = { $gte: startDate, $lte: endDate };
        }

        // Status filter
        if (value.status) {
            criteria.status = value.status;
        }

        // Employee filter
        if (value.userId) {
            criteria.userId = new ObjectId(value.userId);
        }

        // Search filter
        if (value.search) {
            criteria.$or = [
                { remarks: { $regex: value.search, $options: 'si' } }
            ];
        }

        options.sort = { createdAt: -1 };

        if (value.page && value.limit) {
            options.skip = (parseInt(value.page) - 1) * parseInt(value.limit);
            options.limit = parseInt(value.limit);
        }

        const response = await getDataWithSorting(attendanceModel, criteria, {
            path: 'userId',
            select: 'firstName lastName fullName email department designation'
        }, options);
        const totalCount = await countData(attendanceModel, criteria);

        // Format response with IST times
        const formattedResponse = response.map(attendance => ({
            ...attendance.toObject(),
            checkIn: formatTimeForResponse(attendance.checkIn),
            checkOut: formatTimeForResponse(attendance.checkOut),
            date: formatDateForResponse(attendance.date)
        }));

        const stateObj = {
            page: parseInt(value.page) || 1,
            limit: parseInt(value.limit) || totalCount,
            page_limit: Math.ceil(totalCount / (parseInt(value.limit) || totalCount)) || 1,
        };

        return res.status(200).json(new apiResponse(200, responseMessage?.getDataSuccess('attendance'), {
            attendance_data: formattedResponse || [],
            totalData: totalCount,
            state: stateObj
        }, {}));
    } catch (error) {
        console.log(error);
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, error));
    }
};

// Get attendance by ID
export const getAttendanceById = async (req, res) => {
    reqInfo(req);
    try {
        const { error, value } = getAttendanceByIdSchema.validate(req.params);
        if (error) return res.status(501).json(new apiResponse(501, error?.details[0]?.message, {}, {}));

        const response = await getFirstMatch(
            attendanceModel,
            { _id: new ObjectId(value.id), isDeleted: false },
            {
                path: 'userId',
                select: 'firstName lastName fullName email department designation'
            },
            {}
        );

        if (!response) return res.status(404).json(new apiResponse(404, responseMessage?.getDataNotFound("attendance"), {}, {}));

        // Format response with IST times
        const formattedResponse = {
            ...response.toObject(),
            checkIn: formatTimeForResponse(response.checkIn),
            checkOut: formatTimeForResponse(response.checkOut),
            date: formatDateForResponse(response.date)
        };

        return res.status(200).json(new apiResponse(200, responseMessage?.getDataSuccess("attendance"), formattedResponse, {}));
    } catch (error) {
        console.log(error);
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, error));
    }
};

// Update attendance record (Admin only)
export const updateAttendance = async (req, res) => {
    reqInfo(req);
    try {
        const { error, value } = updateAttendanceSchema.validate(req.body);
        if (error) return res.status(501).json(new apiResponse(501, error?.details[0]?.message, {}, {}));

        const { id } = req.params;

        // Check if attendance exists
        const existingAttendance = await getFirstMatch(
            attendanceModel,
            { _id: new ObjectId(id), isDeleted: false },
            {},
            {}
        );

        if (!existingAttendance) {
            return res.status(404).json(new apiResponse(404, responseMessage?.getDataNotFound("attendance"), {}, {}));
        }

        // Recalculate fields if check-in or check-out is updated
        let updateData = { ...value };

        if (value.checkIn || value.checkOut) {
            const checkIn = value.checkIn || existingAttendance.checkIn;
            const checkOut = value.checkOut || existingAttendance.checkOut;

            if (checkIn && checkOut) {
                const totalWorkingHours = getHoursDifference(checkIn, checkOut);
                const productiveHours = Math.max(0, totalWorkingHours - ((value.breakMinutes || existingAttendance.breakMinutes) / 60));
                const overtimeMinutes = Math.max(0, (totalWorkingHours - 9) * 60);
                const productionHours = Math.round(productiveHours * 100) / 100;

                updateData = {
                    ...updateData,
                    totalWorkingHours,
                    productiveHours,
                    overtimeMinutes,
                    productionHours
                };
            }
        }

        const response = await updateData(
            attendanceModel,
            { _id: new ObjectId(id) },
            updateData
        );

        if (!response) return res.status(404).json(new apiResponse(404, responseMessage?.updateDataError("attendance"), {}, {}));

        // Format response with IST times
        const formattedResponse = {
            ...response.toObject(),
            checkIn: formatTimeForResponse(response.checkIn),
            checkOut: formatTimeForResponse(response.checkOut),
            date: formatDateForResponse(response.date)
        };

        return res.status(200).json(new apiResponse(200, responseMessage?.updateDataSuccess("attendance"), formattedResponse, {}));
    } catch (error) {
        console.log(error);
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, error));
    }
};

// Delete attendance record (Admin only)
export const deleteAttendance = async (req, res) => {
    reqInfo(req);
    try {
        const { error, value } = deleteAttendanceSchema.validate(req.params);
        if (error) return res.status(501).json(new apiResponse(501, error?.details[0]?.message, {}, {}));

        const response = await updateData(
            attendanceModel,
            { _id: new ObjectId(value.id), isDeleted: false },
            { isDeleted: true }
        );

        if (!response) return res.status(404).json(new apiResponse(404, responseMessage?.getDataNotFound("attendance"), {}, {}));

        return res.status(200).json(new apiResponse(200, responseMessage.deleteDataSuccess("attendance"), {}, {}));
    } catch (error) {
        console.log(error);
        return res.status(500).json(new apiResponse(500, responseMessage.internalServerError, {}, error));
    }
};
