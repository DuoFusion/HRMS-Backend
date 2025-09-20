import { userModuleAccessModel, permissionModel, userModel, moduleModel } from '../database';
import { ROLES } from '../common';

const ObjectId = require("mongoose").Types.ObjectId;

// Middleware to validate module access for a user
export const VALIDATE_MODULE_ACCESS = (requiredPermission: 'view' | 'add' | 'edit' | 'delete') => {
    return async (req: any, res: any, next: any) => {
        try {
            const { user } = req.headers;
            const { moduleName } = req.params; // Assuming module name is passed in URL params
            
            if (!user) {
                return res.status(401).json({ success: false, message: 'User not authenticated' });
            }

            // Find the module by name
            const module = await moduleModel.findOne({ 
                tabName: moduleName, 
                isDeleted: false 
            });

            if (!module) {
                return res.status(404).json({ success: false, message: 'Module not found' });
            }

            // Check if user has access through role-based permissions
            const rolePermission = await permissionModel.findOne({
                roleId: user.roleId,
                moduleId: module._id,
                isActive: true
            });

            // Check if user has specific module access
            const userAccess = await userModuleAccessModel.findOne({
                userId: user._id,
                moduleId: module._id,
                isDeleted: false,
                isActive: true,
                $or: [
                    { expiresAt: null },
                    { expiresAt: { $gt: new Date() } }
                ]
            });

            // Determine effective permission
            let hasPermission = false;
            let permissionSource = 'none';

            if (userAccess && userAccess[requiredPermission]) {
                hasPermission = true;
                permissionSource = 'user';
            } else if (rolePermission && rolePermission[requiredPermission]) {
                hasPermission = true;
                permissionSource = 'role';
            }

            // Super admin always has access
            if (user.role === ROLES.SUPER_ADMIN) {
                hasPermission = true;
                permissionSource = 'super_admin';
            }

            if (!hasPermission) {
                return res.status(403).json({ 
                    success: false, 
                    message: `Access denied. You don't have ${requiredPermission} permission for this module.`,
                    requiredPermission,
                    moduleName
                });
            }

            // Add permission info to request for use in controllers
            req.moduleAccess = {
                moduleId: module._id,
                moduleName: module.tabName,
                permission: requiredPermission,
                source: permissionSource,
                hasAccess: true
            };

            next();
        } catch (error) {
            console.error('Module access validation error:', error);
            return res.status(500).json({ 
                success: false, 
                message: 'Error validating module access' 
            });
        }
    };
};

// Helper function to check if user has specific module access
export const checkUserModuleAccess = async (userId: string, moduleId: string, permission: 'view' | 'add' | 'edit' | 'delete') => {
    try {
        const user = await userModel.findById(userId);
        if (!user) return { hasAccess: false, source: 'user_not_found' };

        // Super admin always has access
        if (user.role === ROLES.SUPER_ADMIN) {
            return { hasAccess: true, source: 'super_admin' };
        }

        // Check role-based permission
        const rolePermission = await permissionModel.findOne({
            roleId: user.roleId,
            moduleId: new ObjectId(moduleId),
            isActive: true
        });

        // Check user-specific permission
        const userAccess = await userModuleAccessModel.findOne({
            userId: new ObjectId(userId),
            moduleId: new ObjectId(moduleId),
            isDeleted: false,
            isActive: true,
            $or: [
                { expiresAt: null },
                { expiresAt: { $gt: new Date() } }
            ]
        });

        // User-specific access overrides role-based access
        if (userAccess && userAccess[permission]) {
            return { hasAccess: true, source: 'user' };
        }

        if (rolePermission && rolePermission[permission]) {
            return { hasAccess: true, source: 'role' };
        }

        return { hasAccess: false, source: 'none' };
    } catch (error) {
        console.error('Error checking user module access:', error);
        return { hasAccess: false, source: 'error' };
    }
};

// Middleware to validate multiple module permissions
export const VALIDATE_MULTIPLE_MODULE_ACCESS = (permissions: Array<{ module: string, permission: 'view' | 'add' | 'edit' | 'delete' }>) => {
    return async (req: any, res: any, next: any) => {
        try {
            const { user } = req.headers;
            
            if (!user) {
                return res.status(401).json({ success: false, message: 'User not authenticated' });
            }

            const accessResults = [];

            for (const { module, permission } of permissions) {
                const moduleDoc = await moduleModel.findOne({ 
                    tabName: module, 
                    isDeleted: false 
                });

                if (!moduleDoc) {
                    accessResults.push({ module, permission, hasAccess: false, reason: 'Module not found' });
                    continue;
                }

                const accessCheck = await checkUserModuleAccess(user._id, moduleDoc._id.toString(), permission);
                accessResults.push({ 
                    module, 
                    permission, 
                    hasAccess: accessCheck.hasAccess, 
                    source: accessCheck.source 
                });
            }

            // Check if user has access to all required modules
            const hasAllAccess = accessResults.every(result => result.hasAccess);

            if (!hasAllAccess) {
                return res.status(403).json({ 
                    success: false, 
                    message: 'Access denied. Missing required permissions.',
                    accessResults
                });
            }

            req.moduleAccessResults = accessResults;
            next();
        } catch (error) {
            console.error('Multiple module access validation error:', error);
            return res.status(500).json({ 
                success: false, 
                message: 'Error validating module access' 
            });
        }
    };
};

// Middleware to get user's accessible modules
export const GET_USER_ACCESSIBLE_MODULES = async (req, res, next) => {
    try {
        const { user } = req.headers;
        
        if (!user) {
            return res.status(401).json({ success: false, message: 'User not authenticated' });
        }

        // Get all modules
        const allModules = await moduleModel.find({ isDeleted: false }).sort({ number: 1 });

        const accessibleModules = [];

        for (const module of allModules) {
            // Check role-based permission
            const rolePermission = await permissionModel.findOne({
                roleId: user.roleId,
                moduleId: module._id,
                isActive: true
            });

            // Check user-specific permission
            const userAccess = await userModuleAccessModel.findOne({
                userId: user._id,
                moduleId: module._id,
                isDeleted: false,
                isActive: true,
                $or: [
                    { expiresAt: null },
                    { expiresAt: { $gt: new Date() } }
                ]
            });

            const modulePermissions = {
                view: false,
                add: false,
                edit: false,
                delete: false
            };

            // Super admin has all permissions
            if (user.role === ROLES.SUPER_ADMIN) {
                modulePermissions.view = true;
                modulePermissions.add = true;
                modulePermissions.edit = true;
                modulePermissions.delete = true;
            } else {
                // User-specific permissions override role permissions
                if (userAccess) {
                    modulePermissions.view = userAccess.view;
                    modulePermissions.add = userAccess.add;
                    modulePermissions.edit = userAccess.edit;
                    modulePermissions.delete = userAccess.delete;
                } else if (rolePermission) {
                    modulePermissions.view = rolePermission.view;
                    modulePermissions.add = rolePermission.add;
                    modulePermissions.edit = rolePermission.edit;
                    modulePermissions.delete = rolePermission.delete;
                }
            }

            // Only include modules where user has at least view permission
            if (modulePermissions.view) {
                accessibleModules.push({
                    ...module.toObject(),
                    permissions: modulePermissions,
                    accessSource: userAccess ? 'user' : (rolePermission ? 'role' : 'super_admin')
                });
            }
        }

        req.accessibleModules = accessibleModules;
        next();
    } catch (error) {
        console.error('Error getting user accessible modules:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Error getting accessible modules' 
        });
    }
};
