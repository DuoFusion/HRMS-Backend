const mongoose = require('mongoose')
import { LEAVE_DAY_TYPE, LEAVE_STATUS, LEAVE_TYPE } from "../../common";

const leaveSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
    startDate: { type: Date },
    endDate: { type: Date },
    type: { type: String, enum: Object.values(LEAVE_TYPE) },
    reason: { type: String },
    count: { type: Number, default: 0 },
    status: { type: String, enum: Object.values(LEAVE_STATUS), default: LEAVE_STATUS.PENDING },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
    dayType: { type: String, enum: Object.values(LEAVE_DAY_TYPE), default: LEAVE_DAY_TYPE.FULL },
    isDeleted: { type: Boolean, default: false },
}, { timestamps: true, versionKey: false });

export const leaveModel = mongoose.model('leave', leaveSchema);