const mongoose = require('mongoose');

const CompanySchema = new mongoose.Schema({
    name: { type: String },
    address: { type: String },
    number: { type: String },
    staringTime: { type: String, },
    endingTime: { type: String, },
    isDeleted: { type: Boolean, default: false },
}, {
    timestamps: true, versionKey: false
})

export const companyModel = mongoose.model('company', CompanySchema);