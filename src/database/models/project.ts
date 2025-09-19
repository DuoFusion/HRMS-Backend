const mongoose = require('mongoose');
import { PROJECT_STATUS, TASK_TYPE } from "../../common";

const projectSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "company" },
    name: { type: String },
    description: { type: String },
    userIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'user' }],
    status: { type: String, enum: Object.values(PROJECT_STATUS) },
    startDate: { type: Date },
    endDate: { type: Date },
    remarks: [{
        text: { type: String },
        type: { type: String, enum: Object.values(TASK_TYPE) },
    }],
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "user" }, 
    isDeleted: { type: Boolean, default: false },
    isBlocked: { type: Boolean, default: false },
}, { timestamps: true, versionKey: false })

export const projectModel = mongoose.model('project', projectSchema);