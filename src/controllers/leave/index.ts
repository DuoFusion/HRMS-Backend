import { leaveModel, userModel } from "../../database";
import { apiResponse, ROLES, } from "../../common";
import { createData, findOneAndPopulate, getDataWithSorting, countData, getData, getFirstMatch, reqInfo, responseMessage, updateData } from "../../helper";
const { leave } = require("../../database");
import { addLeaveSchema, updateLeaveSchema, deleteLeaveSchema, getAllLeavesSchema, getLeaveByIdSchema } from "../../validation";
import { create } from "domain";
import { log } from "console";
import { object } from "joi";
import { isModuleNamespaceObject } from "util/types";
const ObjectId = require("mongoose").Types.ObjectId;

export const add_Leave = async (req, res) => {
    reqInfo(req);
    try {
        const body = req.body;
        const { error, value } = addLeaveSchema.validate(body);

        if (error) return res.status(501).json(new apiResponse(501, error?.details[0]?.message, {}, {}));

        let isUserExits = await getFirstMatch(userModel, { _id: new ObjectId(req.body.userId), isDeleted: false }, {}, {});
        if (!isUserExits) return res.status(404).json(new apiResponse(404, responseMessage?.getDataNotFound("User"), {}, {}));

        const response = await createData(leaveModel, value);
        if (!response) return res.status(404).json(new apiResponse(404, responseMessage?.addDataError, {}, {}));

        return res.status(200).json(new apiResponse(200, responseMessage?.addDataSuccess('leave'), response, {}));

    } catch (error) {
        console.error(error);
        return res.status(500).json(new apiResponse(500, "Internal Server Error", {}, error));

    }

}

export const update_Leave = async (req, res) => {
    reqInfo(req);
    try {
        const body = req.body;
        const { error, value } = updateLeaveSchema.validate(body);
        if (error) return res.status(501).json(new apiResponse(501, error?.details[0]?.message, {}, {}));

        let isLeaveExit = await getFirstMatch(leaveModel, { _id: new ObjectId(req.body.leaveId), isDeleted: false }, {}, {});

        if (!isLeaveExit) return res.status(404).json(new apiResponse(404, responseMessage?.getDataNotFound('leave'), {}, {}));

        const response = await updateData(leaveModel, { _id: new ObjectId(req.body.leaveId) }, value, {});
        return res.status(200).json(new apiResponse(200, responseMessage?.updateDataSuccess('leave'), response, {}));

    } catch (error) {
        console.error(error);
        return res.status(500).json(new apiResponse(500, "Internal Server Error", {}, error));
    }
}

export const Delete_leave = async (req, res) => {
    reqInfo(req);
    try {
        const leaveId = req.params.id;
        const { error, value } = deleteLeaveSchema.validate({ leaveId });
        if (error) return res.status(501).json(new apiResponse(501, error?.details[0]?.message, {}, {}));

        const response = await updateData(leaveModel, { _id: new ObjectId(value.leaveId) }, { isDeleted: true }, {});
        if (!response) return res.status(404).json(new apiResponse(404, responseMessage?.getDataNotFound('leave'), {}, {}))
        return res.status(200).json(new apiResponse(200, responseMessage?.deleteDataSuccess('leave'), response, {}));

    } catch (error) {
        console.error(error);
        return res.status(500).json(new apiResponse(500, "Internal Server Error", {}, error));

    }
}

export const GetAllLeaves = async (req, res) => {
    reqInfo(req);
    try {
        const { error, value } = getAllLeavesSchema.validate(req.query);
        if (error) return res.status(501).json(new apiResponse(501, error?.details[0]?.message, {}, {}));

        const criteria: any = { isDeleted: false }, options: any = {}, { page = 1, limit = 10, roleFilter, activeFilter, search } = value;

        criteria.role = { ne: ROLES.ADMIN };
        options.sort = { createdAt: -1 };
        if (roleFilter) criteria.role = roleFilter;
        if (activeFilter) criteria.status = activeFilter;

        let match = { isDeleted: false };

        if (roleFilter) match["status"] = roleFilter;
        if (activeFilter) match["type"] = activeFilter;

        if (search) {
            criteria.$or = [
                { reason: { $regex: search, $options: "i" } },
                { "userData.name": { $regex: search, $options: "i" } }
            ];
        }

        let populate = [
            { path: "userId", select: "name email role" },
            { path: "approvedBy", select: "name email role" }
        ];

        const skip = (page - 1) * limit;

        const response = await getDataWithSorting(leaveModel, criteria, '-password', options);
        const totalCount = await countData(leaveModel, match);

        return res.status(200).json(new apiResponse(200, responseMessage?.getDataSuccess("Leaves"), {
            leave_data: response || [],
            totalPages: Math.ceil(totalCount / limit),
            currentPage: page,
            totalCount
        }, {})
        );

    } catch (error) {
        console.error(error);
        return res.status(500).json(new apiResponse(500, "Internal Server Error", {}, error));
    }
};


export const GetLeaveById = async (req, res) => {
    reqInfo(req);
    try {
        const { error, value } = getLeaveByIdSchema.validate(req.params);
        if (error) return res.status(501).json(new apiResponse(501, error?.details[0]?.message, {}, {}));

        const response = await getFirstMatch(leaveModel, { _id: new ObjectId(value.id), isDeleted: false }, {});
        if (!response) return res.status(404).json(new apiResponse(404, responseMessage?.getDataNotFound('leave'), {}, {}));
        return res.status(200).json(new apiResponse(200, responseMessage?.getDataSuccess('leave'), response, {}));
    } catch (error) {
        console.error(error);
        return res.status(500).json(new apiResponse(500, "Internal Server Error", {}, error));
    }
}