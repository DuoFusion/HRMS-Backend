
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
    PROJECT_MANAGER: 'project_manager',
    HR: 'hr',
    EMPLOYEE: 'employee'
}

export const RELATION = {
    father : 'father',
    mother : 'mother',
    son : 'son',
    brother : 'brother',
    sister : 'sister',
}