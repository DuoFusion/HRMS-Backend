import mongoose from "mongoose";

const dashboardSchema = new mongoose.Schema({
    upcomingBday: [{ type: mongoose.Schema.Types.ObjectId, ref: "user" }],
    taskId: [{ type: mongoose.Schema.Types.ObjectId, ref: "task" }],
    leaveId: [{ type: mongoose.Schema.Types.ObjectId, ref: "leave" }],
}, { timestamps: true, versionKey: false });

export const dashboardModel = mongoose.model("dashboard", dashboardSchema);
