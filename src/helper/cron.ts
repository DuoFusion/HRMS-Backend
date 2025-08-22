import { CronJob } from 'cron';
import { invoiceModel, userModel } from "../database";
import { calculateMonthlySalaryForUser, getNextInvoiceNumber, getPreviousMonthRange, makeSalaryServiceLine, computeInvoiceTotals } from "./salary";

export const monthlySalaryInvoiceJob = new CronJob('0 0 1 * *', async function () {
	try {
		const now = new Date();
		const { start, end } = getPreviousMonthRange(now);
		const users = await userModel.find({ isDeleted: false, isBlocked: false }).lean();
		for (const user of users) {
			const { salary } = await calculateMonthlySalaryForUser(user, start, end);
			const yearMonth = `${start.getUTCFullYear()}-${(start.getUTCMonth()+1).toString().padStart(2,'0')}`;
			const description = `Salary for ${yearMonth}`;
			const services = [makeSalaryServiceLine(description, 1, Math.round(salary))];
			const totals = await computeInvoiceTotals(services, 'INR');

			const invoiceDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
			const invoiceNumber = await getNextInvoiceNumber(invoiceModel, invoiceDate);

			await invoiceModel.create({
				invoiceNumber,
				invoiceDate,
				dueDate: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 10)),
				company: {},
				client: { name: user.fullName, email: user.email, phone: user.phoneNumber },
				services,
				totals,
				status: 'sent',
				userId: user._id,
				companyId: user.companyId,
			});
		}
	} catch (error) {
		console.log(error);
	}
}, null, false, 'Asia/Kolkata');


