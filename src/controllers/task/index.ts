import { taskModel } from "../../database";
import { apiResponse, ROLES } from "../../common";
import { countData, createData, getData, getDataWithSorting, getFirstMatch, reqInfo, responseMessage, updateData } from "../../helper";
import { addTaskSchema, deleteTaskSchema, getAllTasksSchema, getTaskByIdSchema, updateTaskSchema } from "../../validation";
import { ObjectId } from "mongoose";

const ObjectId = require('mongoose').Types.ObjectId;

export const add_task = async (req, res) => {
    reqInfo(req)
    try {
        const body = req.body;
        const { error, value } = addTaskSchema.validate(body);
        if (error) return res.status(501).json(new apiResponse(501, error?.details[0]?.message, {}, {}));

        const response = await createData(taskModel, body);

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
        const body = req.body;
        const { error, value } = updateTaskSchema.validate(body);
        if (error) return res.status(501).json(new apiResponse(501, error?.details[0]?.message, {}, {}));

        const response = await updateData(taskModel, { _id: new ObjectId(body.taskId), isDeleted: false }, value, {});
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
        if (error) {
            return res.status(400).json(new apiResponse(400, error?.details[0]?.message, {}, {}));
        }
        const response = await updateData(taskModel, { _id: new ObjectId(value.taskId), isDeleted: false }, { isDeleted: true }, { new: true });
        if (!response) {
            return res.status(404).json(new apiResponse(404, responseMessage.getDataNotFound("task"), {}, {}));
        }

        return res.status(200).json(new apiResponse(200, responseMessage.deleteDataSuccess("task"), response, {}));
    } catch (error) {
        console.log("err", error);
        return res.status(500).json(new apiResponse(500, responseMessage.internalServerError, {}, error));
    }
};

export const get_all_task = async (req, res) => {
    reqInfo(req)
    try {
        const { error, value } = getAllTasksSchema.validate(req.query)
        if (error) { return res.status(400).json(new apiResponse(400, error?.details[0]?.message, {}, {})) }

        let { page, limit, search } = value, criteria: any = {}, options: any = { lean: true };

        criteria.isDeleted = false

        if (search) {
            criteria.$or = [
                { title: { $regex: search, $options: "si" } },
                { description: { $regex: search, $options: "si" } },
                { status: { $regex: search, $options: "si" } },
                { text: { $regex: search, $options: "si" } },
                { type: { $regex: search, $options: "si" } },
            ]
        }

        if (page && limit) {
            options.skip = (parseInt(page) - 1) * parseInt(limit)
            options.limit = parseInt(limit)
        }
        const response = await getDataWithSorting(taskModel, criteria, {}, options)
        const totalCount = await countData(taskModel, criteria)

        const stateObj = {
            page: parseInt(page) || 1,
            limit: parseInt(limit) || totalCount,
            page_limit: Math.ceil(totalCount / (parseInt(limit) || totalCount)) || 1,
        }

        return res.status(200).json(
            new apiResponse(200, responseMessage?.getDataSuccess("tasks"), { task_data: response, totalData: totalCount, state: stateObj, }, {})
        )
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

        const response = await getFirstMatch(taskModel, { _id: new ObjectId(value.taskId), isDeleted: false }, {}, {})
        if (!response) return res.status(404).json(new apiResponse(404, responseMessage?.getDataNotFound("task"), {}, {}))

        return res.status(200).json(new apiResponse(200, responseMessage?.getDataSuccess("task"), response, {}))
    } catch (error) {
        console.log(error);
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, error))
    }
}