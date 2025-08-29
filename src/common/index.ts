import { publicDecrypt } from "crypto"
import { userModel } from "../database"

export class apiResponse {
    private status: number | null
    private message: string | null
    private data: any | null
    private error: any | null
    constructor(status: number, message: string, data: any, error: any) {
        this.status = status
        this.message = message
        this.data = data
        this.error = error
    }
}

export const userStatus = {
    USER: "user",
    ADMIN: "admin",
    UPLOAD: "upload"
}

export const ROLES = {
    ADMIN: 'admin',
    PROJECT_MANAGER: 'project-manager',
    HR: 'hr',
    EMPLOYEE: 'employee'
}

const generateOtp = () => Math.floor(100000 + Math.random() * 900000); // Generate a 6-digit OTP

export const getUniqueOtp = async () => {
    let otp;
    let isUnique = false;

    while (!isUnique) {
        otp = generateOtp(); // Generate a 6-digit OTP
        const isAlreadyAssign = await userModel.findOne({ otp });
        if (!isAlreadyAssign) {
            isUnique = true; // Exit the loop if the OTP is unique
        }
    }
    return otp;
};

export const RELATION = {
    FATHER: 'father',
    MOTHER: 'mother',
    SON: 'son',
    BROTHER: 'brother',
    SISTER: 'sister',
}

export const LEAVE_TYPE = {
    ANNUAL: 'annual',
    SICK: 'sick',
    CASUAL: 'casual',
    UNPAID: 'unpaid',
    OTHER: 'other'
}

export const LEAVE_STATUS = {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
}

export const LEAVE_DAY_TYPE = {
    FULL: 'full',
    HALF: 'half'
}

export const TASK_STATUS = {
    TO_DO: 'todo',
    PENDING: 'pending',
    IN_PROGRESS: 'inprogress',
    COMPLETED: 'completed',
}

export const TASK_PRIORITY = {
    HIGH: 'high',
    MEDIUM: 'medium',
    LOW: 'low',
}

export const TASK_TYPE = {
    BREAK: 'break',
    LUNCH: 'lunch',
    MEETING: 'meeting'
}

export const HOLIDAY_TYPE = {
    PUBLIC: 'public',
    COMPANY: 'company',
}

export const ATTENDANCE_STATUS = {
    PRESENT: "Present",
    ABSENT: "Absent",
    HALF_DAY: "Half Day",
    LEAVE: "Leave"
}

export const PROJECT_STATUS = {
    PLANNED: 'planned',
    ACTIVE: 'active',
    ONHOLD: 'onhold',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled'
}