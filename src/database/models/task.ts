const mongoose = require('mongoose');
import { TASK_STATUS, TASK_TYPE } from "../../common";

const TaskSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, default: '' },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'project' },
    status: { type: String, enum: Object.values(TASK_STATUS) },
    startDate: { type: Date },
    dueDate: { type: Date },
    endDate: { type: Date },
    progressPercent: { type: Number, min: 0, max: 100, default: 0 },

    assignees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'user' }],
    commentsCount: { type: Number, default: 0 },
    attachmentsCount: { type: Number, default: 0 },

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

    comments: [{
        text: { type: String },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
        createdAt: { type: Date, default: Date.now },
    }],

    isDeleted: { type: Boolean, default: false }
}, { timestamps: true, versionKey: false })

export const taskModel = mongoose.model('task', TaskSchema);