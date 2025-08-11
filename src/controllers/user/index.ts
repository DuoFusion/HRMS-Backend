import bcrypt from 'bcryptjs';
import { apiResponse, ROLES } from '../../common';
import { countData, createData, getDataWithSorting, getFirstMatch, reqInfo, responseMessage, updateData } from '../../helper';
import { roleModel, userModel } from '../../database';
const ObjectId = require("mongoose").Types.ObjectId

export const add_user = async (req, res) => {
    reqInfo(req)
    let body = req.body;
    try {
        let isExist = await getFirstMatch(userModel, { email: body.email, isDeleted: false }, {}, {});
        if (isExist) return res.status(400).json(new apiResponse(400, responseMessage?.dataAlreadyExist("email"), {}, {}));

        isExist = await getFirstMatch(userModel, { phoneNumber: body.phoneNumber, isDeleted: false }, {}, {});
        if (isExist) return res.status(400).json(new apiResponse(400, responseMessage?.dataAlreadyExist("phone number"), {}, {}));

        body.fullName = body.firstName + " " + body.lastName

        if (body.role) {
            let role = await getFirstMatch(roleModel, { role: body.role, isDeleted: false }, {}, {});
            if (!role) return res.status(405).json(new apiResponse(405, responseMessage.dataAlreadyExist("role"), {}, {}));
            body.roleId = new ObjectId(role._id)
        }

        if (body.password) {
            body.displayPassword = body.password
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(body.password, saltRounds);
            body.password = hashedPassword
        }

        const response = await createData(userModel, body);
        if (!response) return res.status(404).json(new apiResponse(404, responseMessage?.addDataError, {}, {}))
        return res.status(200).json(new apiResponse(200, "User created successfully", response, {}));

    } catch (error) {
        console.log(error);
        return res.status(500).json(new apiResponse(500, "Internal Server Error", {}, error));
    }
};

export const edit_user_by_id = async (req, res) => {
    reqInfo(req)
    let body = req.body;
    try {
        let isExist = await getFirstMatch(userModel, { _id: new ObjectId(body.userId), isDeleted: false }, {}, {});
        if (!isExist) return res.status(400).json(new apiResponse(400, responseMessage?.dataAlreadyExist("user"), {}, {}));

        isExist = await getFirstMatch(userModel, { email: body.email, isDeleted: false, _id: { $ne: new ObjectId(body.userId) } }, {}, {});
        if (isExist) return res.status(400).json(new apiResponse(400, responseMessage?.dataAlreadyExist("email"), {}, {}));

        isExist = await getFirstMatch(userModel, { phoneNumber: body.phoneNumber, isDeleted: false, _id: { $ne: new ObjectId(body.userId) } }, {}, {});
        if (isExist) return res.status(400).json(new apiResponse(400, responseMessage?.dataAlreadyExist("phone number"), {}, {}));

        if (body.password) {
            body.displayPassword = body.password
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(body.password, saltRounds);
            body.password = hashedPassword
        }

        if (body.role) {
            let role = await getFirstMatch(roleModel, { role: body.role, isDeleted: false }, {}, {});
            if (!role) return res.status(405).json(new apiResponse(405, responseMessage.dataAlreadyExist("role"), {}, {}));
            body.roleId = new ObjectId(role._id)
        }
        
        if (body.firstName) {
            body.fullName = body.firstName + " " + isExist.lastName
        }

        if (body.lastName) {
            body.fullName = isExist.firstName + " " + body.lastName
        }

        if(body.firstName && body.lastName) {
            body.fullName = body.firstName + " " + body.lastName
        }

        const response = await updateData(userModel, { _id: new ObjectId(body.userId), isDeleted: false }, { isDeleted: true });
        return res.status(200).json(new apiResponse(200, responseMessage?.updateDataSuccess("user"), response, {}));
    } catch (error) {
        console.log(error);
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, error));
    }
};

export const delete_user_by_id = async (req, res) => {
    reqInfo(req);
    const { id } = req.params;
    try {
        const response = await updateData(userModel, { _id: new ObjectId(id), isDeleted: false }, { isDeleted: true });
        if (!response) return res.status(404).json(new apiResponse(404, responseMessage?.getDataNotFound("user"), {}, {}));
        return res.status(200).json(new apiResponse(200, responseMessage.deleteDataSuccess("Delete"), {}, {}));
    } catch (error) {
        console.log(error);
        return res.status(500).json(new apiResponse(500, responseMessage.internalServerError, {}, error));
    }
};

export const get_all_users = async (req, res) => {
    reqInfo(req)
    let criteria: any = { isDeleted: false }, options: any = {}, { page = 1, limit = 10, roleFilter, activeFilter, search } = req.query;
    try {
        criteria.role = { $ne: ROLES.ADMIN }
        options.sort = { createdAt: -1 }
        if (roleFilter) criteria.role = roleFilter;
        if (activeFilter) criteria.isBlocked = activeFilter

        if (search) {
            criteria.$or = [
                { fullName: { $regex: search, $options: 'si' } },
                { firstName: { $regex: search, $options: 'si' } },
                { lastName: { $regex: search, $options: 'si' } },
                { email: { $regex: search, $options: 'si' } },
                { department: { $regex: search, $options: 'si' } },
                { designation: { $regex: search, $options: 'si' } }
            ];
        }

        if (page && limit) {
            options.skip = (parseInt(page) - 1) * parseInt(limit);
            options.limit = parseInt(limit);
        }

        const response = await getDataWithSorting(userModel, criteria, '-password', options);
        const totalCount = await countData(userModel, criteria);

        const stateObj = {
            page: parseInt(page) || 1,
            limit: parseInt(limit) || totalCount,
            page_limit: Math.ceil(totalCount / (parseInt(limit) || totalCount)) || 1,
        };

        return res.status(200).json(new apiResponse(200, responseMessage?.getDataSuccess('users'), {
            user_data: response || [],
            totalData: totalCount,
            state: stateObj
        }, {}));

    } catch (error) {
        console.log(error);
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, error));
    }
};

export const getUserById = async (req, res) => {
    reqInfo(req)
    let { id } = req.params
    try {
        const response = await getFirstMatch(userModel, { _id: new ObjectId(id), isDeleted: false }, '-password', {})
        if (!response) return res.status(404).json(new apiResponse(404, responseMessage?.getDataNotFound("user"), {}, {}));
        return res.status(200).json(new apiResponse(200, responseMessage?.getDataSuccess("user"), response, {}));
    } catch (error) {
        console.log(error)
        return res.status(500).json(new apiResponse(500, 'Error fetching user', {}, error));
    }
};