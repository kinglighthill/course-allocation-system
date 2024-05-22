import express from "express";
import db from "../db/conn.mjs";
import { ObjectId } from "mongodb";

const router = express.Router();

router.get("/", async (req, res) => {
    res.json({
        status: true,
        data: "HOD",
        message: "successful"
    }).status(200);
});

export default router;