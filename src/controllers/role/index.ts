import { apiResponse } from "../../common";
import { roleModel } from "../../database";
import { countData, createData, getDataWithSorting, getFirstMatch, reqInfo, responseMessage, updateData } from "../../helper";
import { addRoleSchema, deleteRoleSchema, editRoleSchema, getRoleSchema } from "../../validation";

const ObjectId = require("mongoose").Types.ObjectId

export const add_role = async (req, res) => {
    reqInfo(req)
    let { user } = req.headers
    try {
        const { error, value } = addRoleSchema.validate(req.body)
        if (error) return res.status(501).json(new apiResponse(501, error?.details[0]?.message, {}, {}))

        value.createdBy = new ObjectId(user._id)
        value.updatedBy = new ObjectId(user._id)

        const isExit = await getFirstMatch(roleModel, { name: value.name, isDeleted: false }, {}, {})
        if (isExit) return res.status(405).json(new apiResponse(405, responseMessage?.dataAlreadyExist("Name"), {}, {}))

        const response = await createData(roleModel, value);

        if (!response) return res.status(404).json(new apiResponse(404, responseMessage?.addDataError, {}, {}))
        return res.status(200).json(new apiResponse(200, responseMessage?.addDataSuccess("Role"), response, {}))
    } catch (error) {
        console.log(error);
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, error))
    }
}

export const edit_role_by_id = async (req, res) => {
    reqInfo(req)
    let { user } = req.headers;
    try {
        const { error, value } = editRoleSchema.validate(req.body)
        if (error) return res.status(501).json(new apiResponse(501, error?.details[0]?.message, {}, {}))

        value.updatedBy = new ObjectId(user._id)

        let isExist = await getFirstMatch(roleModel, { _id: new ObjectId(value.roleId), isDeleted: false }, {}, {});
        if (!isExist) return res.status(405).json(new apiResponse(405, responseMessage.getDataNotFound("Role"), {}, {}));

        isExist = await getFirstMatch(roleModel, { name: value.name, isDeleted: false, _id: { $ne: new ObjectId(value.roleId) } }, {}, {})
        if (isExist) return res.status(405).json(new apiResponse(405, responseMessage?.dataAlreadyExist("Name"), {}, {}))

        const response = await updateData(roleModel, { _id: new ObjectId(value.roleId) }, value, {});
        return res.status(200).json(new apiResponse(200, responseMessage?.updateDataSuccess("Role"), response, {}))
    } catch (error) {
        console.log(error);
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, error))
    }
}

export const delete_role_by_id = async (req, res) => {
    reqInfo(req)
    try {
        const { error, value } = deleteRoleSchema.validate(req.params)
        if (error) return res.status(501).json(new apiResponse(501, error?.details[0]?.message, {}, {}))

        const response = await updateData(roleModel, { _id: new ObjectId(value.id), isDeleted: false }, { isDeleted: true }, {})
        if (!response) return res.status(404).json(new apiResponse(404, responseMessage?.getDataNotFound("Role"), {}, {}))
        return res.status(200).json(new apiResponse(200, responseMessage?.deleteDataSuccess("Role"), response, {}))
    } catch (error) {
        console.log(error);
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, error))
    }
}

export const get_all_role = async (req, res) => {
    reqInfo(req)
    try {
        const { error, value } = deleteRoleSchema.validate(req.query)
        if (error) return res.status(501).json(new apiResponse(501, error?.details[0]?.message, {}, {}))

        let { page, limit, search, activeFilter } = value, criteria: any = {}, options: any = { lean: true };

        criteria.isDeleted = false;

        if (search) {
            criteria.$or = [
                { name: { $regex: search, $options: 'si' } },
            ];
        }

        criteria.isBlocked = activeFilter === true ? true : false

        options.sort = { createdAt: -1 }

        if (page && limit) {
            options.skip = (parseInt(page) - 1) * parseInt(limit);
            options.limit = parseInt(limit);
        }

        const response = await getDataWithSorting(roleModel, criteria, {}, options);
        const totalCount = await countData(roleModel, criteria);

        const stateObj = {
            page: parseInt(page) || 1,
            limit: parseInt(limit) || totalCount,
            page_limit: Math.ceil(totalCount / (parseInt(limit) || totalCount)) || 1,
        };

        return res.status(200).json(new apiResponse(200, responseMessage.getDataSuccess('Role'), {
            role_data: response,
            totalData: totalCount,
            state: stateObj
        }, {}));
    } catch (error) {
        console.log(error);
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, error))
    }
}

export const get_role_by_id = async (req, res) => {
    reqInfo(req)
    try {

        const { error, value } = getRoleSchema.validate(req.params)
        if (error) return res.status(501).json(new apiResponse(501, error?.details[0]?.message, {}, {}))

        const response = await getFirstMatch(roleModel, { _id: new ObjectId(value.id), isDeleted: false }, {}, {})
        if (!response) return res.status(404).json(new apiResponse(404, responseMessage?.getDataNotFound("Role"), {}, {}))

        return res.status(200).json(new apiResponse(200, responseMessage?.getDataSuccess("Role"), response, {}))
    } catch (error) {
        console.log(error);
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, error))
    }
}