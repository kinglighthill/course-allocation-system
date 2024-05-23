import express from "express";
import db from "../db/conn.mjs";

import { ObjectId } from "mongodb";
import { decodeToken } from "../middleware.mjs"
import { reponseSuccess, reponseError, getLecturer } from "../utils.mjs"
import { COLLECTION_COURSES, COLLECTION_LECTURERS } from "../constants.mjs";

const router = express.Router();

router.get("/courses", decodeToken, async (req, res) => {
    try {
        const { uid } = res.locals.decoded_token

        let collection = await db.collection(COLLECTION_COURSES)

        const query = {
            is_allocated: true,
            $or: [
                { 'allocation.head_lecturer': uid },
                { 'allocation.assistant_lecturer': uid }
            ]
        };
        let result = await collection.find(query).limit(50).toArray()

        if (result == null) {
            return reponseError(res, "courses not found", 404)
        }

        const courses = []

        for (let i = 0; i < result.length; i++) {
            const course = result[i]

            course.session = course.allocation.session
        
            const headLecturer = await getLecturer(course.allocation.head_lecturer)
            const assistantLecturer = await getLecturer(course.allocation.assistant_lecturer)
    
            if (headLecturer != null) {
                course.head_lecturer = headLecturer
            }
    
            if (assistantLecturer != null) {
                course.assistant_lecturer = assistantLecturer
            }

            delete course.allocation

            courses.push(course)
        }

        reponseSuccess(res, "successful", courses)
    } catch(error) {
        console.log("Error: ", error)
        reponseError(res, "failed to fetch courses")
    }
});

router.get("/profile", decodeToken, async (req, res) => {
    try {
        const { uid } = res.locals.decoded_token

        let collection = await db.collection(COLLECTION_LECTURERS)
        let result = await collection.findOne({_id: new ObjectId(uid)})

        if (result == null) {
            return reponseError(res, "lecturer not found", 404)
        }

        delete result.initial_password
        delete result.password
  
        reponseSuccess(res, "successful", result)
    } catch(error) {
        console.log("Error: ", error)
        reponseError(res, "failed to fetch lecturer profile")
    }
});

export default router;