import { companyModel } from "../../database";
import { apiResponse } from "../../common";
import { countData, createData, getDataWithSorting, getFirstMatch, reqInfo, responseMessage, updateData } from "../../helper";
import { addCompanySchema, deleteCompanySchema, editCompanySchema, getAllCompanySchema, getCompanySchema } from "../../validation";

const ObjectId = require("mongoose").Types.ObjectId;

export const add_company = async (req, res) => {
    reqInfo(req);
    try {
        const { error, value } = addCompanySchema.validate(req.body)
        if (error) return res.status(501).json(new apiResponse(501, error?.details[0]?.message, {}, {}))

        let isExist = await getFirstMatch(companyModel, { name: value.name, isDeleted: false }, {}, {});
        if (isExist) return res.status(400).json(new apiResponse(400, responseMessage?.dataAlreadyExist('name'), {}, {}));

        isExist = await getFirstMatch(companyModel, { number: value.number, isDeleted: false }, {}, {});
        if (isExist) return res.status(400).json(new apiResponse(400, responseMessage?.dataAlreadyExist('number'), {}, {}));

        const response = await createData(companyModel, value);

        if (!response) return res.status(404).json(new apiResponse(404, responseMessage?.addDataError, {}, {}))
        return res.status(200).json(new apiResponse(200, responseMessage?.addDataSuccess("company"), response, {}));
    } catch (error) {
        console.log(error);
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, error));
    }
}

<<<<<<< HEAD
export const GetAllUser = async (req, res) => {
    reqInfo(req);
=======
export const edit_company_by_id = async (req, res) => {
    reqInfo(req)
>>>>>>> 1593bafbf24b213b3c2683de8480ab735278ee75
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
    try {
        const { error, value } = getAllCompanySchema.validate(req.query)
        if (error) return res.status(501).json(new apiResponse(501, error?.details[0]?.message, {}, {}))

        let criteria: any = { isDeleted: false }, options: any = {}, { page, limit, activeFilter, search } = value;

        options.sort = { createdAt: -1 }
        if (activeFilter) criteria.isBlocked = activeFilter

        if (search) {
            criteria.$or = [
                { name: { $regex: search, $options: 'si' } },
                { ownerName: { $regex: search, $options: 'si' } },
            ];
        }

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

        return res.status(200).json(new apiResponse(200, responseMessage?.getDataSuccess('company'), {
            company_data: response || [],
            totalData: totalCount,
            state: stateObj
        }, {}));
    } catch (error) {
        console.log(error);
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, error));
    }
};


export const get_company_by_id = async (req, res) => {
    reqInfo(req);
    try {
        const { error, value } = getCompanySchema.validate(req.params)
        if (error) return res.status(501).json(new apiResponse(501, error?.details[0]?.message, {}, {}))

        const response = await getFirstMatch(companyModel, { _id: new ObjectId(value.id), isDeleted: false }, {}, {});
        if (!response) return res.status(404).json(new apiResponse(404, responseMessage?.getDataNotFound("Company"), {}, {}));
        return res.status(200).json(new apiResponse(200, responseMessage?.getDataSuccess("Company"), response, {}));
    } catch (error) {
<<<<<<< HEAD
        console.error(error);
        return res.status(500).json(new apiResponse(500, "Internal Server Error", {}, error));

    }

}

// export const updateUser = async (req, res) => {
//     reqInfo(req);
//     const body = req.body;

//     try {

//         let isExist = await getFirstMatch(companyModel, { _id: new ObjectId(body.userId), idDeleted: false }, {}, {});

//         if (!isExist) return res.status(404).json(new apiResponse(404, responseMessage?.dataAlreadyExist('company'), {}, {}));



//         // if (!isExist) return res.status(404).json(new apiResponse(404, responseMessage?.getDataNotFound('company'), {}, {}));


//         //     const User = await getFirstMatch(companyModel, { _id: new ObjectId(id), isDeleted: false }, {}, {});
//         // if (!User) return res.status(404).json(new apiResponse(404, responseMessage?.getDataNotFound('company'), {}, {}));

//     } catch (error) {
//         console.error(error);
//         return res.status(500).json(new apiResponse(500, "Internal Server Error", {}, error));

//     }

// }

export const EditUser = async (req, res) => {
    reqInfo(req);
    const { id } = req.params;
    const body = req.body;
    try {
        const EditUser = await companyModel.findOneAndEdit()
    } catch (error) {
        
    }

}

export const updateUser = async (req, res) => {
    reqInfo(req)
    try {
        const body = req.body;
        const { id } = req.body;
        const updatedUser = await companyModel.findOneAndUpdate({ _id: new ObjectId(id), isDeleted: false }, body, { new: true });
        if (!updatedUser) {
            return res.status(404).json(new apiResponse(404, responseMessage.updateDataError("latestUpdate"), {}, {}))
        }
        return res.status(200).json(new apiResponse(200, responseMessage.updateDataSuccess("news is updated"), updatedUser, {}))
    } catch (error) {
        return res.status(500).json(new apiResponse(500, responseMessage.internalServerError, {}, error))
=======
        console.log(error);
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, error));
>>>>>>> 1593bafbf24b213b3c2683de8480ab735278ee75
    }
}