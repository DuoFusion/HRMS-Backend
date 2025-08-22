import { Request, Response } from "express";
import { apiResponse } from "../../common";
import { findAllWithPopulate, getData, responseMessage } from "../../helper";
import { leaveModel, taskModel, userModel } from "../../database";

export const get_dashboard = async (req, res) => {
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
        return res.status(200).json(new apiResponse(200, responseMessage?.getDataSuccess("dashboard"), { sec1, sec2, sec3 }, {}));
    } catch (error) {
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, error));
    }
};


export const upcoming_birthday_data_all_user = async (user) => {
    const today = new Date();
    const next7 = new Date();
    next7.setDate(today.getDate() + 7);

    const year = today.getFullYear();

    return await userModel.aggregate([
        {
            $addFields: {
                birthday: {
                    $dateFromParts: {
                        year,
                        month: { $month: "$dob" },
                        day: { $dayOfMonth: "$dob" }
                    }
                }
            }
        },
        {
            $match: {
                birthday: { $gte: today, $lte: next7 }
            }
        },
        { $project: { firstName: 1, lastName: 1, dob: 1 } },
        { $sort: { birthday: 1 } }
    ]);
};

export const task_data_per_day = async (user) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    return await taskModel.aggregate([
        {
            $match: {
                isDeleted: false,
                startDate: { $gte: today, $lt: tomorrow }
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "userId",
                foreignField: "_id",
                as: "user"
            }
        },
        { $unwind: "$user" },
        {
            $project: {
                title: 1,
                description: 1,
                status: 1,
                "user.firstName": 1,
                "user.lastName": 1
            }
        },
        { $sort: { startDate: 1 } }
    ]);
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