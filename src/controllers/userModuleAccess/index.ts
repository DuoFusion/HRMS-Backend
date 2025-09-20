import { apiResponse, ROLES } from '../../common';
import { countData, createData, findAllWithPopulateWithSorting, getData, getDataWithSorting, getFirstMatch, reqInfo, responseMessage, updateData, aggregateData } from '../../helper';
import { userModuleAccessModel, userModel, moduleModel, permissionModel } from '../../database';
import { 
    grantUserModuleAccessSchema, 
    updateUserModuleAccessSchema, 
    getUserModuleAccessSchema, 
    revokeUserModuleAccessSchema,
    bulkGrantUserModuleAccessSchema 
} from '../../validation';

const ObjectId = require("mongoose").Types.ObjectId;

// Grant module access to a specific user
export const grant_user_module_access = async (req, res) => {
    reqInfo(req);
    const { user } = req.headers;
    try {
        const { error, value } = grantUserModuleAccessSchema.validate(req.body);
        if (error) return res.status(501).json(new apiResponse(501, error?.details[0]?.message, {}, {}));

        // Check if user exists
        const targetUser = await getFirstMatch(userModel, { _id: new ObjectId(value.userId), isDeleted: false }, {}, {});
        if (!targetUser) return res.status(404).json(new apiResponse(404, "User not found", {}, {}));

        // Check if module exists
        const module = await getFirstMatch(moduleModel, { _id: new ObjectId(value.moduleId), isDeleted: false }, {}, {});
        if (!module) return res.status(404).json(new apiResponse(404, "Module not found", {}, {}));

        // Check if access already exists
        const existingAccess = await getFirstMatch(userModuleAccessModel, { 
            userId: new ObjectId(value.userId), 
            moduleId: new ObjectId(value.moduleId),
            isDeleted: false 
        }, {}, {});

        if (existingAccess) {
            return res.status(400).json(new apiResponse(400, "Module access already exists for this user", {}, {}));
        }

        const accessData = {
            userId: new ObjectId(value.userId),
            moduleId: new ObjectId(value.moduleId),
            view: value.view,
            add: value.add,
            edit: value.edit,
            delete: value.delete,
            isActive: value.isActive,
            grantedBy: new ObjectId(user._id),
            expiresAt: value.expiresAt,
            reason: value.reason
        };

        const response = await createData(userModuleAccessModel, accessData);
        if (!response) return res.status(404).json(new apiResponse(404, responseMessage?.addDataError, {}, {}));

        return res.status(200).json(new apiResponse(200, "Module access granted successfully", response, {}));
    } catch (error) {
        console.log(error);
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, error));
    }
};

// Update user module access
export const update_user_module_access = async (req, res) => {
    reqInfo(req);
    try {
        const { error, value } = updateUserModuleAccessSchema.validate(req.body);
        if (error) return res.status(501).json(new apiResponse(501, error?.details[0]?.message, {}, {}));

        const existingAccess = await getFirstMatch(userModuleAccessModel, { 
            _id: new ObjectId(value.accessId), 
            isDeleted: false 
        }, {}, {});

        if (!existingAccess) {
            return res.status(404).json(new apiResponse(404, "Module access not found", {}, {}));
        }

        const newData = {
            ...(value.view !== undefined && { view: value.view }),
            ...(value.add !== undefined && { add: value.add }),
            ...(value.edit !== undefined && { edit: value.edit }),
            ...(value.delete !== undefined && { delete: value.delete }),
            ...(value.isActive !== undefined && { isActive: value.isActive }),
            ...(value.expiresAt !== undefined && { expiresAt: value.expiresAt }),
            ...(value.reason !== undefined && { reason: value.reason })
        };

        const response = await updateData(userModuleAccessModel, { _id: new ObjectId(value.accessId) }, newData, { new: true });
        if (!response) return res.status(404).json(new apiResponse(404, responseMessage?.updateDataError("module access"), {}, {}));

        return res.status(200).json(new apiResponse(200, "Module access updated successfully", response, {}));
    } catch (error) {
        console.log(error);
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, error));
    }
};

// Get all module access for a specific user
export const get_user_module_access = async (req, res) => {
    reqInfo(req);
    const { user } = req.headers;
    try {
        const { error, value } = getUserModuleAccessSchema.validate(req.query);
        if (error) return res.status(501).json(new apiResponse(501, error?.details[0]?.message, {}, {}));

        const { userId, page, limit, search, activeFilter } = value;
        const criteria: any = { userId: new ObjectId(userId), isDeleted: false };
        const options: any = { sort: { createdAt: -1 } };

        // Check if user exists
        const targetUser = await getFirstMatch(userModel, { _id: new ObjectId(userId), isDeleted: false }, {}, {});
        if (!targetUser) return res.status(404).json(new apiResponse(404, "User not found", {}, {}));

        // Apply filters
        if (activeFilter !== undefined) {
            criteria.isActive = activeFilter;
        }

        if (page && limit) {
            options.skip = (parseInt(page) - 1) * parseInt(limit);
            options.limit = parseInt(limit);
        }

        const populate = [
            { path: "moduleId", select: "tabName displayName tabUrl number parentId" },
            { path: "grantedBy", select: "fullName email" }
        ];

        const response = await findAllWithPopulateWithSorting(userModuleAccessModel, criteria, {}, options, populate);
        const totalCount = await countData(userModuleAccessModel, criteria);

        // Filter by search if provided
        let filteredResponse = response;
        if (search) {
            filteredResponse = response.filter((access: any) => 
                access.moduleId?.tabName?.toLowerCase().includes(search.toLowerCase()) ||
                access.moduleId?.displayName?.toLowerCase().includes(search.toLowerCase())
            );
        }

        const stateObj = {
            page: parseInt(page) || 1,
            limit: parseInt(limit) || totalCount,
            page_limit: Math.ceil(totalCount / (parseInt(limit) || totalCount)) || 1,
        };

        return res.status(200).json(new apiResponse(200, responseMessage?.getDataSuccess('user module access'), {
            access_data: filteredResponse || [],
            totalData: totalCount,
            state: stateObj
        }, {}));
    } catch (error) {
        console.log(error);
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, error));
    }
};

// Revoke user module access
export const revoke_user_module_access = async (req, res) => {
    reqInfo(req);
    try {
        const { error, value } = revokeUserModuleAccessSchema.validate(req.body);
        if (error) return res.status(501).json(new apiResponse(501, error?.details[0]?.message, {}, {}));

        const existingAccess = await getFirstMatch(userModuleAccessModel, { 
            _id: new ObjectId(value.accessId), 
            isDeleted: false 
        }, {}, {});

        if (!existingAccess) {
            return res.status(404).json(new apiResponse(404, "Module access not found", {}, {}));
        }

        const response = await updateData(userModuleAccessModel, { _id: new ObjectId(value.accessId) }, { 
            isDeleted: true,
            reason: value.reason || "Access revoked"
        }, { new: true });

        if (!response) return res.status(404).json(new apiResponse(404, responseMessage?.updateDataError("module access"), {}, {}));

        return res.status(200).json(new apiResponse(200, "Module access revoked successfully", {}, {}));
    } catch (error) {
        console.log(error);
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, error));
    }
};

// Bulk grant module access to a user
export const bulk_grant_user_module_access = async (req, res) => {
    reqInfo(req);
    const { user } = req.headers;
    try {
        const { error, value } = bulkGrantUserModuleAccessSchema.validate(req.body);
        if (error) return res.status(501).json(new apiResponse(501, error?.details[0]?.message, {}, {}));

        const { userId, modules } = value;

        // Check if user exists
        const targetUser = await getFirstMatch(userModel, { _id: new ObjectId(userId), isDeleted: false }, {}, {});
        if (!targetUser) return res.status(404).json(new apiResponse(404, "User not found", {}, {}));

        const results = [];
        const errors = [];

        for (const moduleAccess of modules) {
            try {
                // Check if module exists
                const module = await getFirstMatch(moduleModel, { _id: new ObjectId(moduleAccess.moduleId), isDeleted: false }, {}, {});
                if (!module) {
                    errors.push({ moduleId: moduleAccess.moduleId, error: "Module not found" });
                    continue;
                }

                // Check if access already exists
                const existingAccess = await getFirstMatch(userModuleAccessModel, { 
                    userId: new ObjectId(userId), 
                    moduleId: new ObjectId(moduleAccess.moduleId),
                    isDeleted: false 
                }, {}, {});

                if (existingAccess) {
                    errors.push({ moduleId: moduleAccess.moduleId, error: "Access already exists" });
                    continue;
                }

                const accessData = {
                    userId: new ObjectId(userId),
                    moduleId: new ObjectId(moduleAccess.moduleId),
                    view: moduleAccess.view,
                    add: moduleAccess.add,
                    edit: moduleAccess.edit,
                    delete: moduleAccess.delete,
                    isActive: moduleAccess.isActive,
                    grantedBy: new ObjectId(user._id),
                    expiresAt: moduleAccess.expiresAt,
                    reason: moduleAccess.reason
                };

                const response = await createData(userModuleAccessModel, accessData);
                results.push(response);
            } catch (moduleError) {
                errors.push({ moduleId: moduleAccess.moduleId, error: moduleError.message });
            }
        }

        return res.status(200).json(new apiResponse(200, "Bulk module access operation completed", {
            successful: results,
            errors: errors,
            totalProcessed: modules.length,
            successCount: results.length,
            errorCount: errors.length
        }, {}));
    } catch (error) {
        console.log(error);
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, error));
    }
};

// Get user's effective permissions (role + user-specific)
export const get_user_effective_permissions = async (req, res) => {
    reqInfo(req);
    try {
        const { userId } = req.params;
        
        if (!userId) {
            return res.status(400).json(new apiResponse(400, "User ID is required", {}, {}));
        }

        // Check if user exists
        const targetUser = await getFirstMatch(userModel, { _id: new ObjectId(userId), isDeleted: false }, {}, {});
        if (!targetUser) return res.status(404).json(new apiResponse(404, "User not found", {}, {}));

        // Get role-based permissions
        const rolePermissions = await permissionModel.find({ 
            roleId: targetUser.roleId,
            isActive: true 
        }).populate('moduleId', 'tabName displayName tabUrl number parentId');

        // Get user-specific permissions
        const userPermissions = await userModuleAccessModel.find({ 
            userId: new ObjectId(userId),
            isDeleted: false,
            isActive: true,
            $or: [
                { expiresAt: null },
                { expiresAt: { $gt: new Date() } }
            ]
        }).populate('moduleId', 'tabName displayName tabUrl number parentId');

        // Merge permissions (user-specific overrides role-based)
        const effectivePermissions = new Map();

        // Add role permissions first
        rolePermissions.forEach(perm => {
            const moduleId = perm.moduleId._id.toString();
            effectivePermissions.set(moduleId, {
                moduleId: perm.moduleId,
                view: perm.view,
                add: perm.add,
                edit: perm.edit,
                delete: perm.delete,
                source: 'role'
            });
        });

        // Override with user-specific permissions
        userPermissions.forEach(perm => {
            const moduleId = perm.moduleId._id.toString();
            effectivePermissions.set(moduleId, {
                moduleId: perm.moduleId,
                view: perm.view,
                add: perm.add,
                edit: perm.edit,
                delete: perm.delete,
                source: 'user',
                grantedBy: perm.grantedBy,
                grantedAt: perm.grantedAt,
                expiresAt: perm.expiresAt,
                reason: perm.reason
            });
        });

        const finalPermissions = Array.from(effectivePermissions.values());

        return res.status(200).json(new apiResponse(200, "User effective permissions retrieved successfully", {
            userId: userId,
            user: {
                fullName: targetUser.fullName,
                email: targetUser.email,
                role: targetUser.role,
                roleId: targetUser.roleId
            },
            permissions: finalPermissions.sort((a, b) => a.moduleId.number - b.moduleId.number)
        }, {}));
    } catch (error) {
        console.log(error);
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, error));
    }
};

// Get all users with their module access summary
export const get_users_module_access_summary = async (req, res) => {
    reqInfo(req);
    const { user } = req.headers;
    try {
        const { page = 1, limit = 10, search, roleFilter, companyFilter } = req.query;

        let criteria: any = { isDeleted: false };
        const options: any = { sort: { createdAt: -1 } };

        // Apply role-based filtering
        if (user.role === ROLES.PROJECT_MANAGER || user.role === ROLES.EMPLOYEE) {
            criteria._id = new ObjectId(user._id);
        }

        if (roleFilter) criteria.role = roleFilter;
        if (companyFilter) criteria.companyId = new ObjectId(companyFilter);

        if (search) {
            criteria.$or = [
                { fullName: { $regex: search, $options: 'si' } },
                { email: { $regex: search, $options: 'si' } },
                { department: { $regex: search, $options: 'si' } }
            ];
        }

        if (page && limit) {
            options.skip = (parseInt(page) - 1) * parseInt(limit);
            options.limit = parseInt(limit);
        }

        const populate = [
            { path: "companyId", select: "name" },
            { path: "roleId", select: "name" }
        ];

        const users = await findAllWithPopulateWithSorting(userModel, criteria, '-password', options, populate);
        const totalCount = await countData(userModel, criteria);

        // Get module access count for each user
        const usersWithAccess = await Promise.all(users.map(async (userData: any) => {
            const accessCount = await countData(userModuleAccessModel, { 
                userId: userData._id, 
                isDeleted: false, 
                isActive: true 
            });
            
            return {
                ...userData,
                moduleAccessCount: accessCount
            };
        }));

        const stateObj = {
            page: parseInt(page) || 1,
            limit: parseInt(limit) || totalCount,
            page_limit: Math.ceil(totalCount / (parseInt(limit) || totalCount)) || 1,
        };

        return res.status(200).json(new apiResponse(200, responseMessage?.getDataSuccess('users module access'), {
            users_data: usersWithAccess || [],
            totalData: totalCount,
            state: stateObj
        }, {}));
    } catch (error) {
        console.log(error);
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, error));
    }
};
