import express from "express";
import db from "../db/conn.mjs";

import { ObjectId } from "mongodb";
import { COLLECTION_COURSES } from "../constants.mjs";
import { reponseSuccess, reponseError, lecturerExists, getLecturer } from "../utils.mjs";

const router = express.Router();

router.get("/allocated-courses", async (req, res) => {
    try {
        let collection = await db.collection(COLLECTION_COURSES)
        let result = await collection.find({is_allocated: true}).limit(50).toArray()

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

router.get("/allocated-courses/:id", async (req, res) => {
    try {
        const id = req.params.id
        const objectId = new ObjectId(id)

        let collection = await db.collection(COLLECTION_COURSES)
        let result = await collection.findOne({_id: objectId, is_allocated: true})

        if (result == null) {
            return reponseError(res, "course not found", 404)
        }

        lecturerExists

        result.session = result.allocation.session

        const headLecturer = await getLecturer(result.allocation.head_lecturer)
        const assistantLecturer = await getLecturer(result.allocation.assistant_lecturer)

        if (headLecturer != null) {
            result.head_lecturer = headLecturer
        }

        if (assistantLecturer != null) {
            result.assistant_lecturer = assistantLecturer
        }

        delete result.allocation

        reponseSuccess(res, "successful", result)
    } catch(error) {
        console.log("Error: ", error)
        reponseError(res, "failed to fetch course")
    }
});


export default router;