import { apiResponse } from "../../common";
import { moduleModel, permissionModel } from "../../database";
import { reqInfo, responseMessage } from "../../helper";

const ObjectId = require("mongoose").Types.ObjectId

export const edit_permission_by_id = async (req, res) => {
    reqInfo(req)
    let { modules, roleId } = req.body;
    try {
        let updatedRoleDetails: any = [];
        for (let roleDetails of modules) {
            let updateData = {
                moduleId: new ObjectId(roleDetails._id),
                view: roleDetails.view,
                add: roleDetails.add,
                edit: roleDetails.edit,
                delete: roleDetails.delete,
                isActive: roleDetails.isActive
            }

            let updateRoleDetails = await permissionModel.findOneAndUpdate({ roleId: ObjectId(roleId), moduleId: ObjectId(roleDetails._id) }, updateData, { upsert: true, new: true });
            updatedRoleDetails.push(updateRoleDetails);
        }
        return res.status(200).json(new apiResponse(200, responseMessage?.updateDataSuccess("role details"), updatedRoleDetails, {}))
    } catch (error) {
        console.log(error);
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, error))
    }
}

export const get_role_details_by_roleId = async (req, res) => {
    let { roleId, search } = req.body, match: any = {};
    try {
        let roleDetailData = await permissionModel.find({ roleId: ObjectId(roleId) });
        if (!roleDetailData) return res.status(405).json(new apiResponse(405, responseMessage.getDataNotFound("role details"), {}, {}));

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

        let newRoleDetailData = [];
        moduleData?.forEach(item => {
            let newObj = {
                parentTab: item.parentId !== null ? item.parentTab[0] : {},
                view: false,
                add: false,
                edit: false,
                delete: false,
                isActive: false
            };

            let roleDetail = roleDetailData?.find(item2 => item2.roleId.toString() == roleId.toString() && item2.tabId.toString() == item._id.toString() && item.isActive == true);
            if (roleDetail) {
                newObj.view = roleDetail.view;
                newObj.add = roleDetail.add;
                newObj.edit = roleDetail.edit;
                newObj.delete = roleDetail.delete;
                newObj.isActive = roleDetail.isActive;
            }
            newRoleDetailData.push({ ...item, ...newObj });
        });

        return res.status(200).json(new apiResponse(200, responseMessage?.getDataSuccess("role details"), newRoleDetailData.sort((a, b) => a.number - b.number), {}));
    } catch (error) {
        console.log(error);
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, error));
    }
};