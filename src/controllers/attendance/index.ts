import { attendanceModel, userModel, companyModel, holidayModel, remarkModel } from "../../database";
import { apiResponse, ATTENDANCE_HISTORY_STATUS, ATTENDANCE_STATUS, REMARK_TYPE, ROLES } from "../../common";
import { computeLateMinutesIst, countData, createData, findAllWithPopulateWithSorting, formatDateForResponseUtc, formatTimeForResponseUtc, getDataWithSorting, getFirstMatch, getHoursDifference, getMinutesDifference, istToUtc, parseUtcTimeStringToUtcToday, reqInfo, responseMessage, updateData, utcToIst } from "../../helper";
import { checkInSchema, checkOutSchema, manualPunchOutSchema, getAttendanceSchema, getAttendanceByIdSchema, updateAttendanceSchema, deleteAttendanceSchema } from "../../validation";

const ObjectId = require("mongoose").Types.ObjectId;

export const punch_in = async (req, res) => {
    reqInfo(req);
    let { user } = req.headers;
    try {
        const { error, value } = checkInSchema.validate(req.body);
        if (error) return res.status(501).json(new apiResponse(501, error?.details[0]?.message, {}, {}));

        const queryStart = new Date();
        queryStart.setHours(0, 0, 0, 0);

        const queryEnd = new Date();
        queryEnd.setHours(23, 59, 59, 999);

        const existingAttendance = await getFirstMatch(attendanceModel, { userId: new ObjectId(user._id), date: { $gte: queryStart, $lt: queryEnd }, isDeleted: false }, {}, {});
        if (existingAttendance && Array.isArray(existingAttendance.sessions)) {
            const hasOpenSession = existingAttendance.sessions.some((s: any) => s && s.checkIn && !s.checkOut);
            if (hasOpenSession) {
                return res.status(400).json(new apiResponse(400, "Already checked in (open session exists)", {}, {}));
            }
        } else if (existingAttendance && existingAttendance.checkIn && !existingAttendance.checkOut) {
            return res.status(400).json(new apiResponse(400, "Already checked in (legacy open)", {}, {}));
        }

        const currentTime = new Date();
        let lateMinutes = 0;
        let status = "Present";
        let finalRemarks = value.remarks || "";

        let grace = 10;
        const dbUser = await getFirstMatch(userModel, { _id: new ObjectId(user._id), isDeleted: false }, { workingTime: 1, companyId: 1 }, {});

        if (dbUser?.companyId) {
            const company = await getFirstMatch(companyModel, { _id: new ObjectId(dbUser.companyId), isDeleted: false }, { lateMinutes: 1 }, {});
            const parsedGrace = Number(company?.lateMinutes);
            if (!isNaN(parsedGrace)) grace = parsedGrace;
        }

        const userStartStr: string | undefined = dbUser?.workingTime?.start;

        let latePunchInRemark = "";
        if (!existingAttendance) {
            lateMinutes = computeLateMinutesIst(currentTime, userStartStr, grace);

            if (lateMinutes > 0) {
                latePunchInRemark = `Late punch-in: ${lateMinutes} minutes after expected start time (${userStartStr || 'Not set'})`;

                try {
                    const remarkData = {
                        note: latePunchInRemark,
                        type: REMARK_TYPE.AUTO,
                        userId: new ObjectId(user._id),
                        isDeleted: false
                    };
                    await createData(remarkModel, remarkData);
                } catch (remarkError) {
                    console.log("Failed to create late punch-in remark:", remarkError);
                }
            }

            if (latePunchInRemark) {
                finalRemarks = finalRemarks
                    ? `${finalRemarks}; ${latePunchInRemark}`
                    : latePunchInRemark;
            }
        }

        // Build session to append
        const newSession = {
            checkIn: currentTime,
            checkOut: null,
            breaks: [] as any[]
        } as any;

        const attendanceDate = new Date();
        attendanceDate.setHours(0, 0, 0, 0);

        let response;
        if (existingAttendance) {
            const sessions = Array.isArray(existingAttendance.sessions) ? existingAttendance.sessions : [];
            sessions.push(newSession);
            response = await updateData(attendanceModel, { _id: new ObjectId(existingAttendance._id) }, { checkOut: null, sessions,  $push: { history: { status: ATTENDANCE_HISTORY_STATUS.PUNCH_IN } } });
        } else {
            response = await createData(attendanceModel, {
                userId: new ObjectId(user._id),
                date: attendanceDate,
                status,
                lateMinutes,
                remarks: finalRemarks || null,
                checkIn: currentTime,
                checkOut: null,
                history: [{ status: ATTENDANCE_HISTORY_STATUS.PUNCH_IN }],
                sessions: [newSession]
            });
        }

        if (!response) {
            return res.status(404).json(new apiResponse(404, responseMessage?.addDataError, {}, {}));
        }

        const baseResponse: any =
            response && typeof (response as any).toObject === "function"
                ? (response as any).toObject()
                : response;

        const formattedResponse = {
            ...baseResponse,
            date: formatDateForResponseUtc(baseResponse.date)
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

        const queryStart = new Date();
        queryStart.setHours(0, 0, 0, 0);

        const queryEnd = new Date();
        queryEnd.setHours(23, 59, 59, 999);

        const attendance = await getFirstMatch(attendanceModel, { userId: new ObjectId(user._id), date: { $gte: queryStart, $lt: queryEnd }, isDeleted: false }, {}, {});

        if (!attendance) return res.status(400).json(new apiResponse(400, "No check-in record found for today", {}, {}));

        const dbUser = await getFirstMatch(userModel, { _id: new ObjectId(user._id), isDeleted: false }, { companyId: 1 }, {});
        let sessions = Array.isArray(attendance.sessions) ? attendance.sessions : [];
        let hasSessions = sessions.length > 0;
        let openSessionIndex = hasSessions ? sessions.findIndex((s: any) => s && s.checkIn && !s.checkOut) : -1;

        const currentTime = new Date();
        if (openSessionIndex >= 0) {
            sessions[openSessionIndex].checkOut = currentTime;
        } else {
            if (sessions.length > 0) {
                const lastIdx = sessions.length - 1;
                sessions[lastIdx].checkOut = currentTime;
            } else if (attendance.checkIn) {
                attendance.checkOut = currentTime;
            } else {
                return res.status(400).json(new apiResponse(400, "No open session or check-in to check out", {}, {}));
            }
        }

        const computeTotals = async (att: any, companyId: any) => {
            let totalMinutes = 0;
            let breakMinutes = 0;
            const allSessions = Array.isArray(att.sessions) && att.sessions.length > 0 ? att.sessions : (att.checkIn && att.checkOut ? [{ checkIn: att.checkIn, checkOut: att.checkOut, breaks: [] }] : []);
            for (const session of allSessions) {
                if (session.checkIn && session.checkOut) {
                    totalMinutes += getHoursDifference(session.checkIn, session.checkOut) * 60;
                    if (Array.isArray(session.breaks)) {
                        for (const b of session.breaks) {
                            if (b.breakIn && b.breakOut) {
                                breakMinutes += getHoursDifference(b.breakIn, b.breakOut) * 60;
                            }
                        }
                    }
                }
            }
            const totalWorkingHours = totalMinutes / 60;
            const productiveHours = Math.max(0, totalWorkingHours - (breakMinutes / 60));

            let companyTotalWorkingHours = 9;
            if (companyId) {
                const company = await getFirstMatch(companyModel, { _id: new ObjectId(companyId), isDeleted: false }, { totalWorkingHours: 1 }, {});
                if (company?.totalWorkingHours) {
                    companyTotalWorkingHours = company.totalWorkingHours;
                }
            }

            const overtimeMinutes = Math.max(0, (totalWorkingHours - companyTotalWorkingHours) * 60);
            const productionHours = Math.round(productiveHours * 100) / 100;
            return { totalWorkingHours, productiveHours, overtimeMinutes, productionHours, breakMinutes };
        };

        const totals = await computeTotals({ ...attendance.toObject?.() ?? attendance, sessions }, dbUser?.companyId);
        const updateDataObj: any = {
            checkOut: attendance.checkOut || currentTime,
            sessions,
            totalWorkingHours: totals.totalWorkingHours,
            productiveHours: totals.productiveHours,
            overtimeMinutes: totals.overtimeMinutes,
            productionHours: totals.productionHours,
            breakMinutes: totals.breakMinutes,
            remarks: value.remarks || attendance.remarks,
            $push: { history: { status: ATTENDANCE_HISTORY_STATUS.PUNCH_OUT } }
        };

        const response = await updateData(attendanceModel, { _id: attendance._id }, updateDataObj);
        if (!response) return res.status(404).json(new apiResponse(404, responseMessage?.updateDataError("attendance"), {}, {}));

        const baseResponse2: any = (response && typeof (response as any).toObject === 'function') ? (response as any).toObject() : response;
        const formattedResponse = {
            ...baseResponse2,
            date: formatDateForResponseUtc(baseResponse2.date)
        };

        return res.status(200).json(new apiResponse(200, "Check-out successful", formattedResponse, {}));
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

        let { userFilter, startDate, endDate, statusFilter, dateFilter } = req.query

        criteria.isDeleted = false

        options.sort = { date: -1 }

        if (user.role === ROLES.PROJECT_MANAGER || user.role === ROLES.EMPLOYEE) criteria.userId = new ObjectId(user._id)

        if (userFilter) criteria.userId = new ObjectId(userFilter)

        if (dateFilter) options.sort = dateFilter === "asc" ? { date: 1 } : { date: -1 }

        if (startDate && endDate) criteria.createdAt = { $gte: startDate, $lte: endDate }

        if (statusFilter) criteria.status = statusFilter

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
            date: formatDateForResponseUtc(attendance.date),
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

export const getAttendanceById = async (req, res) => {
    reqInfo(req);
    try {
        const { error, value } = getAttendanceByIdSchema.validate(req.params);
        if (error) return res.status(501).json(new apiResponse(501, error?.details[0]?.message, {}, {}));

        const response = await getFirstMatch(attendanceModel, { _id: new ObjectId(value.id), isDeleted: false }, { path: 'userId', select: 'firstName lastName fullName email department designation' }, {});

        if (!response) return res.status(404).json(new apiResponse(404, responseMessage?.getDataNotFound("attendance"), {}, {}));

        const formattedResponse = {
            ...response.toObject(),
            checkIn: formatTimeForResponseUtc(response.checkIn),
            checkOut: formatTimeForResponseUtc(response.checkOut),
            date: formatDateForResponseUtc(response.date),
            sessions: Array.isArray((response as any).sessions) ? (response as any).sessions.map((s: any) => ({
                ...s,
                checkIn: formatTimeForResponseUtc(s.checkIn),
                checkOut: formatTimeForResponseUtc(s.checkOut),
                breaks: Array.isArray(s.breaks) ? s.breaks.map((b: any) => ({
                    ...b,
                    breakIn: formatTimeForResponseUtc(b.breakIn),
                    breakOut: formatTimeForResponseUtc(b.breakOut)
                })) : []
            })) : []
        };

        return res.status(200).json(new apiResponse(200, responseMessage?.getDataSuccess("attendance"), formattedResponse, {}));
    } catch (error) {
        console.log(error);
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, error));
    }
};

export const add_attendance = async (req, res) => {
    reqInfo(req);
    const { userId, date, status, remarks, checkIn, checkOut, sessions } = req.body;

    try {
        if (!userId || !date) {
            return res.status(400).json(new apiResponse(400, "userId and date are required", {}, {}));
        }

        const attendanceDate = new Date(date);
        attendanceDate.setHours(0, 0, 0, 0);

        const existing = await attendanceModel.findOne({ userId, date: attendanceDate, isDeleted: false });
        if (existing) {
            return res.status(400).json(new apiResponse(400, "Attendance already exists for this date", {}, {}));
        }

        let finalSessions: any[] = [];

        if (checkIn && checkOut) {
            finalSessions.push({
                checkIn: new Date(checkIn),
                checkOut: new Date(checkOut),
                breaks: []
            });
        }

        if (Array.isArray(sessions) && sessions.length > 0) {
            finalSessions = sessions.map((s: any) => ({
                checkIn: s.checkIn ? new Date(s.checkIn) : null,
                checkOut: s.checkOut ? new Date(s.checkOut) : null,
                breaks: Array.isArray(s.breaks) ? s.breaks.map((b: any) => ({
                    breakIn: b.breakIn ? new Date(b.breakIn) : null,
                    breakOut: b.breakOut ? new Date(b.breakOut) : null
                })) : []
            }));
        }

        let attendanceCheckIn: Date | null = null;
        let attendanceCheckOut: Date | null = null;
        if (finalSessions.length > 0) {
            const validSessions = finalSessions.filter(s => s.checkIn);
            if (validSessions.length > 0) {
                attendanceCheckIn = validSessions[0].checkIn;
                attendanceCheckOut = validSessions[validSessions.length - 1].checkOut || null;
            }
        }

        let totalMinutes = 0, breakMinutes = 0;
        for (const s of finalSessions) {
            if (s.checkIn && s.checkOut) {
                totalMinutes += getHoursDifference(s.checkIn, s.checkOut) * 60;
                if (Array.isArray(s.breaks)) {
                    for (const b of s.breaks) {
                        if (b.breakIn && b.breakOut) {
                            breakMinutes += getHoursDifference(b.breakIn, b.breakOut) * 60;
                        }
                    }
                }
            }
        }

        const totalWorkingHours = totalMinutes / 60;
        const productiveHours = Math.max(0, totalWorkingHours - (breakMinutes / 60));

        const attendance = await attendanceModel.create({
            userId,
            date: attendanceDate,
            status: status || ATTENDANCE_STATUS.PRESENT,
            remarks: remarks || "Manually added",
            checkIn: attendanceCheckIn,
            checkOut: attendanceCheckOut,
            sessions: finalSessions,
            totalWorkingHours,
            productiveHours,
            productionHours: Math.round(productiveHours * 100) / 100,
            breakMinutes,
            overtimeMinutes: Math.max(0, (totalWorkingHours - 9) * 60) // default 9 hrs
        });

        return res.status(200).json(new apiResponse(200, "Manual attendance added successfully", attendance, {}));
    } catch (error) {
        console.log(error);
        return res.status(500).json(new apiResponse(500, responseMessage.internalServerError, {}, error));
    }
};

export const edit_attendance_by_id = async (req, res) => {
    reqInfo(req);
    const { attendanceId, status, remarks, checkIn, checkOut, sessions } = req.body;

    try {
        if (!attendanceId) return res.status(400).json(new apiResponse(400, "attendanceId is required", {}, {}));

        const attendance = await attendanceModel.findById(attendanceId);
        if (!attendance || attendance.isDeleted) return res.status(404).json(new apiResponse(404, "Attendance not found", {}, {}));

        if (status) attendance.status = status;
        if (remarks) attendance.remarks = remarks;

        if (checkIn && checkOut) {
            attendance.checkIn = new Date(checkIn);
            attendance.checkOut = new Date(checkOut);
            attendance.sessions = [{
                checkIn: new Date(checkIn),
                checkOut: new Date(checkOut),
                breaks: []
            }];
        }

        if (Array.isArray(sessions) && sessions.length > 0) {
            attendance.sessions = sessions.map((s: any) => ({
                checkIn: s.checkIn ? new Date(s.checkIn) : null,
                checkOut: s.checkOut ? new Date(s.checkOut) : null,
                breaks: Array.isArray(s.breaks) ? s.breaks.map((b: any) => ({
                    breakIn: b.breakIn ? new Date(b.breakIn) : null,
                    breakOut: b.breakOut ? new Date(b.breakOut) : null
                })) : []
            }));

            const validSessions = attendance.sessions.filter(s => s.checkIn);
            if (validSessions.length > 0) {
                attendance.checkIn = validSessions[0].checkIn;
                attendance.checkOut = validSessions[validSessions.length - 1].checkOut || null;
            }
        }

        let totalMinutes = 0, breakMinutes = 0;
        for (const s of attendance.sessions) {
            if (s.checkIn && s.checkOut) {
                totalMinutes += getHoursDifference(s.checkIn, s.checkOut) * 60;
                if (Array.isArray(s.breaks)) {
                    for (const b of s.breaks) {
                        if (b.breakIn && b.breakOut) {
                            breakMinutes += getHoursDifference(b.breakIn, b.breakOut) * 60;
                        }
                    }
                }
            }
        }

        const totalWorkingHours = totalMinutes / 60;
        const productiveHours = Math.max(0, totalWorkingHours - (breakMinutes / 60));
        attendance.totalWorkingHours = totalWorkingHours;
        attendance.productiveHours = productiveHours;
        attendance.productionHours = Math.round(productiveHours * 100) / 100;
        attendance.breakMinutes = breakMinutes;
        attendance.overtimeMinutes = Math.max(0, (totalWorkingHours - 9) * 60)

        await attendance.save();

        return res.status(200).json(new apiResponse(200, "Manual attendance updated successfully", attendance, {}));
    } catch (error) {
        console.log(error);
        return res.status(500).json(new apiResponse(500, responseMessage.internalServerError, {}, error));
    }
};

export const deleteAttendance = async (req, res) => {
    reqInfo(req);
    try {
        const { error, value } = deleteAttendanceSchema.validate(req.params);
        if (error) return res.status(501).json(new apiResponse(501, error?.details[0]?.message, {}, {}));

        const response = await updateData(attendanceModel, { _id: new ObjectId(value.id), isDeleted: false }, { isDeleted: true });

        if (!response) return res.status(404).json(new apiResponse(404, responseMessage?.getDataNotFound("attendance"), {}, {}));

        return res.status(200).json(new apiResponse(200, responseMessage.deleteDataSuccess("attendance"), {}, {}));
    } catch (error) {
        console.log(error);
        return res.status(500).json(new apiResponse(500, responseMessage.internalServerError, {}, error));
    }
};

export const get_today_attendance = async (req, res) => {
    reqInfo(req);
    let { user } = req.headers;
    try {
        // Create IST timezone boundaries using setHours for database query
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const attendance: any = await getFirstMatch(attendanceModel, { userId: new ObjectId(user._id), date: { $gte: todayStart, $lt: todayEnd }, isDeleted: false }, {}, {});

        const lastAttendance: any = await getFirstMatch(attendanceModel, { userId: new ObjectId(user._id), date: { $lt: todayStart }, isDeleted: false }, {}, { sort: { date: -1 } });

        let lastPunchOut = false;
        if (lastAttendance && lastAttendance.status === ATTENDANCE_STATUS.PRESENT) {
            const lastBase = (lastAttendance && typeof lastAttendance.toObject === 'function') ? lastAttendance.toObject() : lastAttendance;
            const lastSessions = Array.isArray(lastBase.sessions) && lastBase.sessions.length > 0 ? lastBase.sessions : (lastBase.checkIn ? [{ checkIn: lastBase.checkIn, checkOut: lastBase.checkOut, breaks: [] }] : []);

            const lastSession = lastSessions.length > 0 ? lastSessions[lastSessions.length - 1] : null;
            lastPunchOut = lastSession ? (lastSession.checkIn && lastSession.checkOut) : (lastBase.checkIn && lastBase.checkOut);
        }
        if (!lastAttendance || lastAttendance.sessions.length === 0) lastPunchOut = true

        if (!attendance) return res.status(200).json(new apiResponse(200, responseMessage?.getDataSuccess('attendance'), { lastPunchOut: !!lastPunchOut }, {}));

        const base = (attendance && typeof attendance.toObject === 'function') ? attendance.toObject() : attendance;
        const formatted = {
            ...base,
            date: formatDateForResponseUtc(base.date),
            lastPunchOut: !!lastPunchOut
        };

        return res.status(200).json(new apiResponse(200, responseMessage?.getDataSuccess('attendance'), formatted, {}));
    } catch (error) {
        console.log(error);
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, error));
    }
};

export const get_attendance_summary = async (req, res) => {
    reqInfo(req);
    let { user } = req.headers;
    try {
        const now = new Date();
        // Create IST timezone boundaries using setHours for database query
        const queryStartToday = new Date(now);
        queryStartToday.setHours(0, 0, 0, 0);

        const queryEndToday = new Date(now);
        queryEndToday.setHours(23, 59, 59, 999);

        const startOfWeek = (() => {
            const d = new Date(now);
            const day = d.getDay();
            const diff = (day === 0 ? 6 : day - 1);
            d.setDate(d.getDate() - diff);
            d.setHours(0, 0, 0, 0);
            return d;
        })();
        const endOfWeek = (() => {
            const d = new Date(startOfWeek.getTime() + 6 * 24 * 60 * 60 * 1000);
            d.setHours(23, 59, 59, 999);
            return d;
        })();

        const startOfMonth = (() => {
            const d = new Date(now.getFullYear(), now.getMonth(), 1);
            d.setHours(0, 0, 0, 0);
            return d;
        })();
        const endOfMonth = (() => {
            const d = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            d.setHours(23, 59, 59, 999);
            return d;
        })();

        const loadRange = async (from: Date, to: Date) => {
            const list = await getDataWithSorting(
                attendanceModel,
                { userId: new ObjectId(user._id), date: { $gte: from, $lte: to }, isDeleted: false },
                {},
                { sort: { date: 1 } }
            );
            return list || [];
        };

        const todayEntry: any = await getFirstMatch(attendanceModel, { userId: new ObjectId(user._id), date: { $gte: queryStartToday, $lt: queryEndToday }, isDeleted: false }, {}, {});
        const weekEntries: any[] = await loadRange(startOfWeek, endOfWeek);
        const monthEntries: any[] = await loadRange(startOfMonth, endOfMonth);
        let dailyTargetHours = 9;
        let companyTotalWorkingHours = 9;
        const computeFromSessions = (entries: any[]) => {
            let totalMinutes = 0;
            let breakMinutes = 0;
            for (const att of entries) {
                const base = typeof att.toObject === 'function' ? att.toObject() : att;
                const sessions = Array.isArray(base.sessions) && base.sessions.length > 0 ? base.sessions : (base.checkIn && base.checkOut ? [{ checkIn: base.checkIn, checkOut: base.checkOut, breaks: [] }] : []);
                for (const s of sessions) {
                    if (s.checkIn && s.checkOut) {
                        totalMinutes += getHoursDifference(s.checkIn, s.checkOut) * 60;
                        if (Array.isArray(s.breaks)) {
                            for (const b of s.breaks) {
                                if (b.breakIn && b.breakOut) breakMinutes += getHoursDifference(b.breakIn, b.breakOut) * 60;
                            }
                        }
                    }
                }
            }
            const totalWorkingHours = totalMinutes / 60;
            const productiveHours = Math.max(0, totalWorkingHours - breakMinutes / 60);
            const overtimeMinutes = Math.max(0, (totalWorkingHours - companyTotalWorkingHours) * 60);
            const productionHours = Math.round(productiveHours * 100) / 100;
            return { totalWorkingHours, productiveHours, overtimeMinutes, productionHours, breakMinutes };
        };

        const todayTotals = todayEntry ? computeFromSessions([todayEntry]) : { totalWorkingHours: 0, productiveHours: 0, overtimeMinutes: 0, productionHours: 0, breakMinutes: 0 };
        const weekTotals = computeFromSessions(weekEntries);
        const monthTotals = computeFromSessions(monthEntries);


        const dbUser = await getFirstMatch(userModel, { _id: new ObjectId(user._id), isDeleted: false }, { companyId: 1 }, {});
        if (dbUser?.companyId) {
            const company: any = await getFirstMatch(companyModel, { _id: new ObjectId(dbUser.companyId), isDeleted: false }, { workingHours: 1, totalWorkingHours: 1 }, {});
            const startStr: string | undefined = company?.workingHours?.start;
            const endStr: string | undefined = company?.workingHours?.end;
            if (startStr && endStr) {
                const s = parseUtcTimeStringToUtcToday(startStr);
                const e = parseUtcTimeStringToUtcToday(endStr);
                if (s && e) {
                    dailyTargetHours = Math.max(0, getHoursDifference(s, e));
                }
            }
            if (company?.totalWorkingHours) {
                companyTotalWorkingHours = company.totalWorkingHours;
            }
        }

        const getHolidaySet = async (from: Date, to: Date) => {
            const holidays = await getDataWithSorting(holidayModel as any, { date: { $gte: from, $lte: to }, isDeleted: false }, {}, { sort: { date: 1 } });
            const set = new Set<number>();
            for (const h of (holidays || [])) {
                const d = new Date((h as any).date);
                const key = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
                set.add(key);
            }
            return set;
        };

        const countWorkingDays = async (from: Date, to: Date) => {
            const holidaySet = await getHolidaySet(from, to);
            let count = 0;
            const d = new Date(from);
            while (d <= to) {
                const day = d.getDay();
                const key = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
                const isWeekend = (day === 0 || day === 6);
                const isHoliday = holidaySet.has(key);
                if (!isWeekend && !isHoliday) count += 1;
                d.setDate(d.getDate() + 1);
            }
            return count;
        };

        const workingDaysThisWeek = await countWorkingDays(startOfWeek, endOfWeek);
        const workingDaysThisMonth = await countWorkingDays(startOfMonth, endOfMonth);

        const weeklyHoursTarget = dailyTargetHours * workingDaysThisWeek;
        const monthlyHoursTarget = dailyTargetHours * workingDaysThisMonth;

        // Overtime this month based on target
        const overtimeThisMonthHours = Math.max(0, monthTotals.totalWorkingHours - monthlyHoursTarget);

        // Build timeline for today from sessions/breaks
        const timeline = (() => {
            if (!todayEntry) return [] as any[];
            const base = typeof todayEntry.toObject === 'function' ? todayEntry.toObject() : todayEntry;
            const items: any[] = [];
            const sessions = Array.isArray(base.sessions) && base.sessions.length > 0 ? base.sessions : (base.checkIn ? [{ checkIn: base.checkIn, checkOut: base.checkOut, breaks: [] }] : []);
            for (const s of sessions) {
                if (!s.checkIn) continue;
                const sessionEnd = s.checkOut || now;
                let pointer = new Date(s.checkIn);
                const orderedBreaks = (Array.isArray(s.breaks) ? s.breaks : []).slice().sort((a: any, b: any) => new Date(a.breakIn).getTime() - new Date(b.breakIn).getTime());
                for (const b of orderedBreaks) {
                    if (b.breakIn && pointer < b.breakIn) {
                        items.push({ type: 'work', start: pointer, end: b.breakIn });
                    }
                    if (b.breakIn) {
                        items.push({ type: 'break', start: b.breakIn, end: b.breakOut || now });
                        pointer = b.breakOut || now;
                    }
                }
                if (pointer < sessionEnd) items.push({ type: 'work', start: pointer, end: sessionEnd });
            }
            // Format for response
            return items.map(seg => ({
                type: seg.type,
                start: formatTimeForResponseUtc(seg.start),
                end: formatTimeForResponseUtc(seg.end)
            }));
        })();

        // Targets (dynamic based on company and calendar)
        const targets = {
            dailyHoursTarget: dailyTargetHours,
            weeklyHoursTarget: weeklyHoursTarget,
            monthlyHoursTarget: monthlyHoursTarget
        } as any;

        const summary = {
            now: formatTimeForResponseUtc(now),
            date: formatDateForResponseUtc(now),
            today: {
                totalWorkingHours: todayTotals.totalWorkingHours,
                productiveHours: todayTotals.productiveHours,
                breakMinutes: todayTotals.breakMinutes,
                overtimeMinutes: todayTotals.overtimeMinutes
            },
            week: {
                totalWorkingHours: weekTotals.totalWorkingHours,
                targetHours: weeklyHoursTarget
            },
            month: {
                totalWorkingHours: monthTotals.totalWorkingHours,
                targetHours: monthlyHoursTarget,
                overtimeHours: overtimeThisMonthHours
            },
            targets,
            timeline
        };

        return res.status(200).json(new apiResponse(200, responseMessage?.getDataSuccess('attendance'), summary, {}));
    } catch (error) {
        console.log(error);
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, error));
    }
};

export const break_in = async (req, res) => {
    reqInfo(req);
    let { user } = req.headers;
    try {
        // Create IST timezone boundaries using setHours for database query
        const queryStart = new Date();
        queryStart.setHours(0, 0, 0, 0);

        const queryEnd = new Date();
        queryEnd.setHours(23, 59, 59, 999);

        const attendance: any = await getFirstMatch(attendanceModel, { userId: new ObjectId(user._id), date: { $gte: queryStart, $lt: queryEnd }, isDeleted: false }, {}, {});
        if (!attendance) return res.status(404).json(new apiResponse(404, responseMessage?.getDataNotFound("attendance"), {}, {}));

        const now = new Date();
        let sessions = Array.isArray(attendance.sessions) ? attendance.sessions : [], history = [...attendance.history];
        if (sessions.length === 0) {
            sessions.push({ checkIn: now, checkOut: null, breaks: [] });
        }
        const openIndex = sessions.findIndex((s: any) => s.checkIn && !s.checkOut);
        if (openIndex === -1) {
            sessions.push({ checkIn: now, checkOut: null, breaks: [] });
        }
        const idx = sessions.findIndex((s: any) => s.checkIn && !s.checkOut);
        if (idx === -1) return res.status(400).json(new apiResponse(400, "No open session to start break", {}, {}));

        const session = sessions[idx];
        const latestBreak = Array.isArray(session.breaks) && session.breaks.length > 0 ? session.breaks[session.breaks.length - 1] : null;
        if (latestBreak && latestBreak.breakIn && !latestBreak.breakOut) {
            return res.status(400).json(new apiResponse(400, "Break already in progress", {}, {}));
        }
        session.breaks = Array.isArray(session.breaks) ? session.breaks : [];
        session.breaks.push({ breakIn: now, breakOut: null });
        history.push({ status: ATTENDANCE_HISTORY_STATUS.BREAK_IN })
        const updated = await updateData(attendanceModel, { _id: new ObjectId(attendance._id) }, { history, sessions });
        return res.status(200).json(new apiResponse(200, "Break started", updated, {}));
    } catch (error) {
        console.log(error);
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, error));
    }
};

export const break_out = async (req, res) => {
    reqInfo(req);
    let { user } = req.headers;
    try {
        // Create IST timezone boundaries using setHours for database query
        const queryStart = new Date();
        queryStart.setHours(0, 0, 0, 0);

        const queryEnd = new Date();
        queryEnd.setHours(23, 59, 59, 999);

        const attendance: any = await getFirstMatch(attendanceModel, { userId: new ObjectId(user._id), date: { $gte: queryStart, $lt: queryEnd }, isDeleted: false }, {}, {});
        if (!attendance) return res.status(400).json(new apiResponse(400, responseMessage?.getDataNotFound("attendance"), {}, {}));

        const now = new Date();
        let sessions = Array.isArray(attendance.sessions) ? attendance.sessions : [];
        const idx = sessions.findIndex((s: any) => s.checkIn && !s.checkOut);
        if (idx === -1) return res.status(400).json(new apiResponse(400, "No open session for break out", {}, {}));

        const session = sessions[idx];
        const latestBreakIndex = session.breaks ? [...session.breaks].reverse().findIndex((b: any) => b.breakIn && !b.breakOut) : -1;
        if (latestBreakIndex === -1) return res.status(400).json(new apiResponse(400, "No active break to end", {}, {}));

        // Reverse index to actual index
        const actualIndex = session.breaks.length - 1 - latestBreakIndex;
        session.breaks[actualIndex].breakOut = now;

        // Recompute daily totals
        const computeTotals = async (att: any, sessionsCalc: any[]) => {
            let totalMinutes = 0;
            let breakMinutes = 0;
            for (const s of sessionsCalc) {
                if (s.checkIn && (s.checkOut || s === sessionsCalc[idx])) {
                    const end = s.checkOut || now;
                    totalMinutes += getHoursDifference(s.checkIn, end) * 60;
                    if (Array.isArray(s.breaks)) {
                        for (const b of s.breaks) {
                            if (b.breakIn && (b.breakOut || b === session.breaks[actualIndex])) {
                                const bend = b.breakOut || now;
                                breakMinutes += getHoursDifference(b.breakIn, bend) * 60;
                            }
                        }
                    }
                }
            }
            const totalWorkingHours = totalMinutes / 60;
            const productiveHours = Math.max(0, totalWorkingHours - (breakMinutes / 60));

            // Get company's totalWorkingHours setting
            let companyTotalWorkingHours = 9; // default fallback
            if (user?.companyId) {
                const company = await getFirstMatch(companyModel, { _id: new ObjectId(user.companyId), isDeleted: false }, { totalWorkingHours: 1 }, {});
                if (company?.totalWorkingHours) {
                    companyTotalWorkingHours = company.totalWorkingHours;
                }
            }

            const overtimeMinutes = Math.max(0, (totalWorkingHours - companyTotalWorkingHours) * 60);
            const productionHours = Math.round(productiveHours * 100) / 100;
            return { totalWorkingHours, productiveHours, overtimeMinutes, productionHours, breakMinutes };
        };

        const totals = await computeTotals(attendance, sessions);
        const updated = await updateData(attendanceModel, { _id: new ObjectId(attendance._id) }, {
            sessions,
            totalWorkingHours: totals.totalWorkingHours,
            productiveHours: totals.productiveHours,
            overtimeMinutes: totals.overtimeMinutes,
            productionHours: totals.productionHours,
            breakMinutes: totals.breakMinutes,
            $push: { history: { status: ATTENDANCE_HISTORY_STATUS.BREAK_OUT } }
        });

        return res.status(200).json(new apiResponse(200, "Break ended", updated, {}));
    } catch (error) {
        console.log(error);
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, error));
    }
};

export const manual_punch_out = async (req, res) => {
    reqInfo(req);
    const { user } = req.headers;
    try {
        const { error, value } = manualPunchOutSchema.validate(req.body);
        if (error) return res.status(501).json(new apiResponse(501, error?.details[0]?.message, {}, {}));

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const attendance: any = await getFirstMatch(attendanceModel, { userId: new ObjectId(user._id), date: { $lt: todayStart }, isDeleted: false }, {}, { sort: { date: -1 } });
        if (!attendance) return res.status(400).json(new apiResponse(400, "No attendance record found", {}, {}));
        // Helper: parse a "hh:mm AM/PM" or "HH:MM" string as IST on the given attendance date and return UTC Date
        const parseIstTimeOnAttendanceDate = (attendanceDateUtc: Date, timeStr?: string | null): Date | null => {
            if (!timeStr || typeof timeStr !== 'string') return null;
            const trimmed = timeStr.trim();
            // Accept "hh:mm AM/PM" or "HH:MM" (24-hour)
            const match12 = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
            const match24 = trimmed.match(/^(\d{1,2}):(\d{2})$/);
            let hours: number, minutes: number;
            if (match12) {
                hours = parseInt(match12[1], 10);
                minutes = parseInt(match12[2], 10);
                const period = match12[3].toUpperCase();
                if (period === 'PM' && hours < 12) hours += 12;
                if (period === 'AM' && hours === 12) hours = 0;
            } else if (match24) {
                hours = parseInt(match24[1], 10);
                minutes = parseInt(match24[2], 10);
            } else {
                return null;
            }
            if (Number.isNaN(hours) || Number.isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;

            // Convert the attendance date to IST, set time-of-day there, then convert back to UTC
            const istDate = utcToIst(attendanceDateUtc ? new Date(attendanceDateUtc) : new Date());
            istDate.setHours(hours, minutes, 0, 0);
            return istToUtc(istDate);
        };

        // 2) Find open session (supports both sessions array and legacy checkIn/checkOut)
        let sessions = Array.isArray(attendance.sessions) ? [...attendance.sessions] : [];
        let openSessionIndex = sessions.findIndex((s: any) => s && s.checkIn && !s.checkOut);
        let isLegacyOpen = false;

        if (openSessionIndex === -1) {
            // check last session (maybe last session is open)
            if (sessions.length > 0) {
                const lastIdx = sessions.length - 1;
                const lastSession = sessions[lastIdx];
                if (lastSession && lastSession.checkIn && !lastSession.checkOut) {
                    openSessionIndex = lastIdx;
                }
            }
        }

        if (openSessionIndex === -1) {
            // fallback to legacy fields
            if (attendance.checkIn && !attendance.checkOut) {
                isLegacyOpen = true;
            }
        }

        if (openSessionIndex === -1 && !isLegacyOpen) {
            return res.status(400).json(new apiResponse(400, "No open sessions to punch out", {}, {}));
        }

        // 3) Build punchOutTime (UTC). If customTime provided, interpret it as IST on attendance.date
        const attendanceDateUtc = attendance.date ? new Date(attendance.date) : new Date();
        let punchOutTimeUtc: Date;
        if (value.customTime) {
            const parsed = parseIstTimeOnAttendanceDate(attendanceDateUtc, value.customTime);
            if (!parsed) return res.status(400).json(new apiResponse(400, "Invalid customTime format. Use 'hh:mm AM'/'hh:mm PM' or 'HH:MM'", {}, {}));
            punchOutTimeUtc = parsed;
        } else {
            punchOutTimeUtc = new Date(); // now (UTC)
        }

        // 4) Get checkIn time for comparison
        const checkInTimeUtc = openSessionIndex >= 0 ? new Date(sessions[openSessionIndex].checkIn) : new Date(attendance.checkIn);
        if (punchOutTimeUtc <= checkInTimeUtc) {
            return res.status(400).json(new apiResponse(400, "Punch-out time must be after check-in time", {}, {}));
        }

        // 5) Close any open breaks in that session and set session.checkOut (or attendance.checkOut for legacy)
        if (openSessionIndex >= 0) {
            const session = sessions[openSessionIndex];
            if (Array.isArray(session.breaks)) {
                for (const b of session.breaks) {
                    if (b.breakIn && !b.breakOut) {
                        b.breakOut = punchOutTimeUtc;
                    }
                }
            }
            sessions[openSessionIndex].checkOut = punchOutTimeUtc;
        } else {
            // legacy
            attendance.checkOut = punchOutTimeUtc;
        }

        // 6) Totals calculation helper — uses minute-level accuracy
        const computeTotals = async (attObj: any, companyId: any) => {
            let totalMinutes = 0;
            let breakMinutes = 0;
            const allSessions = Array.isArray(attObj.sessions) && attObj.sessions.length > 0
                ? attObj.sessions
                : (attObj.checkIn && attObj.checkOut ? [{ checkIn: attObj.checkIn, checkOut: attObj.checkOut, breaks: [] }] : []);

            for (const session of allSessions) {
                if (session.checkIn && session.checkOut) {
                    totalMinutes += getMinutesDifference(new Date(session.checkIn), new Date(session.checkOut));
                    if (Array.isArray(session.breaks)) {
                        for (const b of session.breaks) {
                            if (b.breakIn && b.breakOut) {
                                breakMinutes += getMinutesDifference(new Date(b.breakIn), new Date(b.breakOut));
                            } else if (b.breakIn && !b.breakOut) {
                                // if breakOut left open, assume it ended at session.checkOut
                                breakMinutes += getMinutesDifference(new Date(b.breakIn), new Date(session.checkOut));
                            }
                        }
                    }
                }
            }

            const totalWorkingHours = Math.round((totalMinutes / 60) * 100) / 100; // 2 decimals
            const productiveHours = Math.round(Math.max(0, totalWorkingHours - (breakMinutes / 60)) * 100) / 100; // 2 decimals

            // company standard working hours (fallback to 9)
            let companyTotalWorkingHours = 9;
            if (companyId) {
                const company = await getFirstMatch(companyModel, { _id: new ObjectId(companyId), isDeleted: false }, { totalWorkingHours: 1 }, {});
                if (company?.totalWorkingHours) companyTotalWorkingHours = Number(company.totalWorkingHours);
            }

            const overtimeMinutes = Math.max(0, Math.round((totalWorkingHours - companyTotalWorkingHours) * 60));
            const productionHours = productiveHours; // same as productiveHours (rounded)

            return {
                totalWorkingHours,
                productiveHours,
                overtimeMinutes,
                productionHours,
                breakMinutes
            };
        };

        // 7) Get user's companyId (for company working hours)
        const dbUser = await getFirstMatch(userModel, { _id: new ObjectId(user._id), isDeleted: false }, { companyId: 1 }, {});
        const companyId = dbUser?.companyId;

        // 8) Prepare attendance object for totals computation
        const attForCompute = {
            ...((attendance && typeof attendance.toObject === 'function') ? attendance.toObject() : attendance),
            sessions
        };

        const totals = await computeTotals(attForCompute, companyId);

        // 9) Build update object (do NOT touch lateMinutes)
        const updatedRemarks = value.remarks
            ? (attendance.remarks ? `${attendance.remarks}; ${value.remarks}` : value.remarks)
            : attendance.remarks;

        const updateDataObj: any = {
            checkOut: attendance.checkOut || punchOutTimeUtc,
            sessions,
            totalWorkingHours: totals.totalWorkingHours,
            productiveHours: totals.productiveHours,
            overtimeMinutes: totals.overtimeMinutes,
            productionHours: totals.productionHours,
            breakMinutes: totals.breakMinutes,
            remarks: updatedRemarks
            // note: we intentionally DO NOT modify `lateMinutes`
        };

        const response = await updateData(attendanceModel, { _id: attendance._id }, updateDataObj);
        if (!response) return res.status(404).json(new apiResponse(404, responseMessage?.updateDataError("attendance"), {}, {}));

        const baseResponse: any = (response && typeof (response as any).toObject === 'function') ? (response as any).toObject() : response;
        const formattedResponse = {
            ...baseResponse,
            date: formatDateForResponseUtc(baseResponse.date)
        };

        return res.status(200).json(new apiResponse(200, "Manual punch-out successful", formattedResponse, {}));
    } catch (err) {
        console.log(err);
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, err));
    }
};
