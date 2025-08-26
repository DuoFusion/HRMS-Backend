import { attendanceModel, userModel, companyModel, holidayModel } from "../../database";
import { apiResponse, ROLES } from "../../common";
import { computeLateMinutesIst, countData, createData, findAllWithPopulateWithSorting, formatDateForResponse, formatTimeForResponse, getDataWithSorting, getEndOfDayIst, getFirstMatch, getHoursDifference, getStartOfDayIst, parseIstTimeStringToUtcToday, reqInfo, responseMessage, updateData } from "../../helper";
import { checkInSchema, checkOutSchema, manualPunchOutSchema, getAttendanceSchema, getAttendanceByIdSchema, updateAttendanceSchema, deleteAttendanceSchema } from "../../validation";

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
        // Build session to append
        const newSession = {
            checkIn: currentTime,
            checkOut: null,
            breaks: [] as any[]
        } as any;

        const attendanceData: any = {
            userId: new ObjectId(user._id),
            date: today,
            status,
            lateMinutes,
            remarks: value.remarks || null
        };

        let response;
        if (existingAttendance) {
            // Append new session
            const sessions = Array.isArray(existingAttendance.sessions) ? existingAttendance.sessions : [];
            sessions.push(newSession);
            response = await updateData(attendanceModel, { _id: new ObjectId(existingAttendance._id) }, {
                ...attendanceData,
                // keep legacy top-level for first session of the day
                checkIn: existingAttendance.checkIn || currentTime,
                sessions
            });
        } else {
            response = await createData(attendanceModel, {
                ...attendanceData,
                checkIn: currentTime,
                sessions: [newSession]
            });
        }

        if (!response) return res.status(404).json(new apiResponse(404, responseMessage?.addDataError, {}, {}));

        const baseResponse: any = (response && typeof (response as any).toObject === 'function') ? (response as any).toObject() : response;
        const formattedResponse = {
            ...baseResponse,
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

        if (!attendance) return res.status(400).json(new apiResponse(400, "No check-in record found for today", {}, {}));

        // Determine open session
        let sessions = Array.isArray(attendance.sessions) ? attendance.sessions : [];
        let hasSessions = sessions.length > 0;
        let openSessionIndex = hasSessions ? sessions.findIndex((s: any) => s && s.checkIn && !s.checkOut) : -1;

        if (openSessionIndex === -1 && (!attendance.checkIn || attendance.checkOut)) {
            return res.status(400).json(new apiResponse(400, "Already checked out for all sessions today", {}, {}));
        }

        const currentTime = new Date();
        if (openSessionIndex >= 0) {
            sessions[openSessionIndex].checkOut = currentTime;
        } else {
            attendance.checkOut = currentTime;
        }

        const computeTotals = (att: any) => {
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
            const overtimeMinutes = Math.max(0, (totalWorkingHours - 9) * 60);
            const productionHours = Math.round(productiveHours * 100) / 100;
            return { totalWorkingHours, productiveHours, overtimeMinutes, productionHours, breakMinutes };
        };

        const totals = computeTotals({ ...attendance.toObject?.() ?? attendance, sessions });
        const updateDataObj: any = {
            checkOut: attendance.checkOut || currentTime,
            sessions,
            totalWorkingHours: totals.totalWorkingHours,
            productiveHours: totals.productiveHours,
            overtimeMinutes: totals.overtimeMinutes,
            productionHours: totals.productionHours,
            breakMinutes: totals.breakMinutes,
            remarks: value.remarks || attendance.remarks
        };

        const response = await updateData(attendanceModel, { _id: attendance._id }, updateDataObj);
        if (!response) return res.status(404).json(new apiResponse(404, responseMessage?.updateDataError("attendance"), {}, {}));

        const baseResponse2: any = (response && typeof (response as any).toObject === 'function') ? (response as any).toObject() : response;
        const formattedResponse = {
            ...baseResponse2,
            date: formatDateForResponse(baseResponse2.date)
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

        options.sort = { createdAt: -1 }

        if (user.role !== ROLES.ADMIN) criteria.userId = new ObjectId(user._id)

        if (userFilter) criteria.userId = new ObjectId(userFilter)

        if (dateFilter) options.sort = dateFilter === "asc" ? { createdAt: 1 } : { createdAt: -1 }

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
            date: formatDateForResponse(attendance.date),
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
            checkIn: formatTimeForResponse(response.checkIn),
            checkOut: formatTimeForResponse(response.checkOut),
            date: formatDateForResponse(response.date),
            sessions: Array.isArray((response as any).sessions) ? (response as any).sessions.map((s: any) => ({
                ...s,
                checkIn: formatTimeForResponse(s.checkIn),
                checkOut: formatTimeForResponse(s.checkOut),
                breaks: Array.isArray(s.breaks) ? s.breaks.map((b: any) => ({
                    ...b,
                    breakIn: formatTimeForResponse(b.breakIn),
                    breakOut: formatTimeForResponse(b.breakOut)
                })) : []
            })) : []
        };

        return res.status(200).json(new apiResponse(200, responseMessage?.getDataSuccess("attendance"), formattedResponse, {}));
    } catch (error) {
        console.log(error);
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, error));
    }
};

export const updateAttendance = async (req, res) => {
    reqInfo(req);
    try {
        const { error, value } = updateAttendanceSchema.validate(req.body);
        if (error) return res.status(501).json(new apiResponse(501, error?.details[0]?.message, {}, {}));

        const { id } = req.params;

        const existingAttendance = await getFirstMatch(attendanceModel, { _id: new ObjectId(id), isDeleted: false }, {}, {});

        if (!existingAttendance) return res.status(404).json(new apiResponse(404, responseMessage?.getDataNotFound("attendance"), {}, {}));

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

        const response = await updateData(attendanceModel, { _id: new ObjectId(id) }, updateData);

        if (!response) return res.status(404).json(new apiResponse(404, responseMessage?.updateDataError("attendance"), {}, {}));

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

// Get only today's attendance for current user; return {} if not found
export const get_today_attendance = async (req, res) => {
    reqInfo(req);
    let { user } = req.headers;
    try {
        const start = getStartOfDayIst();
        const end = getEndOfDayIst();
        const attendance: any = await getFirstMatch(attendanceModel, { userId: new ObjectId(user._id), date: { $gte: start, $lt: end }, isDeleted: false }, {}, {});

        // Get last attendance to check punch-out status
        const lastAttendance: any = await getFirstMatch(attendanceModel, { userId: new ObjectId(user._id), isDeleted: false }, {}, { sort: { date: -1 } });
        console.log("lastAttendance => ",lastAttendance);
        let lastPunchOut = false;
        if (lastAttendance) {
            const lastBase = (lastAttendance && typeof lastAttendance.toObject === 'function') ? lastAttendance.toObject() : lastAttendance;
            const lastSessions = Array.isArray(lastBase.sessions) && lastBase.sessions.length > 0 ? lastBase.sessions : (lastBase.checkIn ? [{ checkIn: lastBase.checkIn, checkOut: lastBase.checkOut, breaks: [] }] : []);
            
            const lastSession = lastSessions.length > 0 ? lastSessions[lastSessions.length - 1] : null;
            lastPunchOut = lastSession ? (lastSession.checkIn && lastSession.checkOut) : (lastBase.checkIn && lastBase.checkOut);
        }

        if (!attendance) return res.status(200).json(new apiResponse(200, responseMessage?.getDataSuccess('attendance'), { lastPunchOut: !!lastPunchOut }, {}));
        
        const base = (attendance && typeof attendance.toObject === 'function') ? attendance.toObject() : attendance;
        const formatted = {
            ...base,
            date: formatDateForResponse(base.date),
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
        const startToday = getStartOfDayIst(now);
        const endToday = getEndOfDayIst(now);

        const startOfWeek = (() => {
            const d = new Date(now);
            const day = d.getDay();
            const diff = (day === 0 ? 6 : day - 1);
            d.setDate(d.getDate() - diff);
            return getStartOfDayIst(d);
        })();
        const endOfWeek = getEndOfDayIst(new Date(startOfWeek.getTime() + 6 * 24 * 60 * 60 * 1000));

        const startOfMonth = (() => {
            const d = new Date(now.getFullYear(), now.getMonth(), 1);
            return getStartOfDayIst(d);
        })();
        const endOfMonth = getEndOfDayIst(new Date(now.getFullYear(), now.getMonth() + 1, 0));

        const loadRange = async (from: Date, to: Date) => {
            const list = await getDataWithSorting(
                attendanceModel,
                { userId: new ObjectId(user._id), date: { $gte: from, $lte: to }, isDeleted: false },
                {},
                { sort: { date: 1 } }
            );
            return list || [];
        };

        const todayEntry: any = await getFirstMatch(attendanceModel, { userId: new ObjectId(user._id), date: { $gte: startToday, $lt: endToday }, isDeleted: false }, {}, {});
        const weekEntries: any[] = await loadRange(startOfWeek, endOfWeek);
        const monthEntries: any[] = await loadRange(startOfMonth, endOfMonth);

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
            const overtimeMinutes = Math.max(0, (totalWorkingHours - 9) * 60);
            const productionHours = Math.round(productiveHours * 100) / 100;
            return { totalWorkingHours, productiveHours, overtimeMinutes, productionHours, breakMinutes };
        };

        const todayTotals = todayEntry ? computeFromSessions([todayEntry]) : { totalWorkingHours: 0, productiveHours: 0, overtimeMinutes: 0, productionHours: 0, breakMinutes: 0 };
        const weekTotals = computeFromSessions(weekEntries);
        const monthTotals = computeFromSessions(monthEntries);

        // Dynamic targets based on company working hours and working days (excludes weekends and holidays)
        let dailyTargetHours = 9; // default
        const dbUser = await getFirstMatch(userModel, { _id: new ObjectId(user._id), isDeleted: false }, { companyId: 1 }, {});
        if (dbUser?.companyId) {
            const company: any = await getFirstMatch(companyModel, { _id: new ObjectId(dbUser.companyId), isDeleted: false }, { workingHours: 1 }, {});
            const startStr: string | undefined = company?.workingHours?.start;
            const endStr: string | undefined = company?.workingHours?.end;
            if (startStr && endStr) {
                const s = parseIstTimeStringToUtcToday(startStr);
                const e = parseIstTimeStringToUtcToday(endStr);
                if (s && e) {
                    dailyTargetHours = Math.max(0, getHoursDifference(s, e));
                }
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
                start: formatTimeForResponse(seg.start),
                end: formatTimeForResponse(seg.end)
            }));
        })();

        // Targets (dynamic based on company and calendar)
        const targets = {
            dailyHoursTarget: dailyTargetHours,
            weeklyHoursTarget: weeklyHoursTarget,
            monthlyHoursTarget: monthlyHoursTarget
        } as any;

        const summary = {
            now: formatTimeForResponse(now),
            date: formatDateForResponse(now),
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
        const today = getStartOfDayIst();
        const tomorrow = getEndOfDayIst();

        const attendance: any = await getFirstMatch(attendanceModel, { userId: new ObjectId(user._id), date: { $gte: today, $lt: tomorrow }, isDeleted: false }, {}, {});
        if (!attendance) return res.status(404).json(new apiResponse(404, responseMessage?.getDataNotFound("attendance"), {}, {}));

        const now = new Date();
        let sessions = Array.isArray(attendance.sessions) ? attendance.sessions : [];
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

        const updated = await updateData(attendanceModel, { _id: new ObjectId(attendance._id) }, { sessions });
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
        const today = getStartOfDayIst();
        const tomorrow = getEndOfDayIst();

        const attendance: any = await getFirstMatch(attendanceModel, { userId: new ObjectId(user._id), date: { $gte: today, $lt: tomorrow }, isDeleted: false }, {}, {});
        if (!attendance) return res.status(404).json(new apiResponse(404, responseMessage?.getDataNotFound("attendance"), {}, {}));

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
        const computeTotals = (att: any, sessionsCalc: any[]) => {
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
            const overtimeMinutes = Math.max(0, (totalWorkingHours - 9) * 60);
            const productionHours = Math.round(productiveHours * 100) / 100;
            return { totalWorkingHours, productiveHours, overtimeMinutes, productionHours, breakMinutes };
        };

        const totals = computeTotals(attendance, sessions);
        const updated = await updateData(attendanceModel, { _id: new ObjectId(attendance._id) }, {
            sessions,
            totalWorkingHours: totals.totalWorkingHours,
            productiveHours: totals.productiveHours,
            overtimeMinutes: totals.overtimeMinutes,
            productionHours: totals.productionHours,
            breakMinutes: totals.breakMinutes
        });

        return res.status(200).json(new apiResponse(200, "Break ended", updated, {}));
    } catch (error) {
        console.log(error);
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, error));
    }
};

export const manual_punch_out = async (req, res) => {
    reqInfo(req);
    let { user } = req.headers;
    try {
        const { error, value } = manualPunchOutSchema.validate(req.body);
        if (error) return res.status(501).json(new apiResponse(501, error?.details[0]?.message, {}, {}));

        const today = getStartOfDayIst();

        const attendance: any = await getFirstMatch(attendanceModel, { userId: new ObjectId(user._id), isDeleted: false }, {}, { sort: { date: -1 } });
        if (!attendance) return res.status(400).json(new apiResponse(400, "No attendance record found for today", {}, {}));

        let sessions = Array.isArray(attendance.sessions) ? attendance.sessions : [];
        let hasSessions = sessions.length > 0;
        let openSessionIndex = hasSessions ? sessions.findIndex((s: any) => s && s.checkIn && !s.checkOut) : -1;

        if (openSessionIndex === -1 && (!attendance.checkIn || attendance.checkOut)) return res.status(400).json(new apiResponse(400, "No open sessions to punch out", {}, {}));

        let punchOutTime: Date;
        if (value.customTime) {
            const timeStr = value.customTime;
            const [timePart, period] = timeStr.split(' ');
            const [hours, minutes] = timePart.split(':').map(Number);
            
            let hour24 = hours;
            if (period === 'PM' && hours !== 12) hour24 = hours + 12;
            if (period === 'AM' && hours === 12) hour24 = 0;
            
            punchOutTime = new Date(today);
            punchOutTime.setHours(hour24, minutes, 0, 0);
        }
        
        let checkInTime: Date;
        if (openSessionIndex >= 0) {
            checkInTime = new Date(sessions[openSessionIndex].checkIn);
        } else {
            checkInTime = new Date(attendance.checkIn);
        }
        
        if (punchOutTime <= checkInTime) {
            return res.status(400).json(new apiResponse(400, "Punch-out time must be after check-in time", {}, {}));
        }
        
        if (openSessionIndex >= 0) {
            const session = sessions[openSessionIndex];
            if (Array.isArray(session.breaks)) {
                for (const b of session.breaks) {
                    if (b.breakIn && !b.breakOut) {
                        b.breakOut = punchOutTime;
                    }
                }
            }
            sessions[openSessionIndex].checkOut = punchOutTime;
        } else {
            attendance.checkOut = punchOutTime;
        }

        const computeTotals = (att: any) => {
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
            const overtimeMinutes = Math.max(0, (totalWorkingHours - 9) * 60);
            const productionHours = Math.round(productiveHours * 100) / 100;
            return { totalWorkingHours, productiveHours, overtimeMinutes, productionHours, breakMinutes };
        };

        const totals = computeTotals({ ...attendance.toObject?.() ?? attendance, sessions });
        const updateDataObj: any = {
            checkOut: attendance.checkOut || punchOutTime,
            sessions,
            totalWorkingHours: totals.totalWorkingHours,
            productiveHours: totals.productiveHours,
            overtimeMinutes: totals.overtimeMinutes,
            productionHours: totals.productionHours,
            breakMinutes: totals.breakMinutes,
            remarks: value.remarks || attendance.remarks
        };

        const response = await updateData(attendanceModel, { _id: attendance._id }, updateDataObj);
        if (!response) return res.status(404).json(new apiResponse(404, responseMessage?.updateDataError("attendance"), {}, {}));

        const baseResponse: any = (response && typeof (response as any).toObject === 'function') ? (response as any).toObject() : response;
        const formattedResponse = {
            ...baseResponse,
            date: formatDateForResponse(baseResponse.date)
        };

        return res.status(200).json(new apiResponse(200, "Manual punch-out successful", formattedResponse, {}));
    } catch (error) {
        console.log(error);
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, error));
    }
};