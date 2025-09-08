import { CronJob } from 'cron';
import { invoiceModel, userModel, attendanceModel, holidayModel, leaveModel } from "../database";
import { calculateMonthlySalaryForUser, getNextInvoiceNumber, getPreviousMonthRange, makeSalaryServiceLine, computeInvoiceTotals } from "./salary";
import { ATTENDANCE_STATUS, LEAVE_STATUS, ROLES } from '../common';

export const monthlySalaryInvoiceJob = new CronJob('0 0 1 * *', async function () {
	try {
		const now = new Date();
		const { start, end } = getPreviousMonthRange(now);
		const users = await userModel.find({ isDeleted: false, isBlocked: false }).lean();
		for (const user of users) {
			const { salary } = await calculateMonthlySalaryForUser(user, start, end);
			const yearMonth = `${start.getUTCFullYear()}-${(start.getUTCMonth() + 1).toString().padStart(2, '0')}`;
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

export const dailyAttendanceStatusJob = new CronJob('*/30 * * * * *', async function () {
	try {
		const today = new Date();
		today.setDate(today.getDate())

		const todayStart = new Date(today);
		todayStart.setHours(0, 0, 0, 0);

		const yesterday = new Date();
		yesterday.setDate(yesterday.getDate() - 1)

		const yesterdayStart = new Date(yesterday);
		yesterdayStart.setHours(0, 0, 0, 0);

		const yesterdayEnd = new Date(yesterday);
		yesterdayEnd.setHours(23, 59, 59, 999);

		console.log("todayStart => ",todayStart);
		console.log("yesterdayStart => ",yesterdayStart);
		console.log("yesterdayEnd => ",yesterdayEnd);
		const users = await userModel.find({ role: { $ne: ROLES.ADMIN }, isDeleted: false, isBlocked: false }).lean()
		
		const holidays = await holidayModel.find({ date: { $lt: todayStart }, isDeleted: false }).lean()
	
		const isHoliday = holidays.length > 0
		
		for (const user of users) {
			if (isHoliday) continue;

			const existingAttendance = await attendanceModel.findOne({ userId: user._id, date: { $gte: yesterdayStart, $lt: yesterdayEnd }, isDeleted: false })
			
			if (existingAttendance) continue;

			const leave = await leaveModel.findOne({
				userId: user._id,
				startDate: { $lt: todayStart },
				status: LEAVE_STATUS.APPROVED,
				isDeleted: false
			})
			
			if (leave && leave.dayType === 'half') continue;

			let status = ATTENDANCE_STATUS.ABSENT;
			let remarks = 'Auto-marked absent - No attendance recorded'
			
			if (leave && leave.dayType === 'full') {
				status = ATTENDANCE_STATUS.LEAVE
				remarks = `Auto-marked leave - ${leave.type} leave approved`
			}

			await attendanceModel.create({
				userId: user._id,
				date: yesterdayStart,
				checkIn: null,
				checkOut: null,
				status: status,
				breakMinutes: 0,
				lateMinutes: 0,
				overtimeMinutes: 0,
				productionHours: 0,
				totalWorkingHours: 0,
				productiveHours: 0,
				remarks: remarks,
				sessions: [],
				isDeleted: false
			});
		}

	} catch (error) {
		console.error('Error in daily attendance status job:', error);
	}
}, null, false, 'Asia/Kolkata');


