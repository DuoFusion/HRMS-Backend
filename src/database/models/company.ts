const mongoose = require('mongoose');

const CompanySchema = new mongoose.Schema({
    name: { type: String, required: true },
    address: { type: String, required: true },
    number: { type: String, required: true },
    staringTime: { type: String, required: true },
    endingTime: { type: String, required: true },
})

export const companyModel = mongoose.model('company', CompanySchema);