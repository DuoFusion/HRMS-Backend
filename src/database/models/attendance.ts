import { ATTENDANCE_STATUS } from "../../common";

const mongoose = require('mongoose')

const attendanceSchema: any = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
    date: { type: Date, required: true },
    checkIn: { type: Date, default: null },
    checkOut: { type: Date, default: null },
    status: { type: String, enum: Object.values(ATTENDANCE_STATUS), default: ATTENDANCE_STATUS.PRESENT },
    breakMinutes: { type: Number, default: 0 },
    lateMinutes: { type: Number, default: 0 },
    overtimeMinutes: { type: Number, default: 0 },
    productionHours: { type: Number, default: 0 },
    totalWorkingHours: { type: Number, default: 0 },
    productiveHours: { type: Number, default: 0 },
    remarks: { type: String, default: null },
    isDeleted: { type: Boolean, default: false },
    sessions: [
        {
            checkIn: { type: Date, required: true },
            checkOut: { type: Date, default: null },
            breaks: [
                {
                    breakIn: { type: Date, required: true },
                    breakOut: { type: Date, default: null }
                }
            ]
        }
    ]
}, { timestamps: true, versionKey: false })

attendanceSchema.index({ userId: 1, date: 1 }, { unique: true })

export const attendanceModel = mongoose.model('attendance', attendanceSchema);