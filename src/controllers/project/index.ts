import { projectModel, userModel } from "../../database";
import { apiResponse, ROLES } from "../../common";
import { countData, createData, reqInfo, responseMessage, updateData, findAllWithPopulateWithSorting, findOneAndPopulate, getFirstMatch } from "../../helper";
import { addProjectSchema, deleteProjectSchema, getAllProjectsSchema, getProjectByIdSchema, updateProjectSchema } from "../../validation";

const ObjectId = require('mongoose').Types.ObjectId;

export const add_project = async (req, res) => {
    reqInfo(req)
    const { user } = req.headers

    try {
        const { error, value } = addProjectSchema.validate(req.body);
        if (error) return res.status(501).json(new apiResponse(501, error?.details[0]?.message, {}, {}));

        if (user.role !== ROLES.ADMIN) value.userId = new ObjectId(user._id)

        if (user.role !== ROLES.SUPER_ADMIN) value.companyId = new ObjectId(user.companyId)
        if (user.role === ROLES.SUPER_ADMIN) {
            let user = await getFirstMatch(userModel, { _id: new ObjectId(value.userId) }, {}, {})
            if (!user) return res.status(404).json(new apiResponse(404, responseMessage?.getDataNotFound('Index'), {}, {}));
        }

        const response = await createData(projectModel, value);

        if (!response) return res.status(404).json(new apiResponse(404, responseMessage?.addDataError, {}, {}))
        return res.status(200).json(new apiResponse(200, responseMessage.addDataSuccess('project'), response, {}));
    } catch (error) {
        console.log(error);
        return res.status(500).json(new apiResponse(500, responseMessage.internalServerError, {}, error));
    }
}

export const edit_project_by_id = async (req, res) => {
    reqInfo(req)
    try {
        const { error, value } = updateProjectSchema.validate(req.body);
        if (error) return res.status(501).json(new apiResponse(501, error?.details[0]?.message, {}, {}));

        const response = await updateData(projectModel, { _id: new ObjectId(value.projectId), isDeleted: false }, value, {});
        if (!response) return res.status(404).json(new apiResponse(404, responseMessage?.getDataNotFound('project'), {}, {}))
        return res.status(200).json(new apiResponse(200, responseMessage?.getDataSuccess('project'), response, {}))
    } catch (error) {
        console.error(error)
        return res.status(500).json(new apiResponse(500, responseMessage.internalServerError, {}, error))
    }
}

export const delete_project_by_id = async (req, res) => {
    reqInfo(req);
    try {
        const { error, value } = deleteProjectSchema.validate(req.params);
        if (error) return res.status(400).json(new apiResponse(400, error?.details[0]?.message, {}, {}));

        const response = await updateData(projectModel, { _id: new ObjectId(value.id), isDeleted: false }, { isDeleted: true }, { new: true });
        if (!response) return res.status(404).json(new apiResponse(404, responseMessage.getDataNotFound("project"), {}, {}));

        return res.status(200).json(new apiResponse(200, responseMessage.deleteDataSuccess("project"), response, {}));
    } catch (error) {
        console.log(error);
        return res.status(500).json(new apiResponse(500, responseMessage.internalServerError, {}, error));
    }
};

export const get_all_project = async (req, res) => {
    reqInfo(req)
    let { user } = req.headers
    console.log('user', user);

    try {
        const { error, value } = getAllProjectsSchema.validate(req.query)
        if (error) return res.status(400).json(new apiResponse(400, error?.details[0]?.message, {}, {}))

        let { page, limit, search, statusFilter, startDate, endDate, sortOrder, activeFilter, userFilter } = value, criteria: any = {}, options: any = { lean: true };

        if (user.role === ROLES.ADMIN || user.role === ROLES.HR) {
            criteria.companyId = new ObjectId(user.companyId);
            console.log('id', user.role);

        } else if (user.role === ROLES.PROJECT_MANAGER || user.role === ROLES.EMPLOYEE) {
            criteria.companyId = new ObjectId(user._id);
        }

        criteria.isDeleted = false

        if (statusFilter) criteria.status = statusFilter

        if (userFilter) criteria.userIds = { $in: [new ObjectId(userFilter)] }

        if (sortOrder) options.sort = { createdAt: sortOrder === 'asc' ? 1 : -1 }

        if (activeFilter === false) criteria.isBlocked = false
        if (activeFilter === true) criteria.isBlocked = true

        if (startDate && endDate) criteria.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) }

        if (search) {
            criteria.$or = [
                { name: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } },
                { status: { $regex: search, $options: "i" } },
            ]
        }

        if (page && limit) {
            options.skip = (parseInt(page) - 1) * parseInt(limit)
            options.limit = parseInt(limit)
        }

        let populateModel = [{ path: 'userIds', select: 'fullName email role' }]
        const response = await findAllWithPopulateWithSorting(projectModel, criteria, {}, options, populateModel)
        console.log(projectModel, criteria);

        const totalCount = await countData(projectModel, criteria)

        const stateObj = {
            page: parseInt(page) || 1,
            limit: parseInt(limit) || totalCount,
            page_limit: Math.ceil(totalCount / (parseInt(limit) || totalCount)) || 1,
        }

        return res.status(200).json(new apiResponse(200, responseMessage?.getDataSuccess("projects"), {
            project_data: response,
            totalData: totalCount,
            state: stateObj
        }, {}))
    } catch (error) {
        console.log(error)
        return res.status(500).json(new apiResponse(500, responseMessage.internalServerError, {}, error))
    }
}

export const get_project_by_id = async (req, res) => {
    reqInfo(req)
    try {
        const { error, value } = getProjectByIdSchema.validate(req.params)
        if (error) return res.status(501).json(new apiResponse(501, error?.details[0]?.message, {}, {}))

        let populateModel = [{ path: 'userIds', select: 'fullName email role' }]

        const response = await findOneAndPopulate(projectModel, { _id: new ObjectId(value.id), isDeleted: false }, {}, {}, populateModel)
        if (!response) return res.status(404).json(new apiResponse(404, responseMessage?.getDataNotFound("project"), {}, {}))

        return res.status(200).json(new apiResponse(200, responseMessage?.getDataSuccess("project"), response, {}))
    } catch (error) {
        console.log(error);
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, error))
    }
}

