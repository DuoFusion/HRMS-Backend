const mongoose = require('mongoose');
import { TASK_STATUS, TASK_TYPE } from "../../common";

const TaskSchema = new mongoose.Schema({
    title: { type: String },
    description: { type: String },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
    status: { type: String, enum: Object.values(TASK_STATUS) },
    startDate: { type: Date },
    endDate: { type: Date },

    timer: {
        isRunning: { type: Boolean, default: false },
        startTime: { type: String },
        totalTime: { type: Number }
    },

    remarks: [{
        text: { type: String },
        type: { type: String, enum: Object.values(TASK_TYPE) },
    }],

    isDeleted: { type: Boolean, default: false }
}, { timestamps: true, versionKey: false })

export const taskModel = mongoose.model('task', TaskSchema);