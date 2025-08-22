/**
 * Utility functions for IST (UTC +5:30) timezone conversion
 */

// Convert UTC date to IST
export const utcToIst = (utcDate: Date): Date => {
    if (!utcDate) return utcDate;
    const istOffset = 5.5 * 60 * 60 * 1000; // 5 hours 30 minutes in milliseconds
    return new Date(utcDate.getTime() + istOffset);
};

// Convert IST date to UTC
export const istToUtc = (istDate: Date): Date => {
    if (!istDate) return istDate;
    const istOffset = 5.5 * 60 * 60 * 1000; // 5 hours 30 minutes in milliseconds
    return new Date(istDate.getTime() - istOffset);
};

// Get current IST time
export const getCurrentIstTime = (): Date => {
    return utcToIst(new Date());
};

// Get start of day in IST (00:00:00)
export const getStartOfDayIst = (date: Date = new Date()): Date => {
    const istDate = utcToIst(date);
    istDate.setHours(0, 0, 0, 0);
    return istToUtc(istDate);
};

// Get end of day in IST (23:59:59)
export const getEndOfDayIst = (date: Date = new Date()): Date => {
    const istDate = utcToIst(date);
    istDate.setHours(23, 59, 59, 999);
    return istToUtc(istDate);
};

// Check if time is after 9:00 AM IST
export const isAfterNineAM = (date: Date): boolean => {
    const istDate = utcToIst(date);
    const nineAM = new Date(istDate);
    nineAM.setHours(9, 0, 0, 0);
    return istDate > nineAM;
};

// Check if time is after 11:00 AM IST
export const isAfterElevenAM = (date: Date): boolean => {
    const istDate = utcToIst(date);
    const elevenAM = new Date(istDate);
    elevenAM.setHours(11, 0, 0, 0);
    return istDate > elevenAM;
};

// Calculate minutes difference between two dates
export const getMinutesDifference = (date1: Date, date2: Date): number => {
    const diffMs = Math.abs(date2.getTime() - date1.getTime());
    return Math.floor(diffMs / (1000 * 60));
};

// Calculate hours difference between two dates
export const getHoursDifference = (date1: Date, date2: Date): number => {
    const diffMs = Math.abs(date2.getTime() - date1.getTime());
    return diffMs / (1000 * 60 * 60);
};

// Format time for response (IST)
export const formatTimeForResponse = (date: Date): string => {
    if (!date) return null;
    const istDate = utcToIst(date);
    return istDate.toLocaleTimeString('en-IN', { 
        timeZone: 'Asia/Kolkata',
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
};

// Format date for response (IST)
export const formatDateForResponse = (date: Date): string => {
    if (!date) return null;
    const istDate = utcToIst(date);
    return istDate.toLocaleDateString('en-IN', { 
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
};

// Returns today's scheduled start time (in UTC) based on the user's workingTime.start (time-of-day in IST).
// If workingTime.start is missing, falls back to 09:00 IST by default.
export const getTodaysScheduledStartUtc = (
    nowUtc: Date = new Date(),
    workingStartUtc?: Date | null,
    fallbackIstHour: number = 9,
    fallbackIstMinute: number = 0
): Date => {
    const todayIst = utcToIst(nowUtc);
    const scheduledIst = new Date(todayIst);

    if (workingStartUtc) {
        const workingStartIst = utcToIst(new Date(workingStartUtc));
        scheduledIst.setHours(workingStartIst.getHours(), workingStartIst.getMinutes(), 0, 0);
    } else {
        scheduledIst.setHours(fallbackIstHour, fallbackIstMinute, 0, 0);
    }

    return istToUtc(scheduledIst);
};

// Parse a time string like "09:00 AM" (IST) and return a Date in UTC for today's date at that time
export const parseIstTimeStringToUtcToday = (timeStr?: string | null): Date | null => {
    if (!timeStr || typeof timeStr !== 'string') return null;
    const trimmed = timeStr.trim();
    const match = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!match) return null;

    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const period = match[3].toUpperCase();

    if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
    if (minutes < 0 || minutes > 59) return null;

    if (period === 'PM' && hours < 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;

    const nowUtc = new Date();
    const todayIst = utcToIst(nowUtc);
    const scheduledIst = new Date(todayIst);
    scheduledIst.setHours(hours, minutes, 0, 0);

    return istToUtc(scheduledIst);
};

// Compute late minutes by comparing current time and scheduled start in IST, then subtracting grace minutes
export const computeLateMinutesIst = (
    currentUtc: Date,
    workingStartStr: string | undefined | null,
    graceMinutes: number
): number => {
    // 1) Get IST current time as minutes since midnight using Intl (no manual offset math)
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Kolkata',
        hour12: false,
        hour: '2-digit',
        minute: '2-digit'
    }).formatToParts(currentUtc);

    const hourPart = parts.find(p => p.type === 'hour')?.value ?? '00';
    const minutePart = parts.find(p => p.type === 'minute')?.value ?? '00';
    const istNowHours = parseInt(hourPart, 10);
    const istNowMinutes = parseInt(minutePart, 10);
    const nowMinutesSinceMidnight = (isNaN(istNowHours) ? 0 : istNowHours) * 60 + (isNaN(istNowMinutes) ? 0 : istNowMinutes);

    // 2) Parse the user's working start string (IST time-of-day) into minutes since midnight
    const scheduledMinutesSinceMidnight = (() => {
        let h = 9, m = 0;
        if (typeof workingStartStr === 'string') {
            const match = workingStartStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
            if (match) {
                h = parseInt(match[1], 10);
                m = parseInt(match[2], 10);
                const period = match[3].toUpperCase();
                if (period === 'PM' && h < 12) h += 12;
                if (period === 'AM' && h === 12) h = 0;
            }
        }
        return (Math.max(0, Math.min(23, h)) * 60) + (Math.max(0, Math.min(59, m)));
    })();

    const diff = nowMinutesSinceMidnight - scheduledMinutesSinceMidnight;
    if (diff <= 0) return 0;

    const safeGrace = Number.isFinite(graceMinutes) ? graceMinutes : 0;
    return Math.max(0, diff - safeGrace);
};