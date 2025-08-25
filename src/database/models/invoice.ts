const mongoose = require('mongoose')

const invoiceServiceSchema = new mongoose.Schema({
	description: { type: String, },
	quantity: { type: Number, default: 1, min: 0 },
	rate: { type: Number, default: 0, min: 0 },
	taxPercent: { type: Number, default: 0, min: 0 },
	discount: { type: Number, default: 0, min: 0 }, // percent per line
}, { _id: false });

const invoiceTotalsSchema = new mongoose.Schema({
	subTotal: { type: Number, default: 0 },
	taxAmount: { type: Number, default: 0 },
	discountAmount: { type: Number, default: 0 },
	grandTotal: { type: Number, default: 0 },
	currency: { type: String, default: "INR" }
}, { _id: false });

const invoicePartySchema = new mongoose.Schema({
	name: { type: String },
	companyName: { type: String },
	email: { type: String },
	phone: { type: String },
	gstNumber: { type: String },
	address: { type: String }
}, { _id: false });

const invoicePaymentSchema = new mongoose.Schema({
	method: { type: String },
	transactionId: { type: String },
	status: { type: String, enum: ["pending", "paid", "failed", "refunded"], default: "pending" },
	paymentDate: { type: Date }
}, { _id: false });

const invoiceSchema: any = new mongoose.Schema({
	invoiceNumber: { type: String, unique: true },
	invoiceDate: { type: Date },
	dueDate: { type: Date },
	company: invoicePartySchema,
	client: invoicePartySchema,
	services: { type: [invoiceServiceSchema], default: [] },
	totals: invoiceTotalsSchema,
	payment: invoicePaymentSchema,
	notes: { type: String },
	status: { type: String, enum: ["draft", "sent", "paid", "cancelled"], default: "draft" },
	userId: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
	companyId: { type: mongoose.Schema.Types.ObjectId, ref: "company" },
	isDeleted: { type: Boolean, default: false }
}, { timestamps: true, versionKey: false });

export const invoiceModel = mongoose.model('invoice', invoiceSchema);


