import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../../../config';
import { apiResponse, getUniqueOtp, ROLES } from '../../common';
import { createData, email_verification_mail, getFirstMatch, reqInfo, responseMessage, updateData } from '../../helper';
import { moduleModel, permissionModel, roleModel, userModel } from '../../database';
import { forgotPasswordSchema, loginSchema, otpVerifySchema, resetPasswordSchema } from '../../validation';

const ObjectId = require("mongoose").Types.ObjectId

const generateToken = (userId: string, role: string) => {
    return jwt.sign({ userId, role }, config.JWT_TOKEN_SECRET, { expiresIn: '4h' });
};

export const register = async (req, res) => {
    reqInfo(req)
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
    reqInfo(req)
    try {
        const { error, value } = await loginSchema.validate(req.body)
        if (error) return res.status(501).json(new apiResponse(501, error?.details[0]?.message, {}, {}))

        const user = await getFirstMatch(userModel, { email: value.email, isDeleted: false }, {}, {});
        if (!user) return res.status(401).json(new apiResponse(401, 'Invalid email or password', {}, {}));

        if (user.isBlocked) return res.status(403).json(new apiResponse(403, 'Account is blocked', {}, {}));

        const isPasswordValid = await bcrypt.compare(value.password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json(new apiResponse(401, responseMessage?.invalidUserPasswordEmail, {}, {}))
        }

        await updateData(userModel, { _id: new ObjectId(user._id), isDeleted: false }, { lastLoginAt: new Date() }, {});

        const token = generateToken(user._id.toString(), user.role);

        // Prepare response data
        const userResponse = {
            _id: user._id,
            profilePhoto: user.profilePhoto,
            fullName: user.fullName,
            email: user.email,
            role: user.role,
        };

        let roleData = await roleModel.aggregate([
            {
                $match: {
                    $expr: {
                        $eq: [
                            { $toUpper: "$name" },
                            String(user.role).toUpperCase(),
                        ],
                    },
                },
            },
        ]);
        roleData = roleData[0];
        let moduleData = [];
        moduleData = await moduleModel.find({ isActive: true }).sort({ number: 1 }).lean();
        let response = { ...userResponse, roleData, moduleData }
        if (response.roleData && response.roleData._id) {
            let newRoleDetailData = [],
                newRoleDetailObj: any = {};
            const roleDetailData = await permissionModel.find({ roleId: new ObjectId(response.roleData._id) });
            if (roleDetailData && roleDetailData.length > 0) {
                moduleData.forEach((item) => {
                    let roleDetail = roleDetailData?.find(
                        (item2) =>
                            item2.roleId.toString() === response.roleData._id.toString() &&
                            item2.moduleId.toString() === item._id.toString(),
                    );
                    newRoleDetailObj = {
                        hasView: roleDetail?.view || false,
                        hasAdd: roleDetail?.add || false,
                        hasEdit: roleDetail?.edit || false,
                        hasDelete: roleDetail?.delete || false,
                    };

                    newRoleDetailData.push({
                        ...item,
                        ...newRoleDetailObj,
                    });
                });
            }
            moduleData = newRoleDetailData;
        }
        return res.status(200).json(new apiResponse(200, 'Login successful', { ...response, moduleData, token }, {}));

    } catch (error) {
        console.log('Login error:', error);
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, error));
    }
};

export const otp_verification = async (req, res) => {
    reqInfo(req)
    try {
        const { error, value } = otpVerifySchema.validate(req.body)
        if (error) return res.status(501).json(new apiResponse(501, error?.details[0]?.message, {}, {}));

        let data = await getFirstMatch(userModel, value);

        if (!data) return res.status(400).json(new apiResponse(400, responseMessage?.invalidOTP, {}, {}))
        if (data.isBlocked == true) return res.status(403).json(new apiResponse(403, responseMessage?.accountBlock, {}, {}))
        if (new Date(data.otpExpireTime).getTime() < new Date().getTime()) return res.status(410).json(new apiResponse(410, responseMessage?.expireOTP, {}, {}))

        if (data) {
            const token = await generateToken(data._id, data?.role)

            const result = {
                isEmailVerified: data?.isEmailVerified,
                _id: data?._id,
                email: data?.email,
                userType: data?.user,
                token,
            }
            return res.status(200).json(new apiResponse(200, responseMessage?.OTPVerified, result, {}))
        }

    } catch (error) {
        console.log(error);
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, error))
    }
}

export const forgot_password = async (req, res) => {
    reqInfo(req);
    try {
        const { error, value } = forgotPasswordSchema.validate(req.body)
        if (error) return res.status(501).json(new apiResponse(501, error?.details[0]?.message, {}, {}));

        let data = await userModel.findOne({ email: value?.email, isDeleted: false }).lean()
        if (!data) return res.status(400).json(new apiResponse(400, responseMessage?.invalidEmail, {}, {}));

        if (data.isBlocked == true) return res.status(403).json(new apiResponse(403, responseMessage?.accountBlock, {}, {}));

        const otp = await getUniqueOtp()
        const otpExpireTime = new Date(Date.now() + 1 * 60 * 1000); // 1 minute from now
        email_verification_mail(data, otp);
        let response = await userModel.findOneAndUpdate({ _id: new ObjectId(data?._id) }, { otp, otpExpireTime }, { new: true })

        if (response) return res.status(200).json(new apiResponse(200, responseMessage?.otpSendSuccess, {}, {}));
        return res.status(404).json(new apiResponse(404, responseMessage?.errorMail, {}, `${response}`));

    } catch (error) {
        console.log(error)
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, error));
    }
};

export const reset_password = async (req, res) => {
    reqInfo(req)
    try {
        const { error, value } = await resetPasswordSchema.validate(req.body)
        if (error) return res.status(501).json(new apiResponse(501, error?.details[0]?.message, {}, {}))

        const admin = await getFirstMatch(userModel, { _id: new ObjectId(value.userId), isDeleted: false });
        if (!admin) return res.status(405).json(new apiResponse(405, responseMessage?.getDataNotFound('admin'), {}, {}));

        if (value.newPassword && value.oldPassword) {
            const isPasswordMatch = await bcrypt.compare(value.oldPassword, admin.password);
            if (!isPasswordMatch) return res.status(400).json(new apiResponse(400, 'Old password is incorrect', {}, {}));

            const salt = await bcrypt.genSaltSync(10)
            const hashPassword = await bcrypt.hash(value.newPassword, salt)
            delete value.oldPassword
            delete value.newPassword
            value.password = hashPassword
        }

        const response = await updateData(userModel, { _id: new ObjectId(value.userId), isDeleted: false }, value);
        if (!response) return res.status(405).json(new apiResponse(405, responseMessage?.updateDataError('admin'), {}, {}))
        return res.status(200).json(new apiResponse(200, responseMessage?.updateDataSuccess('admin'), response, {}))
    } catch (error) {
        console.log(error);
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, error))
    }
}

export const resend_otp = async (req, res) => {
    reqInfo(req);
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json(new apiResponse(400, 'Email is required', {}, {}));

        const user = await getFirstMatch(userModel, { email, isDeleted: false });
        if (!user) return res.status(404).json(new apiResponse(404, responseMessage?.getDataNotFound('user'), {}, {}));
        if (user.isBlocked) return res.status(403).json(new apiResponse(403, responseMessage?.accountBlock, {}, {}));

        const otp = await getUniqueOtp();
        const otpExpireTime = new Date(Date.now() + 1 * 60 * 1000)

        await updateData(userModel, { _id: new ObjectId(user._id), isDeleted: false }, { otp, otpExpireTime });

        await email_verification_mail(user, otp);

        return res.status(200).json(new apiResponse(200, 'OTP resent successfully', {}, {}));
    } catch (error) {
        console.log(error);
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, error));
    }
}

// Get current user profile
export const get_profile = async (req, res) => {
    let { user } = req.headers
    try {

        const response = await getFirstMatch(userModel, { _id: new ObjectId(user._id), isDeleted: false });
        if (!response) return res.status(404).json(new apiResponse(404, responseMessage?.getDataNotFound('user'), {}, {}));

        const userResponse = {
            _id: response._id,
            fullName: response.fullName,
            email: response.email,
            role: response.role,
            department: response.department,
            designation: response.designation,
            contactNumber: response.contactNumber,
            profilePhoto: response.profilePhoto,
            isEmailVerified: response.isEmailVerified,
            lastLoginAt: response.lastLoginAt,
            createdAt: response.createdAt,
            updatedAt: response.updatedAt
        };

        return res.status(200).json(new apiResponse(200, responseMessage?.getDataSuccess("profile"), userResponse, {}));

    } catch (error) {
        console.log('Get profile error:', error);
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, error));
    }
}; 