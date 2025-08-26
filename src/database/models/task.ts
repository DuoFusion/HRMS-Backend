const mongoose = require('mongoose');
import { TASK_STATUS, TASK_TYPE } from "../../common";

const TaskSchema = new mongoose.Schema({
    title: { type: String },
    description: { type: String },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'project' },
    status: { type: String, enum: Object.values(TASK_STATUS) },
    startDate: { type: Date },
    endDate: { type: Date },

    timer: {
        isRunning: { type: Boolean, default: false },
        startTime: { type: String, default: null },
        totalTime: { type: Number }
    },

    remarks: [{
        text: { type: String },
        type: { type: String, enum: Object.values(TASK_TYPE) },
    }],

    statusHistory: [{
        fromStatus: { type: String, enum: Object.values(TASK_STATUS) },
        toStatus: { type: String, enum: Object.values(TASK_STATUS) },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
        changeDate: { type: Date, default: Date.now }
    }],

    isDeleted: { type: Boolean, default: false }
}, { timestamps: true, versionKey: false })

export const taskModel = mongoose.model('task', TaskSchema);