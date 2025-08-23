import { apiResponse, LEAVE_STATUS, ROLES } from "../../common";
import { responseMessage } from "../../helper";
import { leaveModel, taskModel, userModel } from "../../database";

const ObjectId = require('mongoose').Types.ObjectId;

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
        console.log(error);
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, error));
    }
};


export const upcoming_birthday_data_all_user = async (user) => {
    try {
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
                    birthday: { $gte: today, $lte: next7 },
                    isDeleted: false,
                    isBlocked: false,
                }
            },
            { $project: { firstName: 1, lastName: 1, dob: 1 } },
            { $sort: { birthday: 1 } }
        ]);
    } catch (error) {
        console.log(error);
    }
};

export const task_data_per_day = async (user) => {
    let match: any = {}
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        if (user.role !== ROLES.ADMIN) match.userId = new ObjectId(user._id)

        return await taskModel.aggregate([
            {
                $match: {
                    ...match,
                    isDeleted: false,
                    isBlocked: false,
                    startDate: { $gte: today }
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
    } catch (error) {
        console.log(error);
    }
};


export const leave_data_approve_by_admin = async (user) => {
    try {
        return await leaveModel.aggregate([
            {
                $match: {
                    isDeleted: false,
                    isBlocked: false,
                    status: LEAVE_STATUS.APPROVED,
                    endDate: { $gte: new Date() }
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
                    startDate: 1,
                    endDate: 1,
                    type: 1,
                    reason: 1,
                    status: 1,
                    "user.firstName": 1,
                    "user.lastName": 1
                }
            },
            { $sort: { startDate: 1 } }
        ]);
    } catch (error) {
        console.log(error);
    }
};
