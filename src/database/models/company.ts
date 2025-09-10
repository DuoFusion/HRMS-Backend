import { COMPANY_GST_INVOICE_TYPE } from "../../common";

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
    gstInvoiceType: { type: String, enum: Object.values(COMPANY_GST_INVOICE_TYPE), default: null },
    gstNumber: { type: String, default: null },
    gstPercentage: { type: Number, default: null },
    overTimePaid: { type: Boolean, default: false },
    lateMinutes: { type: Number },
    companyHours: { type: Number },
    totalWorkingHours: { type: Number, default: 9 },
    isDeleted: { type: Boolean, default: false },
    isBlocked: { type: Boolean, default: false },
}, { timestamps: true, versionKey: false })

export const companyModel = mongoose.model('company', CompanySchema);