import { reqInfo, responseMessage } from "../../helper";
import { apiResponse } from "../../common";
import { moduleModel, permissionModel, userModel } from "../../database";
import { getFirstMatch, createData, updateData, getData, aggregateData, updateMany, deleteMany } from "../../helper/database_service";

const ObjectId = require('mongoose').Types.ObjectId

export const add_module = async (req, res) => {
    reqInfo(req)
    let body = req.body;
    try {
        let isExist = await getFirstMatch(moduleModel, { tabName: body.tabName }, {}, {});
        if (isExist) return res.status(405).json(new apiResponse(405, responseMessage.dataAlreadyExist("name"), {}, {}));

        if (body.tabName && isExist?.tabName !== body.tabName) {
            let getAllModuleData = await getData(moduleModel, {}, {}, {});
            let isNameExist = getAllModuleData?.find(item => item.tabName === body.tabName);
            if (isNameExist) return res.status(405).json(new apiResponse(405, responseMessage.dataAlreadyExist("module name"), {}, {}));
        }

        if (body.number && isExist?.number !== body.number) {
            let isNumberExist = await getData(moduleModel, { number: body.number }, {}, {});
            if (isNumberExist?.length > 0) return res.status(405).json(new apiResponse(405, responseMessage.dataAlreadyExist("tab number"), {}, {}));
        }

        const response = await createData(moduleModel, body);
        if (!response) return res.status(404).json(new apiResponse(404, responseMessage?.addDataError, {}, {}));

        return res.status(200).json(new apiResponse(200, responseMessage?.addDataSuccess("module"), response, {}));
    } catch (error) {
        console.log(error);
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, error))
    }
}

export const edit_module_by_id = async (req, res) => {
    reqInfo(req)
    let body = req.body
    try {
        let isExist = await getFirstMatch(moduleModel, { _id: new ObjectId(body.moduleId) }, {}, {});
        if (!isExist) return res.status(405).json(new apiResponse(405, responseMessage.getDataNotFound("module"), {}, {}));

        let getAllModuleData = await getData(moduleModel, {}, {}, {});
        if (body.tabName && isExist?.tabName !== body.tabName) {
            let isNameExist = getAllModuleData?.find(item => item.tabName === body.tabName);
            if (isNameExist) return res.status(405).json(new apiResponse(405, responseMessage.dataAlreadyExist("module name"), {}, {}));
        }

        if (body.number && isExist?.number !== body.number) {
            let isNumberExist = getAllModuleData?.find(item => item.number === body.number);
            if (isNumberExist) return res.status(405).json(new apiResponse(405, responseMessage.dataAlreadyExist("module number"), {}, {}));
        }

        const response = await updateData(moduleModel, { _id: new ObjectId(body.moduleId) }, body, {});
        if (!response) return res.status(404).json(new apiResponse(404, responseMessage?.updateDataError("module"), {}, {}));

        return res.status(200).json(new apiResponse(200, responseMessage.updateDataSuccess("module"), response, {}));
    } catch (error) {
        console.log(error);
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, error))
    }
}

export const delete_module_by_id = async (req, res) => {
    reqInfo(req)
    let { id } = req.params
    try {
        const response = await updateData(moduleModel, { _id: new ObjectId(id), isDeleted: false }, { isDeleted: true }, {})
        if (!response) return res.status(404).json(new apiResponse(404, responseMessage?.getDataNotFound("module"), {}, {}))
        await deleteMany(permissionModel, { moduleId: new ObjectId(id), isDeleted: false }, {})
        
        return res.status(200).json(new apiResponse(200, responseMessage?.deleteDataSuccess("module"), response, {}))
    } catch (error) {
        console.log(error);
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, error))
    }
}

export const get_all_module = async (req, res) => {
    reqInfo(req)
    let { page, limit, search, activeFilter } = req.query, match: any = {};
    try {
        if (search) {
            match.$or = [
                { name: { $regex: search, $options: 'si' } },
            ];
        }
        limit = parseInt(limit)
        match.isDeleted = false;
        match.isActive = activeFilter ? activeFilter : true;
        let response = await aggregateData(moduleModel, [
            { $match: match },
            {
                $lookup: {
                    from: "modules",
                    let: { tabId: '$parentId' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$_id', '$$tabId'] },
                                    ],
                                },
                            }
                        },
                    ],
                    as: "parentTab"
                }
            },
            {
                $unwind: {
                    path: "$parentTab",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $facet: {
                    data: [
                        { $sort: { number: 1 } },
                        { $skip: (((page as number - 1) * limit as number)) },
                        { $limit: limit as number },
                    ],
                    data_count: [{ $count: "count" }]
                }
            },
        ])

        return res.status(200).json(new apiResponse(200, responseMessage?.getDataSuccess('module'), {
            module_data: response[0]?.data?.sort((a, b) => a.number - b.number),
            totalData: response[0]?.data_count[0]?.count || 0,
            state: {
                page: page as number,
                limit: limit as number,
                page_limit: Math.ceil(response[0].data_count[0]?.count / (req.body?.limit) as number) || 1,
            }
        }, {}));
    } catch (error) {
        console.log(error);
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, error))
    }
}

export const get_by_id_module = async (req, res) => {
    reqInfo(req)
    let { id } = req.params
    try {
        const response = await getFirstMatch(moduleModel, { _id: new ObjectId(id), isDeleted: false }, {}, {})
        if (!response) return res.status(404).json(new apiResponse(404, responseMessage?.getDataNotFound("module"), {}, {}))

        return res.status(200).json(new apiResponse(200, responseMessage?.getDataSuccess("module"), response, {}))
    } catch (error) {
        console.log(error);
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, error))
    }
}

export const bulk_edit_permissions_by_module = async (req, res) => {
    reqInfo(req)
    let { moduleId, users } = req.body;
    try {
        if (!moduleId) return res.status(400).json(new apiResponse(400, 'moduleId is required', {}, {}));

        let updatedPermissions: any = [];
        for (let user of users) {
            const setData = {
                moduleId: new ObjectId(moduleId),
                userId: new ObjectId(user._id),
                add: user.permissions?.add || false,
                edit: user.permissions?.edit || false,
                view: user.permissions?.view || false,
                delete: user.permissions?.delete || false,
            };

            const updated = await updateData(
                permissionModel,
                { userId: new ObjectId(user._id), moduleId: new ObjectId(moduleId) },
                setData,
                { upsert: true }
            );
            updatedPermissions.push(updated);
        }
        return res.status(200).json(new apiResponse(200, responseMessage?.updateDataSuccess("bulk user permissions"), updatedPermissions, {}))
    } catch (error) {
        console.log(error);
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, error))
    }
}

export const get_users_permissions_by_moduleId = async (req, res) => {
    reqInfo(req)
    const { moduleId } = req.query as any
    try {
        if (!moduleId) return res.status(400).json(new apiResponse(400, 'moduleId is required', {}, {}))

        const module = await getFirstMatch(moduleModel, { _id: new ObjectId(moduleId), isDeleted: false }, {}, {})
        if (!module) return res.status(404).json(new apiResponse(404, responseMessage?.getDataNotFound('module'), {}, {}))

        const users = await getData(userModel, { isDeleted: false }, { password: 0 }, {})
        const userIds = users.map((u: any) => u._id)

        const perms = await getData(
            permissionModel,
            { moduleId: new ObjectId(moduleId), userId: { $in: userIds }, isDeleted: false },
            {},
            {}
        )

        const userIdToPerm: Record<string, any> = {}
        for (const p of perms) userIdToPerm[String(p.userId)] = p

        const payload = users.map((u: any) => {
            const p = userIdToPerm[String(u._id)]
            const view = Boolean(module.hasView && p?.view)
            const add = Boolean(module.hasAdd && p?.add)
            const edit = Boolean(module.hasEdit && p?.edit)
            const deleteFlag = Boolean(module.hasDelete && p?.delete)
            const hasAccess = view || add || edit || deleteFlag
            return {
                _id: u._id,
                fullName: u.fullName,
                email: u.email,
                role: u.role,
                permissions: {
                    view,
                    add,
                    edit,
                    delete: deleteFlag,
                    hasAccess,
                }
            }
        })

        return res.status(200).json(new apiResponse(200, responseMessage?.getDataSuccess('users permissions for module'), payload, {}))
    } catch (error) {
        console.log(error)
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, error))
    }
}