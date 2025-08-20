import { bool, boolean, object, ref, string } from "joi";
import { HOLIDAY_TYPE } from "../../common";
import mongoose from "mongoose";

const holiDaySchema = new mongoose.Schema({
    title: { type: String },
    description: { type: String },
    date: { type: Date },
    type: { type: String, enum: Object.values(HOLIDAY_TYPE) },
    isRecurring: { type: Boolean },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
    isDeleted: { type: Boolean, default: false }
}, {
    timestamps: true, versionKey: false
});

export const holidayModel = mongoose.model('holiday', holiDaySchema)