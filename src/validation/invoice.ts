import joi from "joi";

const serviceSchema = joi.object({
	description: joi.string().required(),
	quantity: joi.number().min(0).required(),
	rate: joi.number().min(0).required(),
	taxPercent: joi.number().min(0).max(100).default(0),
	discount: joi.number().min(0).max(100).default(0),
});

export const createInvoiceSchema = joi.object({
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
	currency: joi.string().default('INR'),
	notes: joi.string().optional(),
	status: joi.string().valid('draft', 'sent', 'paid', 'cancelled').optional(),
	userId: joi.string().optional(),
	companyId: joi.string().optional(),
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
	currency: joi.string().optional(),
	notes: joi.string().optional(),
	status: joi.string().valid('draft', 'sent', 'paid', 'cancelled').optional(),
	userId: joi.string().optional(),
	companyId: joi.string().optional(),
});


