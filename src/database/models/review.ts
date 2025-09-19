import { ref } from "joi";

const mongoose = require('mongoose')

const reviewSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'company' },
    red: { type: String },
    yellow: { type: String },
    green: { type: String },
    rating: { type: Number, min: 1, max: 5 },
    isDeleted: { type: Boolean, default: false },
}, { timestamps: true, versionKey: false });

export const reviewModel = mongoose.model("reviews", reviewSchema);
