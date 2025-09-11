import { REMARK_TYPE } from "../../common";

const mongoose = require('mongoose');

const remarkSchema = new mongoose.Schema({
    note: { type: String },
    type: { type: String, enum: Object.values(REMARK_TYPE) },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "company" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
    isDeleted: { type: Boolean, default: false }
}, { timestamps: true, versionKey: false })

export const remarkModel = mongoose.model('remark', remarkSchema);