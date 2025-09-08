import { leaveModel } from "../../database";
import { apiResponse, LEAVE_STATUS, ROLES } from "../../common";
import { createData, countData, getFirstMatch, reqInfo, responseMessage, updateData, findAllWithPopulateWithSorting } from "../../helper";
import { addLeaveSchema, updateLeaveSchema, deleteLeaveSchema, getAllLeavesSchema, getLeaveByIdSchema } from "../../validation";

const ObjectId = require("mongoose").Types.ObjectId;

export const add_leave = async (req, res) => {
    reqInfo(req);
    let { user } = req.headers
    try {
        const { error, value } = addLeaveSchema.validate(req.body);
        if (error) return res.status(501).json(new apiResponse(501, error?.details[0]?.message, {}, {}));

        if (user.role !== ROLES.ADMIN) value.userId = new ObjectId(user._id)
        
        if(value.status === LEAVE_STATUS.PENDING) value.approvedBy = null
        if(value.status === LEAVE_STATUS.APPROVED || value.status === LEAVE_STATUS.REJECTED ) value.approvedBy = new ObjectId(user._id)
        
        const response = await createData(leaveModel, value);
        if (!response) return res.status(404).json(new apiResponse(404, responseMessage?.addDataError, {}, {}));
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
        
        if(value.status === LEAVE_STATUS.PENDING) value.approvedBy = null
        if (value.status === LEAVE_STATUS.APPROVED || value.status === LEAVE_STATUS.REJECTED) value.approvedBy = new ObjectId(user._id)

        const response = await updateData(leaveModel, { _id: new ObjectId(value.leaveId) }, value, {});
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