import mongoose from 'mongoose'
import { apiResponse, ROLES, } from '../common'

export const VALIDATE_ROLE = (roles) => async (req: any, res: any, next) => {
    let { user } = req.headers;
    try {
        console.log(roles.includes(user.role), "isAuthorized");
        if (roles.includes(user.role))
            return next();
        return res.status(422).json(new apiResponse(422, "Unauthorized", {}, {}));
    } catch (err) {
        console.log(err);
        return res.status(422).json(new apiResponse(422, "Unauthorized", {}, {}))
    }
} 
