import { notificationModel } from "../../database";
import { apiResponse } from "../../common";
import { reqInfo, responseMessage, updateData } from "../../helper";

const ObjectId = require("mongoose").Types.ObjectId;

export const list_notifications = async (req, res) => {
    reqInfo(req);
    let { user } = req.headers;
    try {
        const { page, limit, onlyUnread } = req.query;
        const criteria: any = { userId: new ObjectId(user._id), isDeleted: false };
        if (String(onlyUnread) === 'true') criteria.isRead = false;
        const options: any = { sort: { createdAt: -1 } };
        if (page && limit) {
            options.skip = (parseInt(page) - 1) * parseInt(limit);
            options.limit = parseInt(limit);
        }
        const list = await notificationModel.find(criteria, {}, options).lean();
        const total = await notificationModel.countDocuments(criteria);
        return res.status(200).json(new apiResponse(200, responseMessage?.getDataSuccess('notifications'), { list, total }, {}));
    } catch (error) {
        console.log(error);
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, error));
    }
}

export const mark_notification_read = async (req, res) => {
    reqInfo(req);
    let { user } = req.headers;
    try {
        const { id } = req.params;
        await updateData(notificationModel, { _id: new ObjectId(id), userId: new ObjectId(user._id), isDeleted: false }, { isRead: true }, {});
        return res.status(200).json(new apiResponse(200, responseMessage?.updateDataSuccess('notification'), {}, {}));
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
        await updateData(notificationModel, { _id: new ObjectId(id), userId: new ObjectId(user._id), isDeleted: false }, { isRead: false }, {});
        return res.status(200).json(new apiResponse(200, responseMessage?.updateDataSuccess('notification'), {}, {}));
    } catch (error) {
        console.log(error);
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, error));
    }
}

export const mark_all_read = async (req, res) => {
    reqInfo(req);
    let { user } = req.headers;
    try {
        await notificationModel.updateMany({ userId: new ObjectId(user._id), isDeleted: false, isRead: false }, { $set: { isRead: true } });
        return res.status(200).json(new apiResponse(200, responseMessage?.updateDataSuccess('notifications'), {}, {}));
    } catch (error) {
        console.log(error);
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, error));
    }
}