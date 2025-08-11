import { companyModel } from "../../database";
import { apiResponse } from "../../common";
import { getFirstMatch, reqInfo, responseMessage } from "../../helper";
import { log } from "console";

const ObjectId = require("mongoose").Types.ObjectId;

export const AddUser = async (req, res) => {

    reqInfo(req);
    let body = req.body;
    try {

        let isExist = await getFirstMatch(companyModel, { number: body.number, isDeleted: false }, {}, {});
        if (isExist) return res.status(400).json(new apiResponse(400, responseMessage?.dataAlreadyExist('phone number'), {}, {}));

        if (isExist) return res.status(400).json(new apiResponse(400, responseMessage?.dataAlreadyExist('user'), {}, {}));

        const newUser = await companyModel.create(body);
        return res.status(200).json(new apiResponse(200, 'user created successfully', newUser, {}));

    } catch (error) {
        console.log(error);
        return res.status(500).json(new apiResponse(500, "Internal Server Error", {}, error));

    }

}

export const GetAllUser = async (req, res) => {
    try {
        const users = await companyModel.find({ isDeleted: false }).select("-password");
        return res.status(200).json(new apiResponse(200, "Users fetched successfully", users, {}));
    } catch (error) {
        console.error(error);
        return res.status(500).json(new apiResponse(500, "Internal Server Error", {}, error));
    }
};


export const GetUserById = async (req, res) => {
    reqInfo(req);
    const { id } = req.params;
    try {
        const response = await getFirstMatch(companyModel, { _id: new ObjectId(id), isDeleted: false }, {}, {});
        console.log("getFirstMatch result:", response);

        if (!response) return res.status(404).json(new apiResponse(404, responseMessage?.getDataNotFound("Company"), {}, {}));
        return res.status(200).json(new apiResponse(200, responseMessage?.getDataSuccess("Company"), response, {}));

    } catch (error) {
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
    }
}