const mongoose = require('mongoose')
import { ROLES } from "../../common";

const userSchema: any = new mongoose.Schema({
    firstName: { type: String },
    lastName: { type: String },
    fullName: { type: String },
    email: { type: String },
    password: { type: String },
    role: { type: String, enum: Object.values(ROLES) },
    roleId: { type: mongoose.Schema.Types.ObjectId, ref: "role" },
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