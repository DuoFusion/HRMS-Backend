var mongoose = require('mongoose')

const userSessionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
    token: { type: String },
    isActive: { type: Boolean, default: true },
    refresh_token: { type: String }
}, { timestamps: true })

export const userSessionModel = mongoose.model('user_session', userSessionSchema)