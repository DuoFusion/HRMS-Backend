import * as bodyParser from 'body-parser'
import express from 'express'
import cors from 'cors'
import { mongooseConnection } from './database'
import * as packageInfo from '../package.json'
import { router } from './Routes'
import fs from 'fs'
import path from 'path'
import multer from 'multer';
import { seedAdminUser } from './helper'
import { monthlySalaryInvoiceJob, dailyAttendanceStatusJob } from './helper'
import { socketServer } from './helper/socket'
const app = express();

// app.use("/uploads", express.static(path.join(__dirname, "..", "..", "uploads")));
app.use("/uploads", (req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*"); // or your frontend URL
    res.header("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    next();
}, express.static(path.join(__dirname, "..", "..", "uploads")));

const fileFilter = (req, file, cb) => {
    if (
        file.mimetype === "image/png" ||
        file.mimetype === "image/jpg" ||
        file.mimetype === "image/jpeg"
    ) {
        cb(null, true);
    } else {
        cb(null, false);
    }
}

const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = "uploads";
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const sanitizedOriginalName = file.originalname.replace(/\s+/g, "-");
        cb(null, `${Date.now()}_${sanitizedOriginalName}`);
    },
});
app.use(cors())
app.use(mongooseConnection)
app.use(bodyParser.json({ limit: '200mb' }))
app.use(bodyParser.urlencoded({ limit: '200mb', extended: true }))
app.use(express.static(path.join(__dirname, "public")));
app.use(multer({ storage: fileStorage, fileFilter: fileFilter }).single("image"));

app.use(cors())
app.use(mongooseConnection)
app.use(bodyParser.json({ limit: '200mb' }))
app.use(bodyParser.urlencoded({ limit: '200mb', extended: true }))

const health = (req, res) => {
    return res.status(200).json({
        success: true,
        message: `HRMS Backend Server is Running`,
        app: packageInfo.name,
        version: packageInfo.version,
        description: packageInfo.description,
        author: packageInfo.author,
        license: packageInfo.license,
        timestamp: new Date().toISOString()
    })
}

const bad_gateway = (req, res) => { return res.status(502).json({ success: false, message: "HRMS Backend API Bad Gateway" }) }

app.get('/', health);
app.get('/health', health);
app.get('/isServerUp', (req, res) => {
    res.send('Server is running ');
});

app.use(router)
app.use('*', bad_gateway);

seedAdminUser();
monthlySalaryInvoiceJob.start();
dailyAttendanceStatusJob.start();

export default socketServer(app);
