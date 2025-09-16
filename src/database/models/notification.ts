const mongoose = require('mongoose')

const notificationSchema: any = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'company' },
    title: { type: String },
    message: { type: String },
    eventType: { type: String },
    meta: { type: Object, default: {} },
    isRead: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false }
}, { timestamps: true, versionKey: false })

export const notificationModel = mongoose.model('notification', notificationSchema)