import express from "express";
import db from "../db/conn.mjs";

import { ObjectId } from "mongodb";
import { decodeToken } from "../middleware.mjs"
import { reponseSuccess, reponseError, lecturerExists } from "../utils.mjs"
import { COLLECTION_COURSES, COLLECTION_LECTURERS, HOD } from "../constants.mjs";

const router = express.Router();

const isAuthorized = async (req, res, next) => {
    try {
        const { email } = res.locals.decoded_token

        let collection = await db.collection(COLLECTION_LECTURERS)
        let result = await collection.findOne({email: email})

        if (result == null) {
            return reponseError(res, "user not a lecturer", 401)
        }

        if (result.type != HOD) {
            return reponseError(res, "lecturer not a authorized", 401)
        }
        
        return next()
    } catch (error) {
        return next(error)
    }
}

router.post("/courses", decodeToken, isAuthorized, async (req, res) => {
    try {
        let collection = await db.collection(COLLECTION_COURSES)
        let result = await collection.find().limit(50).toArray()

        reponseSuccess(res, "successful", result)
    } catch(error) {
        console.log("Error: ", error)
        reponseError(res, "failed to add courses")
    }
});

router.get("/courses/", decodeToken, isAuthorized, async (req, res) => {
    try {
        let collection = await db.collection(COLLECTION_COURSES)
        let result = await collection.find({}).limit(50).toArray()

        reponseSuccess(res, "successful", result)
    } catch(error) {
        console.log("Error: ", error)
        reponseError(res, "failed to add courses")
    }
});

router.put("/courses/:id", decodeToken, isAuthorized, async (req, res) => {
    res.json({
        status: true,
        data: "HOD",
        message: "successful"
    }).status(200);
});

router.delete("/courses/:id", decodeToken, isAuthorized, async (req, res) => {
    res.json({
        status: true,
        data: "HOD",
        message: "successful"
    }).status(200);
});

router.get("/lecturers", decodeToken, isAuthorized, async (req, res) => {
    let collection = await db.collection(COLLECTION_LECTURERS)
        let result = await collection.find().limit(50).toArray()

        if (result == null) {
            return reponseError(res, "lecturer not found", 404)
        }

        const lecturers = result.map((lecturer) => {
            delete lecturer.initial_password
            delete lecturer.password

            return lecturer
        })
  
        reponseSuccess(res, "successful", lecturers)
});

router.post("/courses/allocate", decodeToken, isAuthorized, async (req, res) => {
    res.json({
        status: true,
        data: "HOD",
        message: "successful"
    }).status(200);
});


export default router;