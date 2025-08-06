import { Request, Response } from 'express';
import { userModel } from '../../database/models/user';
import { ROLES } from '../../common';
import { apiResponse } from '../../common';
import { countData, getDataWithSorting, getFirstMatch, responseMessage, updateData } from '../../helper';

interface AuthRequest extends Request {
    user?: any;
}

// Get all users (admin only)
export const getAllUsers = async (req: AuthRequest, res: Response) => {
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

// Get user by ID
export const getUserById = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        const user = await getFirstMatch(userModel, { _id: id, isDeleted: false }, '-password', {});

        if (!user) {
            return res.status(404).json(new apiResponse(404, responseMessage?.getDataNotFound("user"), {}, {}));
        }

        return res.status(200).json(new apiResponse(200, responseMessage?.getDataSuccess("user"), user, {}));

    } catch (error) {
        console.error('Get user by ID error:', error);
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, error));
    }
};

// Update user
export const updateUser = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const currentUser = req.user;
        const updateDataBody = req.body;

        // Remove sensitive fields from update data
        delete updateDataBody.password;
        delete updateDataBody.email; // Email should not be updated through this endpoint
        delete updateDataBody.role; // Role should be updated through admin endpoint

        // Check if user exists
        const existingUser = await getFirstMatch(userModel, { _id: id, isDeleted: false }, {}, {});
        if (!existingUser) {
            return res.status(404).json(new apiResponse(404, responseMessage?.getDataNotFound("user"), {}, {}));
        }

        // Check permissions
        if (currentUser.role === ROLES.EMPLOYEE && currentUser._id.toString() !== id) {
            return res.status(403).json(new apiResponse(403, 'You can only update your own profile', {}, {}));
        }

        // Update user
        const updatedUser = await updateData(userModel, { _id: id }, { ...updateDataBody, updatedAt: new Date() }, {});

        return res.status(200).json(new apiResponse(200, responseMessage?.updateDataSuccess("user"), updatedUser, {}));

    } catch (error) {
        console.error('Update user error:', error);
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, error));
    }
};

// Delete user (soft delete)
export const deleteUser = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const currentUser = req.user;

        // Check if user exists
        const existingUser = await getFirstMatch(userModel, { _id: id, isDeleted: false }, {}, {});
        if (!existingUser) {
            return res.status(404).json(new apiResponse(404, responseMessage?.getDataNotFound("user"), {}, {}));
        }

        // Check permissions - only admin can delete users
        if (currentUser.role !== ROLES.ADMIN) {
            return res.status(403).json(new apiResponse(403, 'Only admin can delete users', {}, {}));
        }

        // Prevent admin from deleting themselves
        if (currentUser._id.toString() === id) {
            return res.status(400).json(new apiResponse(400, 'Cannot delete your own account', {}, {}));
        }

        // Soft delete user
        await updateData(userModel, { _id: id }, {
            isDeleted: true,
            updatedAt: new Date()
        }, {});

        return res.status(200).json(new apiResponse(200, responseMessage?.deleteDataSuccess("user"), {}, {}));

    } catch (error) {
        console.error('Delete user error:', error);
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, error));
    }
};

// Update user role (admin only)
export const updateUserRole = async (req: AuthRequest, res: Response) => {
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
export const updateUserStatus = async (req: AuthRequest, res: Response) => {
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