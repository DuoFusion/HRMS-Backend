const mongoose = require('mongoose');

const seatSchema = new mongoose.Schema({
    seatNumber: { type: Number },
    floor: { type: String, default: null },
    section: { type: String, default: null },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
    isDeleted: { type: Boolean, default: false }
}, { timestamps: true, versionKey: false });

export const seatModel = mongoose.model("seat", seatSchema);