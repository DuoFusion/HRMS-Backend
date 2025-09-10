import { attendanceModel, companyModel, holidayModel, invoiceModel, leaveModel, userModel } from "../../database";
import { apiResponse, ROLES } from "../../common";
import { countData, findAllWithPopulateWithSorting, getFirstMatch, reqInfo, responseMessage, updateData } from "../../helper";
import { deleteInvoiceSchema, getAllInvoicesSchema, getInvoiceByIdSchema } from "../../validation";

const ObjectId = require("mongoose").Types.ObjectId;

export const create_invoice = async (req, res) => {
	reqInfo(req)
	try {
		const { userId, month, year, bonus = 0 } = req.body;

		const user = await userModel.findOne({ _id: new ObjectId(userId) });
		if (!user) return res.status(404).json(new apiResponse(404, responseMessage?.getDataNotFound("User"), {}, {}));

		const company = await companyModel.findById(user.companyId);
		if (!company) return res.status(404).json(new apiResponse(404, responseMessage?.getDataNotFound("Company"), {}, {}));

		const monthNames = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];

		const monthIndex = monthNames.indexOf(month.toLowerCase());
		const numericYear = Number(year);

		if (monthIndex === -1 || isNaN(numericYear)) return res.status(404).json(new apiResponse(404, "Invalid month or year", {}, {}));

		const startDate = new Date(numericYear, monthIndex, 1);
		const endDate = new Date(numericYear, monthIndex + 1, 0);

		const attendance = await attendanceModel.find({ userId: new ObjectId(userId), date: { $gte: startDate, $lte: endDate } });

		const presentDays = attendance.filter(a => a.status === "PRESENT").length;
		const overtimeMinutes = attendance.reduce((sum, a) => sum + (a.overtimeMinutes || 0), 0);

		const leaves = await leaveModel.find({ userId: new ObjectId(userId), status: "APPROVED", startDate: { $lte: endDate }, endDate: { $gte: startDate } });

		const leaveDays = leaves.reduce((sum, l) => sum + (l.count || 0), 0);

		const holidays = await holidayModel.find({ date: { $gte: startDate, $lte: endDate }, isBlocked: false })

		const workingDays = Math.round(((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))) + 1;

		const baseSalary = user.salary || 0;

		let overtimePay = 0;
		if (overtimeMinutes > 0 && company.overTimePaid) overtimePay = (overtimeMinutes / 60) * (baseSalary / 30 / 8);

		let netPay = baseSalary + overtimePay + bonus;

		let gstPercentage = company.gstPercentage ? Number(company.gstPercentage) : 0;
		let cgstAmount = 0, sgstAmount = 0, igstAmount = 0, totalGstAmount = 0;

		if (company.gstInvoiceType) {
			if (company.gstInvoiceType === "INTRA_STATE") {
				cgstAmount = (netPay * gstPercentage) / 200;
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
		return res.status(200).json(new apiResponse(200, responseMessage?.addDataSuccess("Invoice"), invoice, {}));
	} catch (error) {
		console.log(error);
		return res.status(500).json(new apiResponse(500, responseMessage.internalServerError, {}, error));
	}
};

export const edit_invoice_by_id = async (req, res) => {
	reqInfo(req);
	let body = req.body
	try {
		const existing = await getFirstMatch(invoiceModel, { _id: new ObjectId(body.invoiceId), isDeleted: false }, {}, {});
		if (!existing) return res.status(404).json(new apiResponse(404, responseMessage?.getDataNotFound('Invoice'), {}, {}));

		const response = await updateData(invoiceModel, { _id: new ObjectId(body.invoiceId) }, body, { new: true });
		return res.status(200).json(new apiResponse(200, responseMessage?.updateDataSuccess('Invoice'), response, {}));
	} catch (error) {
		console.error(error);
		return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, error));
	}
};

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

		let criteria: any = { isDeleted: false }, options: any = {}, { page, limit, search, typeFilter, activeFilter, userFilter } = value;
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

		if (userFilter) criteria.userId = new ObjectId(userFilter)

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

export const get_invoice_by_id = async (req, res) => {
	reqInfo(req);
	try {
		const { error, value } = getInvoiceByIdSchema.validate(req.params);
		if (error) return res.status(501).json(new apiResponse(501, error?.details[0]?.message, {}, {}));

		const response = await getFirstMatch(invoiceModel, { _id: new ObjectId(value.id), isDeleted: false }, {});
		if (!response) return res.status(404).json(new apiResponse(404, responseMessage?.getDataNotFound('Leave'), {}, {}));
		return res.status(200).json(new apiResponse(200, responseMessage?.getDataSuccess('Leave'), response, {}));
	} catch (error) {
		console.error(error);
		return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, error));
	}
}