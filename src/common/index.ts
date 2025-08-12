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
    user: "user",
    admin: "admin",
    upload: "upload"
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
    father : 'father',
    mother : 'mother',
    son : 'son',
    brother : 'brother',
    sister : 'sister',
}
