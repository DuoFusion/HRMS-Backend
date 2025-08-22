import { holidayModel, invoiceModel, leaveModel, userModel, companyModel } from "../database";
import { LEAVE_DAY_TYPE, LEAVE_STATUS, ROLES } from "../common";

export const getMonthRange = (date: Date) => {
	const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 0, 0, 0, 0));
	const end = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0, 23, 59, 59, 999));
	return { start, end };
};

export const getPreviousMonthRange = (now: Date = new Date()) => {
	const y = now.getUTCFullYear();
	const m = now.getUTCMonth();
	const prev = new Date(Date.UTC(y, m - 1, 1));
	return getMonthRange(prev);
};

export const isWeekend = (date: Date) => {
	const day = date.getUTCDay();
	return day === 0 || day === 6; // Sunday or Saturday
};

export const enumerateDays = (start: Date, end: Date): Date[] => {
	const days: Date[] = [];
	let cur = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
	const last = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()));
	while (cur <= last) {
		days.push(new Date(cur));
		cur.setUTCDate(cur.getUTCDate() + 1);
	}
	return days;
};

export const fetchHolidaysInRange = async (start: Date, end: Date) => {
	return await holidayModel.find({ isDeleted: false, date: { $gte: start, $lte: end } }, { date: 1, type: 1 }).lean();
};

export const computeWorkingDaysExcludingWeekendsAndHolidays = async (start: Date, end: Date) => {
	const holidays = await fetchHolidaysInRange(start, end);
	const holidaySet = new Set(holidays.map(h => new Date(new Date(h.date).toISOString().slice(0,10)).getTime()));
	return enumerateDays(start, end).filter(d => !isWeekend(d) && !holidaySet.has(new Date(d.toISOString().slice(0,10)).getTime())).length;
};

export const computeLeaveDaysForUserInRange = async (userId: any, start: Date, end: Date) => {
	const leaves = await leaveModel.find({
		userId,
		isDeleted: false,
		status: LEAVE_STATUS.APPROVED,
		$or: [
			{ startDate: { $lte: end }, endDate: { $gte: start } },
		]
	}).lean();

	let total = 0;
	for (const lv of leaves) {
		const lvStart = new Date(lv.startDate);
		const lvEnd = new Date(lv.endDate || lv.startDate);
		const s = lvStart < start ? start : lvStart;
		const e = lvEnd > end ? end : lvEnd;
		const days = enumerateDays(s, e).filter(d => !isWeekend(d));
		for (const d of days) total += lv.dayType === LEAVE_DAY_TYPE.HALF ? 0.5 : 1;
	}
	return total;
};

export const calculateMonthlySalaryForUser = async (user: any, start: Date, end: Date) => {
	const totalWorkingDays = await computeWorkingDaysExcludingWeekendsAndHolidays(start, end);
	const leaveDays = await computeLeaveDaysForUserInRange(user._id, start, end);
	const payableDays = Math.max(0, totalWorkingDays - leaveDays);
	const dailyRate = (user.salary || 0) / (totalWorkingDays || 1);
	const salary = dailyRate * payableDays;
	return { totalWorkingDays, leaveDays, payableDays, dailyRate, salary };
};

export const round2 = (n: number) => Math.round(n * 100) / 100;

export const computeInvoiceTotals = (services: Array<any>, currency: string = 'INR') => {
	let subTotal = 0, discountAmount = 0, taxAmount = 0;
	for (const s of services) {
		const amount = (s.quantity || 0) * (s.rate || 0);
		subTotal += amount;
		const disc = amount * ((s.discount || 0) / 100);
		discountAmount += disc;
		const taxable = amount - disc;
		taxAmount += taxable * ((s.taxPercent || 0) / 100);
	}
	const grandTotal = subTotal - discountAmount + taxAmount;
	return { subTotal: round2(subTotal), discountAmount: round2(discountAmount), taxAmount: round2(taxAmount), grandTotal: round2(grandTotal), currency };
};

export const getNextInvoiceNumber = async (model: any, invoiceDate: Date = new Date()) => {
	const year = invoiceDate.getUTCFullYear();
	const prefix = `INV-${year}-`;
	const last = await model.findOne({ invoiceNumber: { $regex: `^${prefix}` } }).sort({ createdAt: -1 }).lean();
	let seq = 0;
	if (last && last.invoiceNumber) {
		const parts = String(last.invoiceNumber).split('-');
		seq = parseInt(parts[2] || '0', 10) || 0;
	}
	const next = (seq + 1).toString().padStart(3, '0');
	return `${prefix}${next}`;
};

export const makeSalaryServiceLine = (description: string, quantity: number, rate: number) => ({
	description,
	quantity,
	rate,
	taxPercent: 0,
	discount: 0,
});


