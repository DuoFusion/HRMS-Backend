import { COMPANY_GST_INVOICE_TYPE, INVOICE_STATUS } from "../../common";

const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
	invoiceNumber: { type: String, required: true, unique: true },
	userId: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
	companyId: { type: mongoose.Schema.Types.ObjectId, ref: "company", required: true },

	startDate: { type: Date },
	endDate: { type: Date },

	totalWorkingDays: { type: Number, default: 0 },
	totalPresentDays: { type: Number, default: 0 },
	totalLeaveDays: { type: Number, default: 0 },
	totalHolidays: { type: Number, default: 0 },
	totalOvertimeMinutes: { type: Number, default: 0 },

	baseSalary: { type: Number, default: 0 },
	overtimePay: { type: Number, default: 0 },
	bonus: { type: Number, default: 0 },

	gstType: { type: String, enum: Object.values(COMPANY_GST_INVOICE_TYPE), default: null },
	gstPercentage: { type: Number, default: 0 },
	cgstAmount: { type: Number, default: 0 },
	sgstAmount: { type: Number, default: 0 },
	igstAmount: { type: Number, default: 0 },
	totalGstAmount: { type: Number, default: 0 },

	netPay: { type: Number, default: 0 },

	status: { type: String, enum: Object.values(INVOICE_STATUS), default: INVOICE_STATUS.DRAFT },
	notes: { type: String, default: "" },
	pdfUrl: { type: String, default: null },
	
	createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
	updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "user" },

	isDeleted: { type: Boolean, default: false }
}, { timestamps: true, versionKey: false });

export const invoiceModel = mongoose.model('invoice', invoiceSchema);
