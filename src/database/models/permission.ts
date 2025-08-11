const mongoose = require('mongoose')

const permissionSchema = new mongoose.Schema({
    moduleId: { type: mongoose.Schema.Types.ObjectId, ref: "module" },
    roleId: { type: mongoose.Schema.Types.ObjectId, ref: "role" },
    view: { type: Boolean, default: false },
    add: { type: Boolean, default: false },
    edit: { type: Boolean, default: false },
    delete: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
}, { timestamps: true, versionKey: false })

export const permissionModel = mongoose.model('permission', permissionSchema);  