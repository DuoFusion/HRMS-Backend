import { apiResponse } from "../../common";
import { countData, createData, getData, getDataWithSorting, reqInfo, responseMessage, updateData } from "../../helper";
import { reviewModel } from "../../database";
import { addReviewSchema, deleteReviewSchema, getAllReviewSchema, getReviewSchema, updateReviewSchema } from "../../validation";

const ObjectId = require("mongoose").Types.ObjectId;

export const add_review = async (req, res) => {
    reqInfo(req)
    try {
        const { error, value } = addReviewSchema.validate(req.body);
        if (error) { return res.status(400).json(new apiResponse(400, error.details[0].message, {}, {})); }

        const newReview = await createData(reviewModel, value);
        return res.status(200).json(new apiResponse(200, responseMessage?.addDataSuccess("Review"), newReview, {}));
    } catch (error) {
        console.log(error);
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, error));
    }
};

export const edit_review_by_id = async (req, res) => {
    reqInfo(req)
    try {
        const { error, value } = updateReviewSchema.validate(req.body);
        if (error) { return res.status(400).json(new apiResponse(400, error.details[0].message, {}, {})); }

        const response = await updateData(reviewModel, { _id: new ObjectId(value.reviewId), isDeleted: false }, value);

        if (!response) { return res.status(404).json(new apiResponse(404, responseMessage?.getDataNotFound("Review"), {}, {})); }
        return res.status(200).json(new apiResponse(200, responseMessage?.updateDataSuccess("Review"), response, {}));
    } catch (error) {
        console.log(error);
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, error));
    }
};

export const delete_review_by_id = async (req, res) => {
    reqInfo(req)
    try {
        const { error, value } = deleteReviewSchema.validate(req.params);
        if (error) { return res.status(400).json(new apiResponse(400, error.details[0].message, {}, {})); }

        const response = await updateData(reviewModel, { _id: new ObjectId(value.id), isDeleted: false }, { isDeleted: true }, { new: true });

        if (!response) { return res.status(404).json(new apiResponse(404, responseMessage?.getDataNotFound("Review"), {}, {})); }
        return res.status(200).json(new apiResponse(200, responseMessage?.deleteDataSuccess("Review"), response, {}));
    } catch (error) {
        console.log(error);
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, error));
    }
};

export const get_review_by_id = async (req, res) => {
    reqInfo(req)
    try {
        const { error, value } = getReviewSchema.validate(req.params);
        if (error) { return res.status(400).json(new apiResponse(400, error.details[0].message, {}, {})); }

        const response = await getData(reviewModel, { _id: new ObjectId(value.id), isDeleted: false });
        if (!response) { return res.status(404).json(new apiResponse(404, responseMessage?.getDataNotFound("Review"), {}, {})); }
        return res.status(200).json(new apiResponse(200, responseMessage?.getDataSuccess("Review"), response, {}));
    } catch (error) {
        console.log(error);
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, error));
    }
};


export const get_all_reviews = async (req, res) => {
    reqInfo(req)
    try {
        const { error, value } = getAllReviewSchema.validate(req.query)
        if (error) { return res.status(400).json(new apiResponse(400, error?.details[0]?.message, {}, {})) }

        let { page, limit, search } = value, criteria: any = {}, options: any = { lean: true };

        criteria.isDeleted = false;
        if (search) {
            criteria.$or = [
                { description: { $regex: search, $options: 'si' } },
            ];
        }
        options.sort = { createdAt: -1 }

        if (page && limit) {
            options.skip = (parseInt(page) - 1) * parseInt(limit);
            options.limit = parseInt(limit);
        }

        const response = await getDataWithSorting(reviewModel, criteria, {}, options);
        const totalCount = await countData(reviewModel, criteria);

        const stateObj = {
            page: parseInt(page) || 1,
            limit: parseInt(limit) || totalCount,
            page_limit: Math.ceil(totalCount / (parseInt(limit) || totalCount)) || 1,
        };

        return res.status(200).json(new apiResponse(200, responseMessage.getDataSuccess('review'), {
            review_data: response,
            totalData: totalCount,
            state: stateObj
        }, {}));
    } catch (error) {
        console.log(error);
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, error))
    }
}