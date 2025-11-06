import { apiResponse, HOLIDAY_TYPE, LEAVE_STATUS, ROLES } from "../../common";
import { responseMessage } from "../../helper";
import { holidayModel, leaveModel, taskModel, userModel } from "../../database";

const ObjectId = require('mongoose').Types.ObjectId;

export const get_dashboard = async (req, res) => {
    let { user } = req.headers
    try {
        let [sec1, sec2, sec3] = await Promise.all([
            (async () => {
                let birthday = await upcoming_birthday_data_all_user();
                let holiday = await holiday_data_public();
                return { birthday, holiday };
            })(),

            (async () => {
                let tasks = await task_data_per_day(user);
                return { tasks };
            })(),

            (async () => {
                let leaves = await leave_data_approve_by_admin();
                return { approvedLeaves: leaves };
            })(),
        ]);
        return res.status(200).json(new apiResponse(200, responseMessage?.getDataSuccess("dashboard"), { sec1, sec2, sec3 }, {}));
    } catch (error) {
        console.log(error);
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, error));
    }
};


export const upcoming_birthday_data_all_user = async () => {
    try {
        const today = new Date();
        const currentMonth = today.getMonth() + 1;
        const currentDay = today.getDate();

        return await userModel.aggregate([
            {
                $match: {
                    isDeleted: false,
                    isBlocked: false
                }
            },
            {
                $addFields: {
                    dobIST: {
                        $dateAdd: {
                            startDate: {
                                $dateAdd: {
                                    startDate: "$dob",
                                    unit: "hour",
                                    amount: 5
                                }
                            },
                            unit: "minute",
                            amount: 30
                        }
                    }
                }
            },
            {
                $addFields: {
                    birthMonth: { $month: "$dobIST" },
                    birthDay: { $dayOfMonth: "$dobIST" },

                    isToday: {
                        $and: [
                            { $eq: [{ $month: "$dobIST" }, currentMonth] },
                            { $eq: [{ $dayOfMonth: "$dobIST" }, currentDay] }
                        ]
                    },

                    daysUntilBirthday: {
                        $let: {
                            vars: {
                                monthDiff: { $subtract: [{ $month: "$dobIST" }, currentMonth] },
                                dayDiff: { $subtract: [{ $dayOfMonth: "$dobIST" }, currentDay] }
                            },
                            in: {
                                $cond: {
                                    if: { $eq: ["$$monthDiff", 0] },
                                    then: {
                                        $cond: {
                                            if: { $gte: ["$$dayDiff", 0] },
                                            then: "$$dayDiff",
                                            else: { $add: [365, "$$dayDiff"] }
                                        }
                                    },
                                    else: {
                                        $cond: {
                                            if: { $gt: ["$$monthDiff", 0] },
                                            then: { $add: ["$$dayDiff", { $multiply: ["$$monthDiff", 30] }] },
                                            else: { $add: ["$$dayDiff", { $multiply: [{ $add: [12, "$$monthDiff"] }, 30] }] } // Next year
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            {
                $match: {
                    isDeleted: false,
                    isBlocked: false,
                }
            },
            {
                $addFields: {
                    isValidUpcoming: {
                        $or: [
                            { $gt: ["$daysUntilBirthday", 0] },
                            { $eq: ["$daysUntilBirthday", 0] }
                        ]
                    }
                }
            },
            { $match: { isValidUpcoming: true } },
            {
                $project: {
                    _id: 0,
                    fullName: 1,
                    profilePhoto: 1,
                    birthMonth: 1,
                    birthDay: 1,
                    daysUntilBirthday: 1,
                    isToday: 1
                }
            },
            { $sort: { daysUntilBirthday: 1 } },
            { $limit: 4 }
        ]);
    } catch (error) {
        console.log(error);
        throw error;
    }
};


export const task_data_per_day = async (user) => {
    let match: any = {};
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        if (user.role !== ROLES.ADMIN) {
            match.$or = [
                { userId: new ObjectId(user._id) },
                { userIds: { $in: [new ObjectId(user._id)] } }
            ];
        }

        return await taskModel.aggregate([
            {
                $match: {
                    ...match,
                    isDeleted: false,
                    endDate: { $gte: today }
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
            { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: "projects",
                    localField: "projectId",
                    foreignField: "_id",
                    as: "project"
                }
            },
            { $unwind: { path: "$project", preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: "users",
                    localField: "userIds",
                    foreignField: "_id",
                    as: "assignedUsers"
                }
            },
            {
                $project: {
                    title: 1,
                    description: 1,
                    status: 1,
                    "user.fullName": 1,
                    "user.profilePhoto": 1,
                    "project.name": 1,
                    assignedUsers: {
                        $map: {
                            input: "$assignedUsers",
                            as: "u",
                            in: {
                                fullName: "$$u.fullName",
                                profilePhoto: "$$u.profilePhoto"
                            }
                        }
                    }
                }
            },
            { $sort: { startDate: 1 } }
        ]);
    } catch (error) {
        console.log(error);
    }
};

export const leave_data_approve_by_admin = async () => {
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
                    "user.fullName": 1,
                    "user.profilePhoto": 1
                }
            },
            { $sort: { endDate: 1 } }
        ]);
    } catch (error) {
        console.log(error);
    }
};

export const holiday_data_public = async () => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return await holidayModel.aggregate([
            {
                $match: {
                    isDeleted: false,
                    isBlocked: false,
                    type: HOLIDAY_TYPE.PUBLIC,
                    date: { $gte: today }
                }
            },
            {
                $project: {
                    _id: 0,
                    title: 1,
                    date: 1,
                }
            },
            { $sort: { date: 1 } },
            { $limit: 5 }
        ]);
    } catch (error) {
        console.log(error);
    }
};