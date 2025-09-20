const mongoose = require('mongoose')

const userModuleAccessSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
    moduleId: { type: mongoose.Schema.Types.ObjectId, ref: "module", required: true },
    view: { type: Boolean, default: false },
    add: { type: Boolean, default: false },
    edit: { type: Boolean, default: false },
    delete: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    grantedBy: { type: mongoose.Schema.Types.ObjectId, ref: "user" }, // Who granted this access
    grantedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, default: null }, // Optional expiration date
    reason: { type: String, default: null }, // Reason for granting access
    isDeleted: { type: Boolean, default: false },
}, { timestamps: true, versionKey: false })

// Compound index to ensure unique user-module combinations
userModuleAccessSchema.index({ userId: 1, moduleId: 1 }, { unique: true })

export const userModuleAccessModel = mongoose.model('userModuleAccess', userModuleAccessSchema);
