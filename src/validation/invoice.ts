import joi from "joi";
import { INVOICE_STATUS } from "../common";

const serviceSchema = joi.object({
	description: joi.string().required(),
	quantity: joi.number().min(0).required(),
	rate: joi.number().min(0).required(),
	taxPercent: joi.number().min(0).max(100).default(0),
	discount: joi.number().min(0).max(100).default(0),
});

export const createInvoiceSchema = joi.object({
	// invoiceNumber: joi.string(),
	invoiceDate: joi.date().required(),
	dueDate: joi.date().optional(),
	company: joi.object({
		name: joi.string().allow(null, ''),
		companyName: joi.string().allow(null, ''),
		email: joi.string().allow(null, ''),
		phone: joi.string().allow(null, ''),
		gstNumber: joi.string().allow(null, ''),
		address: joi.string().allow(null, ''),
	}).required(),
	client: joi.object({
		name: joi.string().allow(null, ''),
		companyName: joi.string().allow(null, ''),
		email: joi.string().allow(null, ''),
		phone: joi.string().allow(null, ''),
		gstNumber: joi.string().allow(null, ''),
		address: joi.string().allow(null, ''),
	}).required(),
	services: joi.array().items(serviceSchema).min(1).required(),
	totals: joi.object({
		subTotal: joi.number().min(0).allow(null, ''),
		taxAmount: joi.number().min(0).allow(null, ''),
		discountAmount: joi.number().min(0).allow(null, ''),
		grandTotal: joi.number().min(0).allow(null, ''),
		currency: joi.string().allow(null, '').optional(),
	}),
	payment: joi.object({
		method: joi.string().allow(null, ''),
		transactionId: joi.string().allow(null, ''),
		status: joi.string().valid('pending', 'paid', 'failed', 'refunded').optional(),
		paymentDate: joi.date().allow(null, '')
	}),
	// currency: joi.string().default('INR'),
	notes: joi.string().optional(),
	status: joi.string().valid('draft', 'sent', 'paid', 'cancelled').optional(),
	userId: joi.string().optional(),
	companyId: joi.string().optional(),
	isDeleted: joi.boolean().default(false),
});

export const updateInvoiceSchema = joi.object({
	invoiceId: joi.string().required(),
	invoiceDate: joi.date().optional(),
	dueDate: joi.date().optional(),
	company: joi.object({
		name: joi.string().allow(null, ''),
		companyName: joi.string().allow(null, ''),
		email: joi.string().allow(null, ''),
		phone: joi.string().allow(null, ''),
		gstNumber: joi.string().allow(null, ''),
		address: joi.string().allow(null, ''),
	}).optional(),
	client: joi.object({
		name: joi.string().allow(null, ''),
		companyName: joi.string().allow(null, ''),
		email: joi.string().allow(null, ''),
		phone: joi.string().allow(null, ''),
		gstNumber: joi.string().allow(null, ''),
		address: joi.string().allow(null, ''),
	}).optional(),
	services: joi.array().items(serviceSchema).min(1).optional(),
	totals: joi.object({
		subTotal: joi.number().min(0).allow(null, ''),
		taxAmount: joi.number().min(0).allow(null, ''),
		discountAmount: joi.number().min(0).allow(null, ''),
		grandTotal: joi.number().min(0).allow(null, ''),
		currency: joi.string().allow(null, '').optional(),
	}),
	payment: joi.object({
		method: joi.string().allow(null, ''),
		transactionId: joi.string().allow(null, ''),
		status: joi.string().valid('pending', 'paid', 'failed', 'refunded').optional(),
		paymentDate: joi.date().allow(null, '')
	}),
	currency: joi.string().optional(),
	notes: joi.string().optional(),
	status: joi.string().valid('draft', 'sent', 'paid', 'cancelled').optional(),
	userId: joi.string().optional(),
	companyId: joi.string().optional(),
	isDeleted: joi.boolean().default(false),
});

export const getAllInvoicesSchema = joi.object({
	page: joi.number().integer().optional(),
	limit: joi.number().integer().optional(),
	activeFilter: joi.boolean().optional(),
	typeFilter: joi.string().valid(...Object.values(INVOICE_STATUS)).optional(),
	search: joi.string().optional()

})

export const deleteInvoiceSchema = joi.object().keys({
	id: joi.string().required()
})

export const getInvoiceByIdSchema = joi.object().keys({
    id: joi.string().required()
})