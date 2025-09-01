import { taskModel } from "../../database";
import { apiResponse, ROLES } from "../../common";
import { countData, createData, getFirstMatch, reqInfo, responseMessage, updateData, findAllWithPopulateWithSorting, findOneAndPopulate } from "../../helper";
import { addTaskSchema, deleteTaskSchema, getAllTasksSchema, getTaskByIdSchema, updateTaskSchema } from "../../validation";
import { ObjectId } from "mongoose";

const ObjectId = require('mongoose').Types.ObjectId;

export const add_task = async (req, res) => {
    const { user } = req.headers;
    try {
        const { error, value } = addTaskSchema.validate(req.body);
        if (error) return res.status(501).json(new apiResponse(501, error?.details[0]?.message, {}, {}));

        if (!value.status) {
            value.status = 'pending';
        }

        value.statusHistory = [{
            fromStatus: null,
            toStatus: value.status,
            userId: new ObjectId(user._id),
            changeDate: new Date()
        }];

        value.userId = new ObjectId(user._id);

        if (value.comment) {
            value.comments = [{
                text: value.comment,
                userId: new ObjectId(req.headers.user._id),
                createdAt: new Date()
            }];
        }

        const response = await createData(taskModel, value);

        if (!response) return res.status(404).json(new apiResponse(404, responseMessage?.addDataError, {}, {}))
        return res.status(200).json(new apiResponse(200, responseMessage.addDataSuccess('task'), response, {}));
    } catch (error) {
        console.log(error);
        return res.status(500).json(new apiResponse(500, responseMessage.internalServerError, {}, error));
    }
}

export const edit_task_by_id = async (req, res) => {
    reqInfo(req)
    try {
        const { error, value } = updateTaskSchema.validate(req.body);
        if (error) return res.status(501).json(new apiResponse(501, error?.details[0]?.message, {}, {}));

        const currentTask = await getFirstMatch(taskModel, { _id: new ObjectId(value.taskId), isDeleted: false }, {}, {});
        if (!currentTask) return res.status(404).json(new apiResponse(404, responseMessage?.getDataNotFound('task'), {}, {}));

        let timestamps = false
        if (value.status && value.status !== currentTask.status) {
            const existingHistory = currentTask.statusHistory || [];

            const statusChange = {
                fromStatus: currentTask.status,
                toStatus: value.status,
                userId: new ObjectId(req.headers.user._id),
                changeDate: new Date()
            };
            timestamps = true
            value.statusHistory = [...existingHistory, statusChange];
        }

        if (value.comment) {
            let existingComments = currentTask.comments || [];
            value.comments = [...existingComments, {
                text: value.comment,
                userId: new ObjectId(req.headers.user._id),
                createdAt: new Date()
            }];
        }

        const response = await updateData(taskModel, { _id: new ObjectId(value.taskId), isDeleted: false }, value, { timestamps });
        if (!response) return res.status(404).json(new apiResponse(404, responseMessage?.getDataNotFound('task'), {}, {}))
        return res.status(202).json(new apiResponse(202, responseMessage?.getDataSuccess('task'), response, {}))
    } catch (error) {
        console.error(error)
        return res.status(500).json(new apiResponse(500, responseMessage.internalServerError, {}, error))
    }
}

export const delete_task_by_id = async (req, res) => {
    reqInfo(req);
    try {
        const { error, value } = deleteTaskSchema.validate(req.params);
        if (error) return res.status(400).json(new apiResponse(400, error?.details[0]?.message, {}, {}));

        const response = await updateData(taskModel, { _id: new ObjectId(value.id), isDeleted: false }, { isDeleted: true }, { new: true });
        if (!response) return res.status(404).json(new apiResponse(404, responseMessage.getDataNotFound("task"), {}, {}));

        return res.status(200).json(new apiResponse(200, responseMessage.deleteDataSuccess("task"), response, {}));
    } catch (error) {
        console.log(error);
        return res.status(500).json(new apiResponse(500, responseMessage.internalServerError, {}, error));
    }
};

export const get_all_task = async (req, res) => {
    reqInfo(req)
    let { user } = req.headers
    try {
        const { error, value } = getAllTasksSchema.validate(req.query)
        if (error) return res.status(400).json(new apiResponse(400, error?.details[0]?.message, {}, {}))

        let { page, limit, search, userFilter, startDate, endDate, priorityFilter } = value, criteria: any = {}, options: any = { lean: true };

        criteria.isDeleted = false

        options.sort = { updatedAt: -1 }

        if (user?.role === ROLES.PROJECT_MANAGER || user?.role === ROLES.EMPLOYEE) criteria.$or = [{ userId: new ObjectId(user._id) }, { userIds: {$in: [new ObjectId(user._id)]} }];

        if (priorityFilter) criteria.priority = priorityFilter;
        if (userFilter) criteria.$or = [{ userId: new ObjectId(userFilter) }, { userIds: {$in: [new ObjectId(userFilter)]} }];
        if (startDate && endDate) criteria.endDate = { $gte: startDate, $lte: endDate };

        if (search) {
            criteria.$or = [
                { title: { $regex: search, $options: "si" } },
                { description: { $regex: search, $options: "si" } },
            ]
        }

        if (page && limit) {
            options.skip = (parseInt(page) - 1) * parseInt(limit)
            options.limit = parseInt(limit)
        }

        let populateModel = [
            { path: 'userId', select: 'fullName email role profilePhoto' },
            { path: 'projectId', select: 'name' },
            { path: 'statusHistory.userId', select: 'fullName email role profilePhoto' },
            { path: 'comments.userId', select: 'fullName email role profilePhoto' },
            { path: 'userIds', select: 'fullName email role profilePhoto' },
        ]
        
        const response = await findAllWithPopulateWithSorting(taskModel, criteria, {}, options, populateModel)
        const totalCount = await countData(taskModel, criteria)

        const stateObj = {
            page: parseInt(page) || 1,
            limit: parseInt(limit) || totalCount,
            page_limit: Math.ceil(totalCount / (parseInt(limit) || totalCount)) || 1,
        }

        return res.status(200).json(new apiResponse(200, responseMessage?.getDataSuccess("tasks"), {
            task_data: response,
            totalData: totalCount,
            state: stateObj
        }, {}))
    } catch (error) {
        console.log(error)
        return res.status(500).json(new apiResponse(500, responseMessage.internalServerError, {}, error))
    }
}


export const get_task_by_id = async (req, res) => {
    reqInfo(req)
    try {
        const { error, value } = getTaskByIdSchema.validate(req.params)
        if (error) return res.status(501).json(new apiResponse(501, error?.details[0]?.message, {}, {}))

        let populateModel = [
            { path: 'userId', select: 'fullName email role' },
            { path: 'projectId', select: 'name' },
            { path: 'statusHistory.userId', select: 'fullName email role' }
        ]

        const response = await findOneAndPopulate(taskModel, { _id: new ObjectId(value.id), isDeleted: false }, {}, {}, populateModel)
        if (!response) return res.status(404).json(new apiResponse(404, responseMessage?.getDataNotFound("task"), {}, {}))

        return res.status(200).json(new apiResponse(200, responseMessage?.getDataSuccess("task"), response, {}))
    } catch (error) {
        console.log(error);
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, error))
    }
}