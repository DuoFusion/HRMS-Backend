import { Router } from 'express';
import { responseMessage } from '../helper';
import { config } from '../../config';
import { apiResponse } from '../common';
import fs from 'fs';
import path from 'path';
import url from 'url';
import { log } from 'winston';
const router = Router();

router.post("", (req: any, res: any) => {
    try {
        let file = req.file
        let imageUrl = config.BACKEND_URL + `/uploads/${file.filename}`;
        return res.status(200).json(new apiResponse(200, responseMessage.addDataSuccess("Image"), imageUrl, {}));
    } catch (error) {
        console.log(error)
        return res.status(500).json(new apiResponse(500, responseMessage.internalServerError, {}, error));
    }
})

router.delete("/", (req: any, res: any) => {
    try {
        const { imageUrl } = req.body;
        if (!imageUrl) return res.status(400).json(new apiResponse(400, "Image URL is required", {}, {}));
        const parsedUrl = url.parse(imageUrl);
        const filename = path.basename(parsedUrl.pathname || "");
        if (!filename) return res.status(400).json(new apiResponse(400, "Invalid image URL", {}, {}));
        const imagePath = path.join(process.cwd(), "uploads", filename);
        if (!fs.existsSync(imagePath)) return res.status(404).json(new apiResponse(404, "Image not found", {}, {}));
        fs.unlinkSync(imagePath);
        return res.status(200).json(new apiResponse(200, "Image deleted successfully", {}, {}));
    } catch (error) {
        console.log(error)
        return res.status(500).json(new apiResponse(500, responseMessage.internalServerError, {}, error));
    }
});
export const uploadRoutes = router