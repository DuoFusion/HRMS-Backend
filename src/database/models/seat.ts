const mongoose = require('mongoose');

const seatSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "company" },
    seatNumber: { type: Number },
    floor: { type: String, default: null },
    section: { type: String, default: null },
    isDeleted: { type: Boolean, default: false }
}, { timestamps: true, versionKey: false });

export const seatModel = mongoose.model("seat", seatSchema);