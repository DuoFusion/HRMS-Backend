const mongoose = require('mongoose')
import { ROLES } from "../../common";

const roleSchema: any = new mongoose.Schema({
    name: { type: String, enum: Object.values(ROLES) },
    isDeleted: { type: Boolean, default: false },
    isBlocked: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
}, { timestamps: true, versionKey: false })

export const roleModel = mongoose.model('role', roleSchema);