import { attendanceModel, companyModel, holidayModel, invoiceModel, leaveModel, userModel } from "../../database";
import { apiResponse, ROLES } from "../../common";
import { countData, createData, findAllWithPopulateWithSorting, getFirstMatch, reqInfo, responseMessage, updateData } from "../../helper";
import { createInvoiceSchema, deleteInvoiceSchema, getAllInvoicesSchema, updateInvoiceSchema } from "../../validation";
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
		const { error, value } = updateInvoiceSchema.validate({ ...req.body, invoiceId: req.body.invoiceId });
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

export const delete_invoice = async (req, res) => {
	reqInfo(req)
	try {

		// const {error,value} = 

	} catch (error) {
		console.log(error);
		return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, error));
	}
}

export const delete_invoice_by_id = async (req, res) => {
	reqInfo(req)
	try {
		const { error, value } = deleteInvoiceSchema.validate(req.params);
		if (error) return res.status(501).json(new apiResponse(501, error?.details[0]?.message, {}, {}));

		const response = await updateData(invoiceModel, { _id: new ObjectId(value.id) }, { isDeleted: true }, {});
		if (!response) return res.status(404).json(new apiResponse(404, responseMessage?.getDataNotFound('Invoice'), {}, {}));

		return res.status(200).json(new apiResponse(200, responseMessage?.deleteDataSuccess('Invoice'), response, {}));

	} catch (error) {
		console.log(error);
		return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, error));
	}
}

export const get_invoice = async (req, res) => {
	reqInfo(req)
	let { user } = req.headers
	try {
		const { error, value } = getAllInvoicesSchema.validate(req.query);

		if (error) return res.status(501).json(new apiResponse(501, error?.details[0]?.message, {}, {}));

		let criteria: any = { isDeleted: false }, options: any = {}, { page, limit, search, typeFilter, activeFilter } = value;
		if (user.role === ROLES.EMPLOYEE || user.role === ROLES.PROJECT_MANAGER) criteria.userId = new ObjectId(user._id);

		if (typeFilter) criteria.type = typeFilter;
		if (activeFilter === true) criteria.isBlocked = true
		if (activeFilter === false) criteria.isBlocked = false

		if (search) {
			criteria.$or = [
				{ invoiceNumber: { $regex: search, $options: "i" } },
				{ company: { $regex: search, $options: "i" } },
				{ client: { $regex: search, $options: "i" } },
			];
		}

		let populate = [
			{ path: "userId", select: "firstName lastName fullName email phoneNumber salary bankDetails parentsDetails aadharCardNumber panCardNumber position department designation profilePhoto" },
			{ path: "companyId", select: "name ownerName address phoneNumber email logo" }
		];

		if (page && limit) {
			options.skip = (parseInt(page) - 1) * parseInt(limit);
			options.limit = parseInt(limit);
		}

		const response = await findAllWithPopulateWithSorting(invoiceModel, criteria, {}, options, populate);
		const totalCount = await countData(invoiceModel, criteria);

		const stateObj = {
			page: parseInt(page) || 1,
			limit: parseInt(limit) || totalCount,
			page_limit: Math.ceil(totalCount / (parseInt(limit) || totalCount)) || 1,
		};

		if (response.length) {
			return res.status(200).json(new apiResponse(200, responseMessage?.getDataSuccess('Invoice'), { response, stateObj }, {}));
		} else {
			return res.status(404).json(new apiResponse(404, responseMessage?.getDataNotFound('Invoice'), {}, {}));
		}

	} catch (error) {
		console.log(error);
		return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, error));
	}
}

export const createMonthlyInvoice = async (req, res) => {
	reqInfo(req)
	try {
		const { userId, month, year, bonus = 0 } = req.body;

		const user = await userModel.findOne({ _id: new ObjectId(userId) });
		if (!user) return res.status(404).json(new apiResponse(404, responseMessage?.getDataNotFound("User"), {}, {}));

		const company = await companyModel.findById(user.companyId);
		if (!company) return res.status(404).json(new apiResponse(404, responseMessage?.getDataNotFound("Company"), {}, {}));

		const monthNames = [
			"january", "february", "march", "april", "may", "june",
			"july", "august", "september", "october", "november", "december"
		];

		const monthIndex = monthNames.indexOf(month.toLowerCase());
		const numericYear = Number(year);

		if (monthIndex === -1 || isNaN(numericYear)) {
			throw new Error("Invalid month or year");
		}

		const startDate = new Date(numericYear, monthIndex, 1);
		const endDate = new Date(numericYear, monthIndex + 1, 0);

		const attendance = await attendanceModel.find({
			userId: new ObjectId(userId),
			date: { $gte: startDate, $lte: endDate },
		});

		const presentDays = attendance.filter(a => a.status === "PRESENT").length;
		const overtimeMinutes = attendance.reduce((sum, a) => sum + (a.overtimeMinutes || 0), 0);

		const leaves = await leaveModel.find({
			userId: new ObjectId(userId),
			status: "APPROVED",
			startDate: { $lte: endDate },
			endDate: { $gte: startDate },
		});

		const leaveDays = leaves.reduce((sum, l) => sum + (l.count || 0), 0);

		const holidays = await holidayModel.find({
			date: { $gte: startDate, $lte: endDate },
			isBlocked: false,
		});

		const workingDays = Math.round(((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))) + 1;

		const baseSalary = user.salary || 0;

		// ✅ Overtime Pay
		let overtimePay = 0;
		if (overtimeMinutes > 0 && company.overTimePaid) {
			overtimePay = (overtimeMinutes / 60) * (baseSalary / 30 / 8);
		}

		let netPay = baseSalary + overtimePay + bonus;

		// ✅ GST Calculation
		let gstPercentage = company.gstPercentage ? Number(company.gstPercentage) : 0;
		let cgstAmount = 0, sgstAmount = 0, igstAmount = 0, totalGstAmount = 0;

		if (company.gstInvoiceType && company.gstInvoiceType !== "NONE") {
			if (company.gstInvoiceType === "INTRA_STATE") {
				cgstAmount = (netPay * gstPercentage) / 200; // Half GST
				sgstAmount = (netPay * gstPercentage) / 200;
				totalGstAmount = cgstAmount + sgstAmount;
			} else if (company.gstInvoiceType === "INTER_STATE") {
				igstAmount = (netPay * gstPercentage) / 100;
				totalGstAmount = igstAmount;
			}
			netPay += totalGstAmount;
		}

		const invoiceNumber = `INV-${year}${month}-${Date.now()}`;

		const invoice = await invoiceModel.create({
			invoiceNumber,
			userId,
			companyId: company._id,
			startDate,
			endDate,
			month,
			year,
			totalWorkingDays: workingDays,
			totalPresentDays: presentDays,
			totalLeaveDays: leaveDays,
			totalHolidays: holidays.length,
			totalOvertimeMinutes: overtimeMinutes,
			baseSalary,
			overtimePay,
			bonus,
			gstType: company.gstInvoiceType,
			gstPercentage,
			cgstAmount,
			sgstAmount,
			igstAmount,
			totalGstAmount,
			netPay,
		});

		await invoice.save();
		return res.status(200).json({ success: true, invoice });
	} catch (error) {
		console.error(error);
		return res.status(500).json({ success: false, message: "Server Error" });
	}
};
