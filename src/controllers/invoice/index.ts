import { invoiceModel } from "../../database";
import { apiResponse } from "../../common";
import { createData, getFirstMatch, reqInfo, responseMessage, updateData } from "../../helper";
import { createInvoiceSchema, updateInvoiceSchema } from "../../validation";
import { getNextInvoiceNumber, computeInvoiceTotals } from "../../helper";

const ObjectId = require("mongoose").Types.ObjectId;

export const create_invoice = async (req, res) => {
	reqInfo(req);
	let { user } = req.headers;
	try {
		const { error, value } = createInvoiceSchema.validate(req.body);
		if (error) return res.status(501).json(new apiResponse(501, error?.details[0]?.message, {}, {}));

		const invoiceDate = new Date(value.invoiceDate);
		const invoiceNumber = await getNextInvoiceNumber(invoiceModel, invoiceDate);

		const totals = computeInvoiceTotals(value.services, value.currency || 'INR');

		const payload: any = {
			invoiceNumber,
			invoiceDate,
			dueDate: value.dueDate ? new Date(value.dueDate) : null,
			company: value.company,
			client: value.client,
			services: value.services,
			totals,
			notes: value.notes,
			status: value.status || 'draft',
			userId: value.userId ? new ObjectId(value.userId) : undefined,
			companyId: value.companyId ? new ObjectId(value.companyId) : undefined
		};

		const response = await createData(invoiceModel, payload);
		if (!response) return res.status(404).json(new apiResponse(404, responseMessage?.addDataError, {}, {}));
		return res.status(200).json(new apiResponse(200, responseMessage?.addDataSuccess('Invoice'), response, {}));
	} catch (error) {
		console.error(error);
		return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, error));
	}
};

export const update_invoice = async (req, res) => {
	reqInfo(req);
	try {
		const { error, value } = updateInvoiceSchema.validate({ ...req.body, invoiceId: req.params.id });
		if (error) return res.status(501).json(new apiResponse(501, error?.details[0]?.message, {}, {}));

		const existing = await getFirstMatch(invoiceModel, { _id: new ObjectId(value.invoiceId), isDeleted: false }, {}, {});
		if (!existing) return res.status(404).json(new apiResponse(404, responseMessage?.getDataNotFound('Invoice'), {}, {}));

		const update: any = { ...value };
		delete update.invoiceId;

		if (value.services || value.currency || value.status || value.notes || value.invoiceDate || value.dueDate) {
			const services = value.services || existing.services;
			const currency = value.currency || existing.totals?.currency || 'INR';
			update.totals = computeInvoiceTotals(services, currency);
			update.services = services;
		}

		if (value.invoiceDate) update.invoiceDate = new Date(value.invoiceDate);
		if (value.dueDate) update.dueDate = new Date(value.dueDate);

		const response = await updateData(invoiceModel, { _id: existing._id }, update);
		return res.status(200).json(new apiResponse(200, responseMessage?.updateDataSuccess('Invoice'), response, {}));
	} catch (error) {
		console.error(error);
		return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, error));
	}
};


