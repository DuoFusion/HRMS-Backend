import { apiResponse, ROLES } from "../../common";
import { moduleModel, permissionModel } from "../../database";
import { reqInfo, responseMessage } from "../../helper";
import { updateData } from "../../helper/database_service";

const ObjectId = require("mongoose").Types.ObjectId

export const edit_permission_by_id = async (req, res) => {
    reqInfo(req)
    let { modules, userId } = req.body;
    try {
        let updatedRoleDetails: any = [];
        for (let modulePermission of modules) {
            const setData = {
                moduleId: new ObjectId(modulePermission._id),
                add: modulePermission.add,
                edit: modulePermission.edit,
                view: modulePermission.view,
                delete: modulePermission.delete,
            };

            const updated = await updateData(permissionModel, { userId: new ObjectId(userId), moduleId: new ObjectId(modulePermission._id) }, setData, { upsert: true });
            updatedRoleDetails.push(updated);
        }
        return res.status(200).json(new apiResponse(200, responseMessage?.updateDataSuccess("user permissions"), updatedRoleDetails, {}))
    } catch (error) {
        console.log(error);
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, error))
    }
}

export const get_permission_by_userId = async (req, res) => {
    let { userId, search } = req.query, match: any = {}, { user } = req.headers;
    try {

        if (!userId) {
            match.userId = new ObjectId(user._id);
            userId = new ObjectId(user._id);
        }

        let userPermissionData = await permissionModel.find({ userId: new ObjectId(userId) });
        if (!userPermissionData) return res.status(405).json(new apiResponse(405, responseMessage.getDataNotFound("user permissions"), {}, {}));

        if (search) {
            match.$or = [
                { tabName: { $regex: search, $options: 'si' } },
                { displayName: { $regex: search, $options: 'si' } },
                { tabUrl: { $regex: search, $options: 'si' } },
            ];
        }

        match.isActive = true;

        let moduleData = await moduleModel.aggregate([
            { $match: match },
            {
                $lookup: {
                    from: "modules",
                    let: { tabId: '$parentId' },
                    pipeline: [{ $match: { $expr: { $and: [{ $eq: ['$_id', '$$tabId'] },], }, } }],
                    as: "modules"
                }
            },
            {
                $unwind: { path: "$modules", preserveNullAndEmptyArrays: true }
            },
        ])
        let newUserPermissionData = [];
        moduleData?.forEach(item => {
            let newObj = {
                parentTab: item.modules !== null ? item.modules : {},
                view: false,
                add: false,
                edit: false,
                delete: false,
            };

            let permission = userPermissionData?.find(item2 => item2.userId.toString() == userId.toString() && item2.moduleId.toString() == item._id.toString() && item.isActive == true);
            if (permission) {
                newObj.view = permission.view;
                newObj.add = permission.add;
                newObj.edit = permission.edit;
                newObj.delete = permission.delete;
            }
            newUserPermissionData.push({ ...item, ...newObj });
        });

        return res.status(200).json(new apiResponse(200, responseMessage?.getDataSuccess("user permissions"), newUserPermissionData.sort((a, b) => a.number - b.number), {}));
    } catch (error) {
        console.log(error);
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, error));
    }
};