const mongoose = require('mongoose')
import { strict } from "assert";
import { ROLES, RELATION } from "../../common";
import { number, string } from "joi";

const userSchema: any = new mongoose.Schema({
    firstName: { type: String },
    lastName: { type: String },
    fullName: { type: String },
    email: { type: String },
    password: { type: String },
    salary: { type: Number },
    role: { type: String, enum: Object.values(ROLES) },
    roleId: { type: mongoose.Schema.Types.ObjectId, ref: "role" },
    bankDetails: {
        upiId: { type: String },
        accountNumber: { type: String },
        ifscCode: { type: String },
        bankName: { type: String },
        nameAsPerBank: { type: String },
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
    contactNumber: { type: String },
    profilePhoto: { type: String, default: null },
    isEmailVerified: { type: Boolean, default: false },
    otp: { type: Number },
    otpExpireTime: { type: Date },
    isDeleted: { type: Boolean, default: false },
    isBlocked: { type: Boolean, default: false },
    lastLoginAt: { type: Date, default: null },
}, { timestamps: true, versionKey: false })

export const userModel = mongoose.model('user', userSchema);