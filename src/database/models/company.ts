const mongoose = require('mongoose');

const CompanySchema = new mongoose.Schema({
    name: { type: String },
    ownerName: { type: String },
    address: { type: String },
    phoneNumber: { type: String },
    email: { type: String },
    website: { type: String },
    logo: { type: String },
    workingHours: {
        start: { type: String, },
        end: { type: String }
    },
    gst: { type: Boolean, default: false },
    gstNumber: { type: String, default: null },
    lateMinutes: { type: Number },
    companyHours: { type: Number },
    totalWorkingHours: { type: Number, default: 9 },
    isDeleted: { type: Boolean, default: false },
    isBlocked: { type: Boolean, default: false },
}, { timestamps: true, versionKey: false })

export const companyModel = mongoose.model('company', CompanySchema);