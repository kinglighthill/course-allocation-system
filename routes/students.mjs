import express from "express";
import db from "../db/conn.mjs";
import { ObjectId } from "mongodb";

const router = express.Router();

function getAllAllocatedCourses() {

}

router.get("/allocated-courses", async (req, res) => {
    res.json({
        status: true,
        data: "Student",
        message: "successful"
    }).status(200);
});

router.get("/allocated-courses/:id", async (req, res) => {
    res.json({
        status: true,
        data: "Student",
        message: "successful"
    }).status(200);
});


export default router;