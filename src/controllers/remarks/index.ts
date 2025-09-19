import { companyModel, remarkModel, userModel } from "../../database";
import { apiResponse, REMARK_TYPE, ROLES } from "../../common";
import { createData, countData, getFirstMatch, reqInfo, updateData, responseMessage, findAllWithPopulateWithSorting } from "../../helper";
import { addRemarkSchema, updateRemarkSchema, deleteRemarkSchema, getAllRemarksSchema, getRemarkByIdSchema, getAllLeavesSchema } from "../../validation";


const ObjectId = require("mongoose").Types.ObjectId;

export const add_remark = async (req, res) => {
    reqInfo(req);
    let { user } = req.headers;
    try {
        const { error, value } = addRemarkSchema.validate(req.body);
        if (error) return res.status(501).json(new apiResponse(501, error?.details[0]?.message, {}, {}));
        value.createdBy = new ObjectId(user._id);
        value.updatedBy = new ObjectId(user._id);

        if (user.role !== ROLES.SUPER_ADMIN) value.userId = new ObjectId(user._id)

        if (user.role !== ROLES.SUPER_ADMIN) value.companyId = new ObjectId(user.companyId)
        if (user.role === ROLES.SUPER_ADMIN) {
            let user = await getFirstMatch(userModel, { _id: new ObjectId(value.userId) }, {}, {})
            if (!user) return res.status(404).json(new apiResponse(404, responseMessage?.getDataNotFound('remarks'), {}, {}))
        }

        value.type = REMARK_TYPE.MANUAL;
        const response = await createData(remarkModel, value);
        if (!response) return res.status(404).json(new apiResponse(404, responseMessage?.addDataError, {}, {}));

        return res.status(200).json(new apiResponse(200, responseMessage?.addDataSuccess("Remark"), response, {}));
    } catch (error) {
        console.error(error);
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, error));
    }
};

export const update_remark = async (req, res) => {
    reqInfo(req);
    let { user } = req.headers;
    try {
        const { error, value } = updateRemarkSchema.validate(req.body);
        if (error) return res.status(501).json(new apiResponse(501, error?.details[0]?.message, {}, {}));
        value.updatedBy = new ObjectId(user._id);
        let isRemarkExist = await getFirstMatch(remarkModel, { _id: new ObjectId(value.remarkId), isDeleted: false }, {}, {});
        if (!isRemarkExist) return res.status(404).json(new apiResponse(404, responseMessage?.getDataNotFound("Remark"), {}, {}));

        const response = await updateData(remarkModel, { _id: new ObjectId(value.remarkId) }, value, {});
        return res.status(200).json(new apiResponse(200, responseMessage?.updateDataSuccess("Remark"), response, {}));
    } catch (error) {
        console.error(error);
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, error));
    }
};

export const delete_remark_by_id = async (req, res) => {
    reqInfo(req);
    try {
        const { error, value } = deleteRemarkSchema.validate(req.params);
        if (error) return res.status(501).json(new apiResponse(501, error?.details[0]?.message, {}, {}));

        const response = await updateData(remarkModel, { _id: new ObjectId(value.id) }, { isDeleted: true }, {});
        if (!response) return res.status(404).json(new apiResponse(404, responseMessage?.getDataNotFound("Remark"), {}, {}));

        return res.status(200).json(new apiResponse(200, responseMessage?.deleteDataSuccess("Remark"), {}, {}));
    } catch (error) {
        console.error(error);
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, error));
    }
};


export const get_all_remarks = async (req, res) => {
    reqInfo(req);
    let { user } = req.headers;
    try {
        const { error, value } = getAllRemarksSchema.validate(req.query);
        if (error) return res.status(501).json(new apiResponse(501, error?.details[0]?.message, {}, {}));

        let criteria: any = { isDeleted: false }, options: any = {};
        const { page, limit, search, userFilter, startDate, endDate } = value;

        if (user.role === ROLES.ADMIN || user.role === ROLES.HR) {
            criteria.companyId = new ObjectId(user.companyId)            
        } else if (user.role === ROLES.PROJECT_MANAGER || user.role === ROLES.EMPLOYEE) {
            criteria.companyId = new ObjectId(user._id)
        }

        if (userFilter) criteria.userId = userFilter;
        if (search) criteria.note = { $regex: search, $options: "si" };
        if (startDate && endDate) criteria.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };

        let populate = [
            { path: "userId", select: "fullName profilePhoto" },
            { path: "createdBy", select: "fullName profilePhoto" },
        ];

        options.sort = { createdAt: -1 };
        if (page && limit) {
            options.skip = (parseInt(page) - 1) * parseInt(limit);
            options.limit = parseInt(limit);
        }

        const response = await findAllWithPopulateWithSorting(remarkModel, criteria, {}, options, populate);        
        const totalCount = await countData(remarkModel, criteria);

        const stateObj = {
            page: parseInt(page) || 1,
            limit: parseInt(limit) || totalCount,
            page_limit: Math.ceil(totalCount / (parseInt(limit) || totalCount)) || 1,
        };

        return res.status(200).json(new apiResponse(200, responseMessage?.getDataSuccess("Remarks"), {
            remark_data: response || [],
            totalData: totalCount,
            state: stateObj
        }, {}));
    } catch (error) {
        console.error(error);
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, error));
    }
};



export const get_remark_by_id = async (req, res) => {
    reqInfo(req);
    try {
        const { error, value } = getRemarkByIdSchema.validate(req.params);
        if (error) return res.status(501).json(new apiResponse(501, error?.details[0]?.message, {}, {}));

        const response = await getFirstMatch(remarkModel, { _id: new ObjectId(value.id), isDeleted: false }, {});
        if (!response) return res.status(404).json(new apiResponse(404, responseMessage?.getDataNotFound("Remark"), {}, {}));

        return res.status(200).json(new apiResponse(200, responseMessage?.getDataSuccess("Remark"), response, {}));
    } catch (error) {
        console.error(error);
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, error));
    }
};
