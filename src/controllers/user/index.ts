import bcrypt from 'bcryptjs';
import { apiResponse, ROLES } from '../../common';
import { countData, createData, getDataWithSorting, getFirstMatch, reqInfo, responseMessage, updateData } from '../../helper';
import { roleModel, userModel } from '../../database';
import { addUserSchema, deleteUserSchema, getAllUsersSchema, getUserSchema } from '../../validation';
const ObjectId = require("mongoose").Types.ObjectId

export const add_user = async (req, res) => {
    reqInfo(req)
    try {

        const { error, value } = addUserSchema.validate(req.body)
        if (error) return res.status(501).json(new apiResponse(501, error?.details[0]?.message, {}, {}))

        let isExist = await getFirstMatch(userModel, { email: value.email, isDeleted: false }, {}, {});
        if (isExist) return res.status(400).json(new apiResponse(400, responseMessage?.dataAlreadyExist("email"), {}, {}));

        isExist = await getFirstMatch(userModel, { phoneNumber: value.phoneNumber, isDeleted: false }, {}, {});
        if (isExist) return res.status(400).json(new apiResponse(400, responseMessage?.dataAlreadyExist("phone number"), {}, {}));

        value.fullName = value.firstName + " " + value.lastName

        if (value.role) {
            let role = await getFirstMatch(roleModel, { role: value.role, isDeleted: false }, {}, {});
            if (!role) return res.status(405).json(new apiResponse(405, responseMessage.dataAlreadyExist("role"), {}, {}));
            value.roleId = new ObjectId(role._id)
        }

        if (value.password) {
            value.displayPassword = value.password
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(value.password, saltRounds);
            value.password = hashedPassword
        }

        const response = await createData(userModel, value);
        if (!response) return res.status(404).json(new apiResponse(404, responseMessage?.addDataError, {}, {}))
        return res.status(200).json(new apiResponse(200, "User created successfully", response, {}));

    } catch (error) {
        console.log(error);
        return res.status(500).json(new apiResponse(500, "Internal Server Error", {}, error));
    }
};

export const edit_user_by_id = async (req, res) => {
    reqInfo(req)
    try {
        const { error, value } = addUserSchema.validate(req.body)
        if (error) return res.status(501).json(new apiResponse(501, error?.details[0]?.message, {}, {}))

        let isExist = await getFirstMatch(userModel, { _id: new ObjectId(value.userId), isDeleted: false }, {}, {});
        if (!isExist) return res.status(400).json(new apiResponse(400, responseMessage?.dataAlreadyExist("user"), {}, {}));

        isExist = await getFirstMatch(userModel, { email: value.email, isDeleted: false, _id: { $ne: new ObjectId(value.userId) } }, {}, {});
        if (isExist) return res.status(400).json(new apiResponse(400, responseMessage?.dataAlreadyExist("email"), {}, {}));

        isExist = await getFirstMatch(userModel, { phoneNumber: value.phoneNumber, isDeleted: false, _id: { $ne: new ObjectId(value.userId) } }, {}, {});
        if (isExist) return res.status(400).json(new apiResponse(400, responseMessage?.dataAlreadyExist("phone number"), {}, {}));

        if (value.password) {
            value.displayPassword = value.password
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(value.password, saltRounds);
            value.password = hashedPassword
        }

        if (value.role) {
            let role = await getFirstMatch(roleModel, { role: value.role, isDeleted: false }, {}, {});
            if (!role) return res.status(405).json(new apiResponse(405, responseMessage.dataAlreadyExist("role"), {}, {}));
            value.roleId = new ObjectId(role._id)
        }

        if (value.firstName) {
            value.fullName = value.firstName + " " + isExist.lastName
        }

        if (value.lastName) {
            value.fullName = isExist.firstName + " " + value.lastName
        }

        if (value.firstName && value.lastName) {
            value.fullName = value.firstName + " " + value.lastName
        }

        const response = await updateData(userModel, { _id: new ObjectId(value.userId), isDeleted: false }, { isDeleted: true });
        return res.status(200).json(new apiResponse(200, responseMessage?.updateDataSuccess("user"), response, {}));
    } catch (error) {
        console.log(error);
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, error));
    }
};

export const delete_user_by_id = async (req, res) => {
    reqInfo(req)
    try {
        const { error, value } = deleteUserSchema.validate(req.params)
        if (error) return res.status(501).json(new apiResponse(501, error?.details[0]?.message, {}, {}))

        const response = await updateData(userModel, { _id: new ObjectId(value.id), isDeleted: false }, { isDeleted: true });
        if (!response) return res.status(404).json(new apiResponse(404, responseMessage?.getDataNotFound("user"), {}, {}));
        return res.status(200).json(new apiResponse(200, responseMessage.deleteDataSuccess("Delete"), {}, {}));
    } catch (error) {
        console.log(error);
        return res.status(500).json(new apiResponse(500, responseMessage.internalServerError, {}, error));
    }
};

export const get_all_users = async (req, res) => {
    reqInfo(req)
    try {
        const { error, value } = getAllUsersSchema.validate(req.query)
        if (error) return res.status(501).json(new apiResponse(501, error?.details[0]?.message, {}, {}))

        let criteria: any = { isDeleted: false }, options: any = {}, { page = 1, limit = 10, roleFilter, activeFilter, search } = value;

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
    try {
        const { error, value } = getUserSchema.validate(req.params)
        if (error) return res.status(501).json(new apiResponse(501, error?.details[0]?.message, {}, {}))

        const response = await getFirstMatch(userModel, { _id: new ObjectId(value.id), isDeleted: false }, '-password', {})
        if (!response) return res.status(404).json(new apiResponse(404, responseMessage?.getDataNotFound("user"), {}, {}));
        return res.status(200).json(new apiResponse(200, responseMessage?.getDataSuccess("user"), response, {}));
    } catch (error) {
        console.log(error)
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, error));
    }
};