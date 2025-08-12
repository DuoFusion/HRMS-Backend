import { object } from "joi";
import mongoose from "mongoose";
import { DAY_TYPE, LEAVE_STATUS, LEAVE_TYPE } from "../../common";

const leaveSchema = new mongoose.Schema({

    userId: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
    startDate: { type: Date },
    endDate: { type: Date },
    type: { type: String, enum: Object.values(LEAVE_TYPE) },
    reason: { type: String },
    status: { type: String, enum: Object.values(LEAVE_STATUS) },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, },
    approvedAy: { type: Boolean, default: false },
    dayType: { type: String, enum: Object.values(DAY_TYPE), default: "full" },
    isDeleted: { type: Boolean, default: false },
}, {
    timestamps: true, versionKey: false
});

export const leaveModel = mongoose.model('leave', leaveSchema);