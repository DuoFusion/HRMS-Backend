import { notificationModel } from "../../database";
import { apiResponse } from "../../common";
import { countData, findAllWithPopulateWithSorting, reqInfo, responseMessage, updateData, updateMany } from "../../helper";

const ObjectId = require("mongoose").Types.ObjectId;

export const get_all_notifications = async (req, res) => {
    reqInfo(req);
    let { user } = req.headers;
    try {
        const criteria: any = { userId: new ObjectId(user._id), isDeleted: false };
        const options: any = { sort: { createdAt: -1 } };

        const response = await findAllWithPopulateWithSorting(notificationModel, criteria, {}, options, [])
        criteria.isRead = false
        const totalCount = await countData(notificationModel, criteria)

        return res.status(200).json(new apiResponse(200, responseMessage?.getDataSuccess('notifications'), {
            notification_data: response,
            totalData: totalCount,
        }, {}));
    } catch (error) {
        console.log(error);
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, error));
    }
}

export const mark_notification_read = async (req, res) => {
    reqInfo(req);
    let { user } = req.headers, { id } = req.params;
    try {
        let response = await updateData(notificationModel, { _id: new ObjectId(id), userId: new ObjectId(user._id), isDeleted: false }, { isRead: true }, {});
        if (!response) return res.status(200).json(new apiResponse(200, responseMessage?.getDataNotFound('notification'), {}, {}));
        return res.status(200).json(new apiResponse(200, responseMessage?.updateDataSuccess('notification'), response, {}));
    } catch (error) {
        console.log(error);
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, error));
    }
}

export const mark_notification_unread = async (req, res) => {
    reqInfo(req);
    let { user } = req.headers;
    try {
        const { id } = req.params;
        let response = await updateData(notificationModel, { _id: new ObjectId(id), userId: new ObjectId(user._id), isDeleted: false }, { isRead: false }, {});
        if (!response) return res.status(200).json(new apiResponse(200, responseMessage?.getDataNotFound('notification'), {}, {}));
        return res.status(200).json(new apiResponse(200, responseMessage?.updateDataSuccess('notification'), response, {}));
    } catch (error) {
        console.log(error);
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, error));
    }
}

export const mark_all_read = async (req, res) => {
    reqInfo(req);
    let { user } = req.headers;
    try {
        let responses = await updateMany(notificationModel, { userId: new ObjectId(user._id), isDeleted: false, isRead: false }, { $set: { isRead: true } });
        if (responses.length === 0) return res.status(200).json(new apiResponse(200, responseMessage?.getDataNotFound('notification'), {}, {}));
        return res.status(200).json(new apiResponse(200, responseMessage?.updateDataSuccess('notifications'), {}, {}));
    } catch (error) {
        console.log(error);
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, error));
    }
}