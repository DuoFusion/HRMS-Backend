import { ref } from "joi";
import mongoose from "mongoose";

const dashboardSchema = new mongoose.Schema({
    upcomingBday: { type: Date },
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'task' },
    leaveId: { type: mongoose.Schema.Types.ObjectId, ref: 'leave' },

}, { timestamps: true, versionKey: false })

export const bashboardModel = mongoose.model('dashboard', dashboardSchema);