import { leaveModel, userModel } from "../../database";
import { apiResponse, } from "../../common";
import { createData, getFirstMatch, reqInfo, responseMessage } from "../../helper";
const { leave } = require("../../database");
import { addLeaveSchema, updateLeaveSchema, deleteLeaveSchema } from "../../validation";
import { create } from "domain";
import { log } from "console";
const ObjectId = require("mongoose").Types.ObjectId;

export const add_Leave = async (req, res) => {
    reqInfo(req);
    // console.log("Adding leave request:", req.body);

    try {
        const { error, value } = addLeaveSchema.validate(req.body);
        if (error) return res.status(501).json(new apiResponse(501, error?.details[0]?.message, {}, {}));
        console.log("Validated leave request:", value);

        let isUserExits = await getFirstMatch(userModel, { _id: new ObjectId(value.userId), isDeleted: false }, {}, {});
        if (!isUserExits) return res.status(404).json(new apiResponse(404, responseMessage?.getDataNotFound("User"), {}, {}));

        const response = await createData(leaveModel, value);
        if (!response) return res.status(404).json(new apiResponse(404, responseMessage?.addDataError, {}, {}));

        return res.status(200).json(new apiResponse(200, responseMessage?.addDataSuccess('leave'), response, {}));

    } catch (error) {
        console.error(error);
        return res.status(500).json(new apiResponse(500, "Internal Server Error", {}, error));

    }

}