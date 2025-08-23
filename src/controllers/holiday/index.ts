import { holidayModel } from "../../database";
import { apiResponse } from "../../common";
import { countData, createData, getDataWithSorting, getFirstMatch, reqInfo, responseMessage, updateData } from "../../helper";
import { addHolidaySchema, deleteHolidaySchema, getAllHolidaySchema, getHolidaySchema, updateHolidaySchema } from "../../validation";

const ObjectId = require('mongoose').Types.ObjectId;

export const add_holiday = async (req, res) => {
    reqInfo(req)
    try {
        const body = req.body;
        const { error, value } = addHolidaySchema.validate(body);
        if (error) return res.status(501).json(new apiResponse(501, error?.details[0]?.message, {}, {}));

        const response = await createData(holidayModel, body);

        if (!response) return res.status(404).json(new apiResponse(404, responseMessage?.addDataError, {}, {}))
        return res.status(200).json(new apiResponse(200, responseMessage.addDataSuccess('holiday'), response, {}));
    } catch (error) {
        console.log(error);
        return res.status(500).json(new apiResponse(500, responseMessage.internalServerError, {}, error));
    }
}

export const edit_holiday_by_id = async (req, res) => {
    reqInfo(req)
    try {
        const body = req.body
        const { error, value } = updateHolidaySchema.validate(body)
        if (error) return res.status(501).json(new apiResponse(501, error?.details[0]?.message, {}, {}))

        const response = await updateData(holidayModel, { _id: new ObjectId(body.holidayId), isDeleted: false }, value, {});
        if (!response) return res.status(404).json(new apiResponse(404, responseMessage?.getDataNotFound('holiday'), {}, {}));

        return res.status(202).json(new apiResponse(202, responseMessage?.getDataSuccess('holiday'), response, {}))
    } catch (error) {
        console.error(error)
        return res.status(500).json(new apiResponse(500, responseMessage.internalServerError, {}, error))
    }
}

export const delete_holiday_by_id = async (req, res) => {
    reqInfo(req)
    try {
        const { error, value } = deleteHolidaySchema.validate(req.params)
        if (error) return res.status(501).json(new apiResponse(501, error?.details[0]?.message, {}, {}))
        
        const response = await updateData(holidayModel, { _id: new ObjectId(value.id), isDeleted: false }, { isDeleted: true }, {})
        if (!response) return res.status(404).json(new apiResponse(404, responseMessage?.getDataNotFound("holiday"), {}, {}))
        return res.status(200).json(new apiResponse(200, responseMessage?.deleteDataSuccess("holiday"), response, {}))
    } catch (error) {
        console.log(error);
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, error))
    }
}

export const get_all_holiday = async (req, res) => {
    reqInfo(req)
    try {
        const { error, value } = getAllHolidaySchema.validate(req.query)
        if (error) { return res.status(400).json(new apiResponse(400, error?.details[0]?.message, {}, {})) }

        let { page, limit, search, activeFilter } = value, criteria: any = {}, options: any = { lean: true };

        criteria.isDeleted = false;

        if (search) {
            criteria.$or = [
                { title: { $regex: search, $options: 'si' } },
                { description: { $regex: search, $options: 'si' } },
                { type: { $regex: search, $options: 'si' } }
            ];
        }

        criteria.isBlocked = activeFilter === true ? true : false
        options.sort = { createdAt: -1 }

        if (page && limit) {
            options.skip = (parseInt(page) - 1) * parseInt(limit);
            options.limit = parseInt(limit);
        }

        const response = await getDataWithSorting(holidayModel, criteria, {}, options);
        const totalCount = await countData(holidayModel, criteria);

        const stateObj = {
            page: parseInt(page) || 1,
            limit: parseInt(limit) || totalCount,
            page_limit: Math.ceil(totalCount / (parseInt(limit) || totalCount)) || 1,
        };

        return res.status(200).json(new apiResponse(200, responseMessage.getDataSuccess('holiday'), {
            holiday_data: response,
            totalData: totalCount,
            state: stateObj
        }, {}));
    } catch (error) {
        console.log(error);
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, error))
    }
}

export const get_holiday_by_id = async (req, res) => {
    reqInfo(req)
    try {
        const { error, value } = getHolidaySchema.validate(req.params)
        if (error) return res.status(501).json(new apiResponse(501, error?.details[0]?.message, {}, {}))

        const response = await getFirstMatch(holidayModel, { _id: new ObjectId(value.id), isDeleted: false }, {}, {})
        if (!response) return res.status(404).json(new apiResponse(404, responseMessage?.getDataNotFound("holiday"), {}, {}))

        return res.status(200).json(new apiResponse(200, responseMessage?.getDataSuccess("holiday"), response, {}))
    } catch (error) {
        console.log(error);
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, error))
    }
}