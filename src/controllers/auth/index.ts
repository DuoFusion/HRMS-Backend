import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../../../config';
import { apiResponse, ROLES } from '../../common';
import { createData, getFirstMatch, responseMessage, updateData } from '../../helper';
import { userModel } from '../../database';

const generateToken = (userId: string, role: string) => {
    return jwt.sign({ userId, role }, config.JWT_TOKEN_SECRET, { expiresIn: '24h' });
};

export const register = async (req, res) => {
    let body = req.body, { user } = req.headers;
    try {

        if (body.role === ROLES.ADMIN && user.role !== ROLES.ADMIN) return res.status(403).json(new apiResponse(403, 'Only admin can create admin users', {}, {}));

        let existingUser = await getFirstMatch(userModel, { fullName: body.fullName, isDeleted: false }, {}, {});
        if (existingUser) return res.status(409).json(new apiResponse(409, responseMessage?.dataAlreadyExist("name"), {}, {}));

        existingUser = await getFirstMatch(userModel, { email: body.email, isDeleted: false }, {}, {});
        if (existingUser) return res.status(409).json(new apiResponse(409, responseMessage?.dataAlreadyExist("email"), {}, {}));

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(body.password, saltRounds);
        body.password = hashedPassword
        body.fullName = body.firstName + " " + body.lastName

        const newUser = await createData(userModel, body);

        return res.status(200).json(new apiResponse(200, responseMessage?.addDataSuccess("user"), newUser, {}));
    } catch (error) {
        console.error('Registration error:', error);
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, error));
    }
};

export const login = async (req, res) => {
    const { email, password } = req.body;
    try {

        if (!email || !password) return res.status(400).json(400, new apiResponse(400, 'Email and password are required', {}, {}));

        const user = await getFirstMatch(userModel, { email, isDeleted: false }, {}, {});
        if (!user) return res.status(401).json(new apiResponse(401, 'Invalid email or password', {}, {}));

        if (user.isBlocked) return res.status(403).json(new apiResponse(403, 'Account is blocked', {}, {}));

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json(new apiResponse(401, responseMessage?.invalidUserPasswordEmail, {}, {}))
        }

        await updateData(userModel, { _id: user._id, isDeleted: false }, { lastLoginAt: new Date() }, {});

        const token = generateToken(user._id.toString(), user.role);

        // Prepare response data
        const userResponse = {
            _id: user._id,
            fullName: user.fullName,
            email: user.email,
            role: user.role,
        };

        return res.status(200).json(new apiResponse(200, 'Login successful', { user: userResponse, token }, {}));

    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, error));
    }
};

// Get current user profile
export const getProfile = async (req, res) => {
    try {
        const user = req.user;

        const userResponse = {
            _id: user._id,
            fullName: user.fullName,
            email: user.email,
            role: user.role,
            department: user.department,
            designation: user.designation,
            contactNumber: user.contactNumber,
            profilePhoto: user.profilePhoto,
            isEmailVerified: user.isEmailVerified,
            lastLoginAt: user.lastLoginAt,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        };

        return res.status(200).json(new apiResponse(200, responseMessage?.getDataSuccess("profile"), userResponse, {}));

    } catch (error) {
        console.error('Get profile error:', error);
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, error));
    }
}; 