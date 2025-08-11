import { Request, Response } from 'express';
import { userModel } from '../../database/models/user';
import { ROLES } from '../../common';
import { apiResponse } from '../../common/index';
import { countData, getDataWithSorting, getFirstMatch, reqInfo, responseMessage, updateData } from '../../helper';
import { log } from 'winston';
const ObjectId = require("mongoose").Types.ObjectId

interface AuthRequest extends Request {
    user?: any;
}

// Get all users (admin only)
export const getAllUsers = async (req, res) => {
    try {
        const { page = 1, limit = 10, role, status, search } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        // Build filter object
        const filter: any = { isDeleted: false };

        if (role) filter.role = role;
        if (status) filter.status = status;
        if (search) {
            filter.$or = [
                { fullName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { department: { $regex: search, $options: 'i' } },
                { designation: { $regex: search, $options: 'i' } }
            ];
        }

        // Get users with pagination using database service
        const users = await getDataWithSorting(
            userModel,
            filter,
            '-password',
            {
                sort: { createdAt: -1 },
                skip: skip,
                limit: Number(limit)
            }
        );

        // Get total count
        const total = await countData(userModel, filter);

        return res.status(200).json(new apiResponse(200, responseMessage?.getDataSuccess('users'), {
            users,
            pagination: {
                currentPage: Number(page),
                totalPages: Math.ceil(total / Number(limit)),
                totalUsers: total,
                usersPerPage: Number(limit)
            }
        }, {}));

    } catch (error) {
        console.error('Get all users error:', error);
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, error));
    }
};

export const AddUsers = async (req, res) => {
    try {
        const body = req.body;
        console.log("body", body);


        let isExist = await userModel.findOne({ email: body.email.toLowerCase(), isDeleted: false });
        if (isExist) {
            return res.status(400).json(new apiResponse(400, "User already exists with this email", {}, {}));
        }
        console.log('missing', isExist);

        const newUser = await userModel.create(body);
        console.log("newuser", newUser);

        return res.status(201).json(new apiResponse(201, "User created successfully", newUser, {}));

    } catch (error) {
        console.error("AddUser Error:", error);
        return res.status(500).json(new apiResponse(500, "Internal Server Error", {}, error));
    }
};

export const getUserById = async (req, res) => {
    reqInfo(req)
    let { id } = req.params
    try {
        const user = await userModel.findOne({ _id: new ObjectId(id), isDeleted: false }).select('-password');
        if (!user || user.isDeleted) {
            return res.status(404).json(new apiResponse(404, 'User not found', {}, {}));
        }
        return res.status(200).json(new apiResponse(200, 'User fetched successfully', user, {}));
    } catch (error) {
        console.log(error)
        return res.status(500).json(new apiResponse(500, 'Error fetching user', {}, error));
    }
};

export const updateUser = async (req, res) => {
    reqInfo(req)
    try {
        const { userId } = req.body;
        const body = req.body;
        console.log('not found', req.body);
        // Step 2: Check if user exists
        const existingUser = await userModel.findOne({ _id: new ObjectId(userId), isDeleted: false })
        if (!existingUser) return res.status(404).json(new apiResponse(404, responseMessage?.getDataNotFound("user"), {}, {}));

        console.log('data not found', req.body);

        const updatedUser = await userModel.findOneAndUpdate({ _id: new ObjectId(userId), isDeleted: false }, body, { new: true });

        return res.status(200).json(new apiResponse(200, responseMessage?.updateDataSuccess("user"), updatedUser, {}));
    } catch (error) {
        console.error("Update user error:", error);
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, error));
    }
};


export const deleteUser = async (req, res) => {
    reqInfo(req)
    try {
        const { id } = req.params;
        const Delete = await userModel.findOneAndUpdate({ _id: new ObjectId(id), isDeleted: false }, { isDeleted: true }, { new: true });
        if (!Delete) {
            return res.status(404).json(new apiResponse(404, "Delete is not found", {}, {}));
        }
        console.log("Delete", Delete);

        return res.status(200).json(new apiResponse(200, responseMessage.deleteDataSuccess("Delete"), Delete, {}))
    } catch (error) {
        return res.status(500).json(new apiResponse(500, responseMessage.internalServerError, {}, error))
    }
}

// Update user role (admin only)
export const updateUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;
        const currentUser = req.user;

        // Check permissions - only admin can update roles
        if (currentUser.role !== ROLES.ADMIN) {
            return res.status(403).json(new apiResponse(403, 'Only admin can update user roles', {}, {}));
        }

        // Validate role
        if (!Object.values(ROLES).includes(role)) {
            return res.status(400).json(new apiResponse(400, 'Invalid role', {}, {}));
        }

        // Check if user exists
        const existingUser = await getFirstMatch(userModel, { _id: id, isDeleted: false }, {}, {});
        if (!existingUser) {
            return res.status(404).json(new apiResponse(404, responseMessage?.getDataNotFound("user"), {}, {}));
        }

        // Prevent admin from changing their own role
        if (currentUser._id.toString() === id) {
            return res.status(400).json(new apiResponse(400, 'Cannot change your own role', {}, {}));
        }

        // Update user role
        const updatedUser = await updateData(userModel, { _id: id }, { role, updatedAt: new Date() }, {});

        return res.status(200).json(new apiResponse(200, responseMessage?.updateDataSuccess("user role"), updatedUser, {}));

    } catch (error) {
        console.error('Update user role error:', error);
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, error));
    }
};



// Update user status (admin/HR only)
export const updateUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const currentUser = req.user;

        // Check permissions
        if (![ROLES.ADMIN, ROLES.HR].includes(currentUser.role)) {
            return res.status(403).json(new apiResponse(403, 'Insufficient permissions', {}, {}));
        }

        // Validate status
        const validStatuses = ['active', 'inactive', 'suspended'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json(new apiResponse(400, 'Invalid status', {}, {}));
        }

        // Check if user exists
        const existingUser = await getFirstMatch(userModel, { _id: id, isDeleted: false }, {}, {});
        if (!existingUser) {
            return res.status(404).json(new apiResponse(404, responseMessage?.getDataNotFound("user"), {}, {}));
        }

        // Update user status
        const updatedUser = await updateData(userModel, { _id: id }, { status, updatedAt: new Date() }, {});

        return res.status(200).json(new apiResponse(200, responseMessage?.updateDataSuccess("user status"), updatedUser, {}));

    } catch (error) {
        console.error('Update user status error:', error);
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, error));
    }
};