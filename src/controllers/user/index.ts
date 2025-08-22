import bcrypt from 'bcryptjs';
import { apiResponse, ROLES } from '../../common';
import { countData, createData, getDataWithSorting, getFirstMatch, reqInfo, responseMessage, updateData } from '../../helper';
import { roleModel, userModel } from '../../database';
import { addUserSchema, deleteUserSchema, editUserSchema, getAllUserSchema, getUserSchema } from '../../validation';
const ObjectId = require("mongoose").Types.ObjectId

export const add_user = async (req, res) => {
    reqInfo(req)
    try {

        const { error, value } = addUserSchema.validate(req.body)
        if (error) return res.status(501).json(new apiResponse(501, error?.details[0]?.message, {}, {}))

        let isExist = await getFirstMatch(userModel, { email: value.email, isDeleted: false }, {}, {});
        if (isExist) return res.status(400).json(new apiResponse(400, responseMessage?.dataAlreadyExist("Email"), {}, {}));

        isExist = await getFirstMatch(userModel, { phoneNumber: value.phoneNumber, isDeleted: false }, {}, {});
        if (isExist) return res.status(400).json(new apiResponse(400, responseMessage?.dataAlreadyExist("Phone Number"), {}, {}));

        value.fullName = value.firstName + " " + value.lastName

        if (value.role) {
            let role = await getFirstMatch(roleModel, { name: value.role, isDeleted: false }, {}, {});
            if (!role) return res.status(405).json(new apiResponse(405, responseMessage.getDataNotFound("Role"), {}, {}));
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
        return res.status(200).json(new apiResponse(200, responseMessage?.addDataSuccess("User"), response, {}));

    } catch (error) {
        console.log(error);
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, error));
    }
};

export const edit_user_by_id = async (req, res) => {
    reqInfo(req)
    try {
        const { error, value } = editUserSchema.validate(req.body)
        if (error) return res.status(501).json(new apiResponse(501, error?.details[0]?.message, {}, {}))

        let isExist = await getFirstMatch(userModel, { _id: new ObjectId(value.userId), isDeleted: false }, {}, {});
        if (!isExist) return res.status(400).json(new apiResponse(400, responseMessage?.getDataNotFound("User"), {}, {}));

        isExist = await getFirstMatch(userModel, { email: value.email, isDeleted: false, _id: { $ne: new ObjectId(value.userId) } }, {}, {});
        if (isExist) return res.status(400).json(new apiResponse(400, responseMessage?.dataAlreadyExist("Email"), {}, {}));

        isExist = await getFirstMatch(userModel, { phoneNumber: value.phoneNumber, isDeleted: false, _id: { $ne: new ObjectId(value.userId) } }, {}, {});
        if (isExist) return res.status(400).json(new apiResponse(400, responseMessage?.dataAlreadyExist("Phone Number"), {}, {}));

        if (value.password) {
            value.displayPassword = value.password
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(value.password, saltRounds);
            value.password = hashedPassword
        }

        if (value.role) {
            let role = await getFirstMatch(roleModel, { name: value.role, isDeleted: false }, {}, {});
            if (!role) return res.status(405).json(new apiResponse(405, responseMessage.dataAlreadyExist("Role"), {}, {}));
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

        const response = await updateData(userModel, { _id: new ObjectId(value.userId), isDeleted: false }, value);
        return res.status(200).json(new apiResponse(200, responseMessage?.updateDataSuccess("User"), response, {}));
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

        const response = await updateData(userModel, { _id: new ObjectId(value.userId), isDeleted: false }, { isDeleted: true });
        if (!response) return res.status(404).json(new apiResponse(404, responseMessage?.getDataNotFound("User"), {}, {}));
        return res.status(200).json(new apiResponse(200, responseMessage.deleteDataSuccess("User"), {}, {}));
    } catch (error) {
        console.log(error);
        return res.status(500).json(new apiResponse(500, responseMessage.internalServerError, {}, error));
    }
};

export const get_all_users = async (req, res) => {
    reqInfo(req)
    let { user } = req.headers
    try {
        const { error, value } = getAllUserSchema.validate(req.query)
        console.log("active",value);
        if (error) return res.status(501).json(new apiResponse(501, error?.details[0]?.message, {}, {}))
            
        let criteria: any = { isDeleted: false }, options: any = {}, { page, limit, roleFilter, activeFilter, search } = value;

        if (user.role !== ROLES.ADMIN) criteria.userId = new ObjectId(user._id)

        criteria.role = { $ne: ROLES.ADMIN }
        options.sort = { createdAt: -1 }
        if (roleFilter) criteria.role = roleFilter;

        criteria.isBlocked = activeFilter == "true" ? true : false
        
        if (search) {
            criteria.$or = [
                { name: { $regex: search, $options: 'si' } },
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

        return res.status(200).json(new apiResponse(200, responseMessage?.getDataSuccess('User'), {
            user_data: response || [],
            totalData: totalCount,
            state: stateObj
        }, {}));

    } catch (error) {
        console.log(error);
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, error));
    }
};

export const get_user_by_id = async (req, res) => {
    reqInfo(req)
    try {
        const { error, value } = getUserSchema.validate(req.params)
        if (error) return res.status(501).json(new apiResponse(501, error?.details[0]?.message, {}, {}))

        const response = await getFirstMatch(userModel, { _id: new ObjectId(value.userId), isDeleted: false }, '-password', {})
        if (!response) return res.status(404).json(new apiResponse(404, responseMessage?.getDataNotFound("User"), {}, {}));
        return res.status(200).json(new apiResponse(200, responseMessage?.getDataSuccess("User"), response, {}));
    } catch (error) {
        console.log(error)
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, error));
    }
};