import { reqInfo, responseMessage } from "../../helper";
import { apiResponse } from "../../common";
import { moduleModel, permissionModel } from "../../database";
import { getFirstMatch, createData, updateData, getData, aggregateData, updateMany } from "../../helper/database_service";

const ObjectId = require('mongoose').Types.ObjectId

export const add_module = async (req, res) => {
    reqInfo(req)
    let body = req.body;
    try {
        let isExist = await getFirstMatch(moduleModel, { tabName: body.tabName }, {}, {});
        if (isExist) return res.status(405).json(new apiResponse(405, responseMessage.dataAlreadyExist("name"), {}, {}));

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
        let isExist = await getFirstMatch(moduleModel, { _id: new ObjectId(body._id) }, {}, {});
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

        const response = await updateData(moduleModel, { _id: new ObjectId(body._id) }, body, {});
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
        await updateMany(permissionModel, { moduleId: ObjectId(id), isDeleted: false }, { isDeleted: true }, {})

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

        match.isBlocked = activeFilter ? activeFilter : false;
        let response = await aggregateData(moduleModel, [
            { $match: match },
            {
                $lookup: {
                    from: "tabmasters",
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
        if (!response) return res.status(404).json(new apiResponse(404, responseMessage?.getDataNotFound("module"), {}, {}));

        return res.status(200).json(new apiResponse(200, responseMessage?.getDataSuccess('module'), {
            module_data: response[0].data.sort((a, b) => a.number - b.number),
            totalData: response[0].data_count,
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

export const bulk_edit_module = async (req, res) => {
    reqInfo(req)
    let { tabs } = req.body
    try {
        let updatedTabs: any = [];
        for (let tab of tabs) {
            let updatedTab = await updateData(moduleModel, { _id: new ObjectId(tab._id) }, tab, {});
            updatedTabs.push(updatedTab);
        }
        if (!updatedTabs) return res.status(404).json(new apiResponse(404, responseMessage?.updateDataError("tab master"), {}, {}))

        return res.status(200).json(new apiResponse(200, responseMessage?.updateDataSuccess("tab master"), updatedTabs, {}));
    } catch (error) {
        console.log(error);
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, error))
    }
}