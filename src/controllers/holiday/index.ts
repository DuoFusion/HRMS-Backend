import { holidayModel } from "../../database";
import { apiResponse } from "../../common";
import { createData, getFirstMatch, reqInfo, responseMessage, updateData } from "../../helper";
import { addHolidaySchema, deleteHolidaySchema, updateHolidaySchema } from "../../validation";
import mongoose from "mongoose";
import { query } from "express";
import { getFips } from "crypto";
import { object } from "joi";

const ObjectId = require('mongoose').Types.ObjectId;

export const addHoliday = async (req, res) => {
    reqInfo(req)
    try {
        const body = req.body;
        const { error, value } = addHolidaySchema.validate(body);

        if (error) return res.status(501).json(new apiResponse(501, error?.details[0]?.message, {}, {}));

        let isExist = await getFirstMatch(holidayModel, { _id: new ObjectId(value.userId), isDelete: false }, {}, {});
        if (isExist) return res.status(404).json(new apiResponse(404, responseMessage?.dataAlreadyExist("holiday"), {}, {}));

        const response = await createData(holidayModel, body);
        console.log('res Data??', response);

        if (!response) return res.status(404).json(new apiResponse(404, responseMessage?.addDataError, {}, {}))

        return res.status(200).json(new apiResponse(200, responseMessage.addDataSuccess('holiday'), response, {}));
    } catch (error) {
        console.log(error);
        return res.status(500).json(new apiResponse(500, responseMessage.internalServerError, {}, error));
    }
}

export const updateHoliday = async (req, res) => {
    reqInfo(req)
    try {
        const body = req.body
        const { error, value } = updateHolidaySchema.validate(body)
        if (error) return res.status(501).json(new apiResponse(501, error?.details[0]?.message, {}, {}))

        const response = await updateData(holidayModel, { _id: new ObjectId(body.id) }, value, {});
        if (!response) return res.status(404).json(new apiResponse(404, responseMessage?.getDataNotFound('holiday'), {}, {}));

        return res.status(202).json(new apiResponse(202, responseMessage?.getDataSuccess('holiday'), response, {}))

    } catch (error) {
        console.error(error)
        return res.status(500).json(new apiResponse(500, responseMessage.internalServerError, {}, error))
    }

}

