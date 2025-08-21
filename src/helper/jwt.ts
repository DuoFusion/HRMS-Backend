import jwt from 'jsonwebtoken'
import { apiResponse } from '../common'
import { Request, Response } from 'express'
import { responseMessage } from './response'
import { config } from '../../config'
import { userModel } from '../database'
import { getFirstMatch } from './database_service'

const ObjectId = require("mongoose").Types.ObjectId
const jwt_token_secret = config.JWT_TOKEN_SECRET;

export const    adminJWT = async (req: Request, res: Response, next) => {
    let { authorization } = req.headers, result: any
    if (authorization) {
        try {
            let isVerifyToken = jwt.verify(authorization, jwt_token_secret)
            result = await getFirstMatch(userModel, { _id: new ObjectId(isVerifyToken.userId), isDeleted: false }, '-password', {});
            if (result?.isBlocked == true) return res.status(410).json(new apiResponse(410, responseMessage?.accountBlock, {}, {}));
            if (result?.isDeleted == false) {
                req.headers.user = result
                return next()
            } else {
                return res.status(410).json(new apiResponse(410, responseMessage?.invalidToken, {}, {}))
            }
        } catch (err) {
            if (err.message == "invalid signature") return res.status(410).json(new apiResponse(410, responseMessage?.differentToken, {}, {}))
            console.log(err)
            return res.status(410).json(new apiResponse(410, responseMessage.invalidToken, {}, {}))
        }
    } else {
        return res.status(410).json(new apiResponse(410, responseMessage?.tokenNotFound, {}, {}))
    }
}
