import { taskModel } from "../../database";
import { apiResponse, ROLES } from "../../common";
import { countData, createData, getData, getDataWithSorting, getFirstMatch, reqInfo, responseMessage, updateData } from "../../helper";
import { addTaskSchema, deleteTaskSchema, getAllTasksSchema, getTaskByIdSchema, updateTaskSchema } from "../../validation";
import { ObjectId } from "mongoose";
import { log } from "node:console";
import { object } from "joi";

const ObjectId = require('mongoose').Types.ObjectId;

export const AddTask = async (req, res) => {
    reqInfo(req)
    try {
        const body = req.body;
        const { error, value } = addTaskSchema.validate(body);
        if (error) return res.status(501).json(new apiResponse(501, error?.details[0]?.message, {}, {}));

        let isExist = await getFirstMatch(taskModel, { userId: new ObjectId(value.userId), isDelete: false }, {}, {});
        if (isExist) return res.status(404).json(new apiResponse(404, responseMessage?.dataAlreadyExist("Task"), {}, {}));

        const response = await createData(taskModel, body);
        if (!response) return res.status(404).json(new apiResponse(404, responseMessage?.addDataError, {}, {}))

        return res.status(200).json(new apiResponse(200, responseMessage.addDataSuccess('task'), response, {}));
    } catch (error) {
        console.log(error);
        return res.status(500).json(new apiResponse(500, responseMessage.internalServerError, {}, error));
    }
}

export const updateTask = async (req, res) => {
    reqInfo(req)
    try {
        const body = req.body;
        const { error, value } = updateTaskSchema.validate(body);
        if (error) return res.status(501).json(new apiResponse(501, error?.details[0]?.message, {}, {}));

        const response = await updateData(taskModel, { _id: new ObjectId(body.taskId) }, value, {});
        if (!response) return res.status(404).json(new apiResponse(404, responseMessage?.getDataNotFound('task'), {}, {}))

        return res.status(200).json(new apiResponse(200, responseMessage?.updateDataSuccess('task'), response, {}))
    } catch (error) {

    }
}

export const DeleteTask = async (req, res) => {
    reqInfo(req)
    try {
        const { error, value } = deleteTaskSchema.validate(req.params);
        if (error) return res.status(501).json(new apiResponse(501, error?.details[0]?.message, {}, {}))

        const response = await updateData(taskModel, { _id: new ObjectId(value.id) }, { isDelete: true }, {})
        console.log('resId>>', response);

        if (!response) return res.status(404).json(new apiResponse(404, responseMessage?.getDataNotFound('task'), {}, {}));

        return res.status(202).json(new apiResponse(202, responseMessage?.deleteDataSuccess('task'), response, {}))
    } catch (error) {
        console.log('err', error);

        req.error(error)
        res.status(404).json(new apiResponse(404, responseMessage.internalServerError, {}, {}));
    }
}

export const getAllTask = async (req, res) => {
    reqInfo(req)
    try {
        const { error, value } = getAllTasksSchema.validate(req.query)
        if (error) return res.status(400).status(new apiResponse(400, error?.details[0]?.message, {}, {}))

        const criteria: any = { isDeleted: false }, options: any = {}, { page = 1, limit = 10, search, startDate, endDate } = value;

        if (startDate && endDate) {
            criteria.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            }
        }
        // criteria.role = { ne: ROLES.ADMIN };
        // let match = { isDeleted: false };

        if (search) { criteria.$or = [{ title: { $regex: search, $options: "i" } }, { description: { $regex: search, $options: "i" } }]; }

        const response = await getDataWithSorting(taskModel, criteria, '', options);
        const totalCount = await countData(taskModel, criteria);

        const stateObj = {
            page: parseInt(page) || 1,
            limit: parseInt(limit) || totalCount,
            page_limit: Math.ceil(totalCount / (parseInt(limit) || totalCount)) || 1,
        };

        return res.status(200).json(new apiResponse(200, responseMessage?.getDataSuccess("tasks"), {
            task_data: response || [],
            totalPages: Math.ceil(totalCount / limit),
            currentPage: page,
            totalCount
        }, {})
        );

    } catch (error) {
        console.log(error);
        return res.status(500).json(new apiResponse(500, responseMessage.internalServerError, {}, error))
    }
}


export const getTaskById = async (req, res) => {
    reqInfo(req)
    try {
        console.log('id??', req.params);

        const { error, value } = getTaskByIdSchema.validate(req.params)
        if (error) return res.status(501).json(new apiResponse(501, error?.details[0]?.message, {}, {}));

        const response = await getFirstMatch(taskModel, { _id: new ObjectId(value.id), isDeleted: false }, {});
        console.log("id////", response);

        if (!response) return res.status(404).json(new apiResponse(404, responseMessage?.getDataNotFound('task'), {}, {}))

        return res.status(200).json(new apiResponse(202, responseMessage?.getDataSuccess('task'), response, {}))
    } catch (error) {
        console.error(error)
        return res.status(500).json(new apiResponse(500, responseMessage.internalServerError, {}, error))
    }
}