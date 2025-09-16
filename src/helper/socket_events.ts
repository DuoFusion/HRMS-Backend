export const SOCKET_EVENT = {
    LEAVE_NEW: 'leave:new',
    LEAVE_STATUS: 'leave:status',
    HOLIDAY_NEW: 'holiday:new',
    HOLIDAY_UPDATE: 'holiday:update',
    REMARK_NEW: 'remark:new',
    ATTENDANCE_LATE: 'attendance:late',
    BIRTHDAY_TODAY: 'birthday:today',
    NOTIFICATION_NEW: 'notification:new',
} as const

export type SocketEventKey = keyof typeof SOCKET_EVENT
export type SocketEventValue = typeof SOCKET_EVENT[SocketEventKey]


