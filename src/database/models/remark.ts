const mongoose = require('mongoose');

const remarkSchema = new mongoose.Schema({
    note: { type: String },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
    isDeleted: { type: Boolean, default: false }
}, { timestamps: true, versionKey: false })

export const remarkModel = mongoose.model('remark', remarkSchema);