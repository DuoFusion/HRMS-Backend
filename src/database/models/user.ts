const mongoose = require('mongoose')
import { ROLES, RELATION } from "../../common";

const userSchema: any = new mongoose.Schema({
    firstName: { type: String },
    lastName: { type: String },
    fullName: { type: String },
    email: { type: String },
    phoneNumber: { type: String },
    password: { type: String },
    displayPassword: { type: String },
    salary: { type: Number },
    dob: { type: Date },
    joiningDate: { type: Date },
    role: { type: String, enum: Object.values(ROLES) },
    roleId: { type: mongoose.Schema.Types.ObjectId, ref: "role" },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "company" },
    bankDetails: {
        upiId: { type: String },
        accountNumber: { type: String },
        ifscCode: { type: String },
        bankName: { type: String },
        name: { type: String },
    },
    parentsDetails: {
        number: { type: String },
        name: { type: String },
        relation: { type: String, enum: Object.values(RELATION) }
    },
    aadharCardNumber: { type: String },
    panCardNumber: { type: String },
    position: { type: String },
    department: { type: String },
    designation: { type: String },
    workingTime: {
        start: { type: String },
        end: { type: String }
    },
    profilePhoto: { type: String, default: null },
    isEmailVerified: { type: Boolean, default: false },
    otp: { type: Number },
    otpExpireTime: { type: Date, default: null },
    isDeleted: { type: Boolean, default: false },
    isBlocked: { type: Boolean, default: false },
    lastLoginAt: { type: Date, default: null },
}, { timestamps: true, versionKey: false })

export const userModel = mongoose.model('user', userSchema);