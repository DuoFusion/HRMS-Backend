const mongoose = require('mongoose');

const CompanySchema = new mongoose.Schema({
    name: { type: String },
    ownerName: { type: String },
    address: { type: String },
    website: { type: String },
    phoneNumber: { type: String },
    staringTime: { type: Date, },
    endingTime: { type: Date, },
    isDeleted: { type: Boolean, default: false },
    isBlocked: { type: Boolean, default: false },
}, { timestamps: true, versionKey: false })

export const companyModel = mongoose.model('company', CompanySchema);