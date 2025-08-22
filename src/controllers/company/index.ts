import { companyModel } from "../../database";
import { apiResponse } from "../../common";
import { countData, createData, getDataWithSorting, getFirstMatch, reqInfo, responseMessage, updateData } from "../../helper";
import { addCompanySchema, deleteCompanySchema, editCompanySchema, getAllCompanySchema, getCompanySchema } from "../../validation";
import { get } from "config";

const ObjectId = require("mongoose").Types.ObjectId;

export const add_company = async (req, res) => {
    reqInfo(req);
    try {
        const { error, value } = addCompanySchema.validate(req.body)
        if (error) return res.status(501).json(new apiResponse(501, error?.details[0]?.message, {}, {}))

        let isExist = await getFirstMatch(companyModel, { name: value.name, isDeleted: false }, {}, {});
        if (isExist) return res.status(400).json(new apiResponse(400, responseMessage?.dataAlreadyExist('name'), {}, {}));

        isExist = await getFirstMatch(companyModel, { email: value.email, isDeleted: false }, {}, {});
        if (isExist) return res.status(400).json(new apiResponse(400, responseMessage?.dataAlreadyExist('email'), {}, {}));

        isExist = await getFirstMatch(companyModel, { phoneNumber: value.phoneNumber, isDeleted: false }, {}, {});
        if (isExist) return res.status(400).json(new apiResponse(400, responseMessage?.dataAlreadyExist('phone number'), {}, {}));

        const response = await createData(companyModel, value);
        if (!response) return res.status(404).json(new apiResponse(404, responseMessage?.addDataError, {}, {}))
        return res.status(200).json(new apiResponse(200, responseMessage?.addDataSuccess("company"), response, {}));
    } catch (error) {
        console.log(error);
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, error));
    }
}

export const edit_company_by_id = async (req, res) => {
    reqInfo(req)
    try {
        const { error, value } = editCompanySchema.validate(req.body)
        if (error) return res.status(501).json(new apiResponse(501, error?.details[0]?.message, {}, {}))

        let isExist = await getFirstMatch(companyModel, { _id: new ObjectId(value.companyId), isDeleted: false }, {}, {});
        if (!isExist) return res.status(400).json(new apiResponse(400, responseMessage?.getDataNotFound("company"), {}, {}));

        isExist = await getFirstMatch(companyModel, { email: value.email, isDeleted: false, _id: { $ne: new ObjectId(value.companyId) } }, {}, {});
        if (isExist) return res.status(400).json(new apiResponse(400, responseMessage?.dataAlreadyExist("email"), {}, {}));

        isExist = await getFirstMatch(companyModel, { phoneNumber: value.phoneNumber, isDeleted: false, _id: { $ne: new ObjectId(value.companyId) } }, {}, {});
        if (isExist) return res.status(400).json(new apiResponse(400, responseMessage?.dataAlreadyExist("phone number"), {}, {}));

        const response = await updateData(companyModel, { _id: new ObjectId(value.companyId), isDeleted: false }, value);
        return res.status(200).json(new apiResponse(200, responseMessage?.updateDataSuccess("company"), response, {}));
    } catch (error) {
        console.log(error)
        return res.status(500).json(new apiResponse(500, responseMessage.internalServerError, {}, error))
    }
}

export const delete_company_by_id = async (req, res) => {
    reqInfo(req)
    try {
        const { error, value } = deleteCompanySchema.validate(req.params)
        if (error) return res.status(501).json(new apiResponse(501, error?.details[0]?.message, {}, {}))

        const response = await updateData(companyModel, { _id: new ObjectId(value.id), isDeleted: false }, { isDeleted: true });
        if (!response) return res.status(404).json(new apiResponse(404, responseMessage?.getDataNotFound("company"), {}, {}));
        return res.status(200).json(new apiResponse(200, responseMessage.deleteDataSuccess("company"), {}, {}));
    } catch (error) {
        console.log(error);
        return res.status(500).json(new apiResponse(500, responseMessage.internalServerError, {}, error));
    }
};


export const get_all_company = async (req, res) => {
    reqInfo(req)
    let { page, limit, search, activeFilter } = req.query, criteria: any = {}, options: any = { lean: true };
    try {
        criteria.isDeleted = false;

        if (search) {
            criteria.$or = [
                { name: { $regex: search, $options: 'si' } },
                { ownerName: { $regex: search, $options: 'si' } },
            ];
        }
        
        criteria.isBlocked = activeFilter == "true" ? true : false

        options.sort = { createdAt: -1 }

        if (page && limit) {
            options.skip = (parseInt(page) - 1) * parseInt(limit);
            options.limit = parseInt(limit);
        }
        
        const response = await getDataWithSorting(companyModel, criteria, {}, options);
        const totalCount = await countData(companyModel, criteria);

        const stateObj = {
            page: parseInt(page) || 1,
            limit: parseInt(limit) || totalCount,
            page_limit: Math.ceil(totalCount / (parseInt(limit) || totalCount)) || 1,
        };

        return res.status(200).json(new apiResponse(200, responseMessage.getDataSuccess('company'), {
            company_data: response,
            totalData: totalCount,
            state: stateObj
        }, {}));
    } catch (error) {
        console.log(error);
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, error))
    }
}

export const get_company_by_id = async (req, res) => {
    reqInfo(req);
    try {
        const { error, value } = getCompanySchema.validate(req.params)
        if (error) return res.status(501).json(new apiResponse(501, error?.details[0]?.message, {}, {}))

        const response = await getFirstMatch(companyModel, { _id: new ObjectId(value.id), isDeleted: false }, {}, {});
        if (!response) return res.status(404).json(new apiResponse(404, responseMessage?.getDataNotFound("Company"), {}, {}));
        return res.status(200).json(new apiResponse(200, responseMessage?.getDataSuccess("Company"), response, {}));
    } catch (error) {
        console.log(error);
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, error));
    }
}