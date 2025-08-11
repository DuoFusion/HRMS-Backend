import { Request, Response, NextFunction } from 'express';
import { apiResponse, ROLES } from '../common';

interface AuthRequest extends Request {
    user?: any;
}

// Role-based access control middleware
export const requireRole = (allowedRoles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required',
                data: null
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Insufficient permissions',
                data: null
            });
        }

        next();
    };
};

// Specific role middleware functions
export const requireAdmin = requireRole([ROLES.ADMIN]);
export const requireHR = requireRole([ROLES.ADMIN, ROLES.HR]);
export const requireProjectManager = requireRole([ROLES.ADMIN, ROLES.PROJECT_MANAGER]);
export const requireEmployee = requireRole([ROLES.ADMIN, ROLES.HR, ROLES.PROJECT_MANAGER, ROLES.EMPLOYEE]);

// Check if user can access specific user data
export const canAccessUser = (req: AuthRequest, res: Response, next: NextFunction) => {
    const targetUserId = req.params.id;
    const currentUser: any = req.headers.user;

    // Admin can access all users
    if (currentUser?.role === ROLES.ADMIN) {
        return next();
    }

    // HR can access all employees
    if (currentUser?.role === ROLES.HR) {
        return next();
    }

    // Project Manager can access employees
    if (currentUser.role === ROLES.PROJECT_MANAGER) {
        return next();
    }

    // Employee can only access their own profile
    if (currentUser.role === ROLES.EMPLOYEE) {
        if (currentUser._id.toString() === targetUserId) {
            return next();
        }
        return res.status(403).json(new apiResponse(403, 'You can only access your own profile', {}, {}));
    }

    return res.status(403).json(new apiResponse(403, 'Insufficient permissions', {}, {}));
}; 