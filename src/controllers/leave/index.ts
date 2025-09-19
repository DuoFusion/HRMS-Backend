import { leaveModel, userModel } from "../../database";
import { apiResponse, LEAVE_STATUS, ROLES } from "../../common";
import { SOCKET_EVENT } from "../../helper/socket_events";
import { createData, countData, getFirstMatch, reqInfo, responseMessage, updateData, findAllWithPopulateWithSorting, send_real_time_update, create_and_emit_notification } from "../../helper";
import { addLeaveSchema, updateLeaveSchema, deleteLeaveSchema, getAllLeavesSchema, getLeaveByIdSchema } from "../../validation";

const ObjectId = require("mongoose").Types.ObjectId;

export const add_leave = async (req, res) => {
    reqInfo(req);
    let { user } = req.headers
    try {
        const { error, value } = addLeaveSchema.validate(req.body);
        if (error) return res.status(501).json(new apiResponse(501, error?.details[0]?.message, {}, {}));

        if (user.role !== ROLES.ADMIN) value.userId = new ObjectId(user._id)

        if (value.status === LEAVE_STATUS.PENDING) value.approvedBy = null
        if (value.status === LEAVE_STATUS.APPROVED || value.status === LEAVE_STATUS.REJECTED) value.approvedBy = new ObjectId(user._id)

        const response = await createData(leaveModel, value);
        if (!response) return res.status(404).json(new apiResponse(404, responseMessage?.addDataError, {}, {}));

        const notifyRoles = [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR];
        const users = await userModel.find({ role: { $in: notifyRoles }, isDeleted: false, isBlocked: false }, { _id: 1 }).lean();
        for (const allUser of users) {
            await create_and_emit_notification({
                userId: allUser._id,
                companyId: allUser?.companyId,
                title: 'New Leave Request',
                message: `${user.fullName || 'An employee'} submitted a leave request`,
                eventType: SOCKET_EVENT.NOTIFICATION_NEW,
                meta: { type: 'leave', action: 'created', leaveId: String(response._id), byUserId: String((user as any)?._id) }
            })
        }
        return res.status(200).json(new apiResponse(200, responseMessage?.addDataSuccess('Leave'), response, {}));
    } catch (error) {
        console.error(error);
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, error));
    }
}

export const update_leave = async (req, res) => {
    reqInfo(req);
    let { user } = req.headers
    try {
        const { error, value } = updateLeaveSchema.validate(req.body);
        if (error) return res.status(501).json(new apiResponse(501, error?.details[0]?.message, {}, {}));

        let isLeaveExit = await getFirstMatch(leaveModel, { _id: new ObjectId(value.leaveId), isDeleted: false }, {}, {});
        if (!isLeaveExit) return res.status(404).json(new apiResponse(404, responseMessage?.getDataNotFound('Leave'), {}, {}));

        if (value.status === LEAVE_STATUS.PENDING) value.approvedBy = null
        if (value.status === LEAVE_STATUS.APPROVED || value.status === LEAVE_STATUS.REJECTED) value.approvedBy = new ObjectId(user._id)

        const response = await updateData(leaveModel, { _id: new ObjectId(value.leaveId) }, value, {});

        if (value.status === LEAVE_STATUS.APPROVED || value.status === LEAVE_STATUS.REJECTED) {
            await create_and_emit_notification({
                userId: isLeaveExit.userId,
                title: value.status === LEAVE_STATUS.APPROVED ? "Leave Approved" : "Leave Rejected",
                message: `Your leave request has been ${value.status}.`,
                eventType: SOCKET_EVENT.NOTIFICATION_NEW,
                meta: {
                    type: "leave",
                    action: "status",
                    status: value.status,
                    leaveId: String(isLeaveExit._id),
                    byUserId: String(user._id)
                }
            });
        }
        return res.status(200).json(new apiResponse(200, responseMessage?.updateDataSuccess('Leave'), response, {}));
    } catch (error) {
        console.error(error);
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, error));
    }
}

export const delete_leave_by_id = async (req, res) => {
    reqInfo(req);
    try {
        const { error, value } = deleteLeaveSchema.validate(req.params);
        if (error) return res.status(501).json(new apiResponse(501, error?.details[0]?.message, {}, {}));

        const response = await updateData(leaveModel, { _id: new ObjectId(value.id) }, { isDeleted: true }, {});
        if (!response) return res.status(404).json(new apiResponse(404, responseMessage?.getDataNotFound('Leave'), {}, {}))
        return res.status(200).json(new apiResponse(200, responseMessage?.deleteDataSuccess('Leave'), {}, {}));

    } catch (error) {
        console.error(error);
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, error));
    }
}

export const get_all_leaves = async (req, res) => {
    reqInfo(req);
    let { user } = req.headers
    try {
        const { error, value } = getAllLeavesSchema.validate(req.query);
        if (error) return res.status(501).json(new apiResponse(501, error?.details[0]?.message, {}, {}));

        let criteria: any = { isDeleted: false }, options: any = {}, { page, limit, search, userFilter, typeFilter, statusFilter, startDate, endDate, activeFilter } = value;

        if (user.role === ROLES.PROJECT_MANAGER || user.role === ROLES.EMPLOYEE) criteria.userId = new ObjectId(user._id)

        options.sort = { createdAt: -1 }
        if (userFilter) criteria.userId = userFilter;
        if (typeFilter) criteria.type = typeFilter;
        if (statusFilter) criteria.status = statusFilter;
        if (startDate && endDate) criteria.startDate = { $gte: new Date(startDate), $lte: new Date(endDate) }
        if (activeFilter === true) criteria.isBlocked = true
        if (activeFilter === false) criteria.isBlocked = false
        if (search) {
            criteria.$or = [
                { reason: { $regex: search, $options: "i" } }
            ];
        }

        let populate = [
            { path: "userId", select: "fullName email role profilePhoto" },
            { path: "approvedBy", select: "fullName email role profilePhoto" }
        ];

        if (page && limit) {
            options.skip = (parseInt(page) - 1) * parseInt(limit);
            options.limit = parseInt(limit);
        }

        const response = await findAllWithPopulateWithSorting(leaveModel, criteria, {}, options, populate);
        const totalCount = await countData(leaveModel, criteria);

        const stateObj = {
            page: parseInt(page) || 1,
            limit: parseInt(limit) || totalCount,
            page_limit: Math.ceil(totalCount / (parseInt(limit) || totalCount)) || 1,
        };

        return res.status(200).json(new apiResponse(200, responseMessage?.getDataSuccess("Leaves"), {
            leave_data: response || [],
            totalData: totalCount,
            state: stateObj
        }, {}));

    } catch (error) {
        console.error(error);
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, error));
    }
};


export const get_leave_by_id = async (req, res) => {
    reqInfo(req);
    try {
        const { error, value } = getLeaveByIdSchema.validate(req.params);
        if (error) return res.status(501).json(new apiResponse(501, error?.details[0]?.message, {}, {}));

        const response = await getFirstMatch(leaveModel, { _id: new ObjectId(value.id), isDeleted: false }, {});
        if (!response) return res.status(404).json(new apiResponse(404, responseMessage?.getDataNotFound('Leave'), {}, {}));
        return res.status(200).json(new apiResponse(200, responseMessage?.getDataSuccess('Leave'), response, {}));
    } catch (error) {
        console.error(error);
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, error));
    }
}