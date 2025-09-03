import { seatModel } from "../../database";
import { apiResponse, ROLES } from "../../common";
import { createData, countData, getFirstMatch, reqInfo, updateData, responseMessage, findAllWithPopulateWithSorting, findOneAndPopulate } from "../../helper";
import { addSeatSchema, updateSeatSchema, deleteSeatSchema, getAllSeatsSchema, getSeatByIdSchema } from "../../validation";

const ObjectId = require("mongoose").Types.ObjectId;

export const add_seat = async (req, res) => {
    reqInfo(req);
    try {
        const { error, value } = addSeatSchema.validate(req.body);
        if (error) return res.status(501).json(new apiResponse(501, error?.details[0]?.message, {}, {}));

        const isExist = await getFirstMatch(seatModel, { seatNumber: value.seatNumber, isDeleted: false }, {}, {});
        if (isExist) return res.status(404).json(new apiResponse(404, responseMessage?.dataAlreadyExist("Seat Number"), {}, {}));

        const response = await createData(seatModel, value);
        if (!response) return res.status(404).json(new apiResponse(404, responseMessage?.addDataError, {}, {}));
        return res.status(200).json(new apiResponse(200, responseMessage?.addDataSuccess("Seat"), response, {}));
    } catch (error) {
        console.error(error);
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, error));
    }
};

export const edit_seat_by_id = async (req, res) => {
    reqInfo(req);
    try {
        const { error, value } = updateSeatSchema.validate(req.body);
        if (error) return res.status(501).json(new apiResponse(501, error?.details[0]?.message, {}, {}));

        const isSeatExist = await getFirstMatch(seatModel, { _id: new ObjectId(value.seatId), isDeleted: false }, {}, {});
        if (!isSeatExist) return res.status(404).json(new apiResponse(404, responseMessage?.getDataNotFound("Seat"), {}, {}));

        const isExist = await getFirstMatch(seatModel, { seatNumber: value.seatNumber, isDeleted: false, _id: { $ne: new ObjectId(value.seatId) } }, {}, {});
        if (isExist) return res.status(404).json(new apiResponse(404, responseMessage?.dataAlreadyExist("Seat Number"), {}, {}));

        const response = await updateData(seatModel, { _id: new ObjectId(value.seatId) }, value, {});
        return res.status(200).json(new apiResponse(200, responseMessage?.updateDataSuccess("Seat"), response, {}));
    } catch (error) {
        console.error(error);
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, error));
    }
};

export const delete_seat_by_id = async (req, res) => {
    reqInfo(req);
    try {
        const { error, value } = deleteSeatSchema.validate(req.params);
        if (error) return res.status(501).json(new apiResponse(501, error?.details[0]?.message, {}, {}));

        const response = await updateData(seatModel, { _id: new ObjectId(value.id) }, { isDeleted: true }, {});
        if (!response) return res.status(404).json(new apiResponse(404, responseMessage?.getDataNotFound("Seat"), {}, {}));
        return res.status(200).json(new apiResponse(200, responseMessage?.deleteDataSuccess("Seat"), {}, {}));
    } catch (error) {
        console.error(error);
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, error));
    }
};

export const get_all_seats = async (req, res) => {
    reqInfo(req);
    try {
        const { error, value } = getAllSeatsSchema.validate(req.query);
        if (error) return res.status(501).json(new apiResponse(501, error?.details[0]?.message, {}, {}));

        let { page, limit, search, userFilter } = value, criteria: any = { isDeleted: false }, options: any = {};

        if (userFilter) criteria.userId = new ObjectId(userFilter);
        if (search) criteria.seatNumber = { $regex: search, $options: "si" };

        let populate = [
            { path: "userId", select: "fullName profilePhoto" },
        ];

        options.sort = { createdAt: -1 };
        if (page && limit) {
            options.skip = (parseInt(page) - 1) * parseInt(limit);
            options.limit = parseInt(limit);
        }

        const response = await findAllWithPopulateWithSorting(seatModel, criteria, {}, options, populate);
        const totalCount = await countData(seatModel, criteria);

        const stateObj = {
            page: parseInt(page) || 1,
            limit: parseInt(limit) || totalCount,
            page_limit: Math.ceil(totalCount / (parseInt(limit) || totalCount)) || 1,
        };

        return res.status(200).json(new apiResponse(200, responseMessage?.getDataSuccess("Seats"), {
            seat_data: response || [],
            totalData: totalCount,
            state: stateObj
        }, {}));
    } catch (error) {
        console.error(error);
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, error));
    }
};

export const get_seat_by_id = async (req, res) => {
    reqInfo(req);
    try {
        const { error, value } = getSeatByIdSchema.validate(req.params);
        if (error) return res.status(501).json(new apiResponse(501, error?.details[0]?.message, {}, {}));
        let populate = [
            { path: "userId", select: "fullName profilePhoto" },
        ];
        const response = await findOneAndPopulate(seatModel, { _id: new ObjectId(value.id), isDeleted: false }, {}, {}, populate);
        if (!response) return res.status(404).json(new apiResponse(404, responseMessage?.getDataNotFound("Seat"), {}, {}));
        return res.status(200).json(new apiResponse(200, responseMessage?.getDataSuccess("Seat"), response, {}));
    } catch (error) {
        console.error(error);
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, error));
    }
};
