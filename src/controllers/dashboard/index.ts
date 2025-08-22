import { Request, Response } from "express";
import { apiResponse } from "../../common";
import { findAllWithPopulate, getData, responseMessage } from "../../helper";
import { leaveModel, taskModel, userModel } from "../../database";

export const get_dashboard = async (req: Request, res: Response) => {
    let { user } = req.headers
    try {
        let [sec1, sec2, sec3] = await Promise.all([
            (async () => {
                let birthday = await upcoming_birthday_data_all_user(user);
                return { birthday };
            })(),

            (async () => {
                let tasks = await task_data_per_day(user);
                return { tasks };
            })(),

            (async () => {
                let leaves = await leave_data_approve_by_admin(user);
                return { approvedLeaves: leaves };
            })(),
        ]);

        return res.status(200)
            .json(new apiResponse(200, responseMessage?.getDataSuccess("dashboard"), { sec1, sec2, sec3 }, {}));

    } catch (error) {
        return res
            .status(500)
            .json(new apiResponse(500, responseMessage?.internalServerError, {}, error));
    }
};

export const upcoming_birthday_data_all_user = async (user) => {
    let today = new Date();
    let next7Days = new Date();
    next7Days.setDate(today.getDate() + 7);

    return await getData(
        userModel,
        { dob: { $gte: today, $lte: next7Days } },
        "_id firstName lastName dob"
    );
};

export const task_data_per_day = async (user) => {
    let today = new Date();
    let tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    return await findAllWithPopulate(
        taskModel,
        { createdAt: { $gte: today, $lt: tomorrow } },
        {},
        {},
        { path: "userId", select: "firstName lastName" }
    );
};

export const leave_data_approve_by_admin = async (user) => {
    return await findAllWithPopulate(
        leaveModel,
        { isApproved: true },
        {},
        {},
        { path: "userId", select: "firstName lastName" }
    );
};