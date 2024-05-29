import express from "express";
import db from "../db/conn.mjs";

import { ObjectId } from "mongodb";
import { decodeToken } from "../middleware.mjs"
import { reponseSuccess, reponseError, lecturerExists, courseExists, getLecturer } from "../utils.mjs"
import { COLLECTION_COURSES, COLLECTION_LECTURERS, FIRST_SEMESTER, HOD, SECOND_SEMESTER } from "../constants.mjs";

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
        const { courses } = req.body

        if (courses == null || !Array.isArray(courses) || courses.length <= 0) {
            return reponseError(res, "Invalid body param!", 400)
        }

        let collection = await db.collection(COLLECTION_COURSES)

        const courseCodeSet = new Set()
        const courseTitleSet = new Set()
        const processedCourses = []

        for (const course of courses) {
            const code = course.course_code
            const title = course.course_title

            if (courseCodeSet.has(code)) {
                return reponseError(res, `Duplicate course code: ${code}`, 400)
            }

            const duplicateCourseCode = await courseExists({course_code: code})

            if (duplicateCourseCode) {
                return reponseError(res, "Course code already exists", 400)
            }

            if (courseTitleSet.has(title)) {
                return reponseError(res, `Duplicate course title: ${title}`, 400)
            }

            const duplicateCourseTitle = await lecturerExists({course_title: title})

            if (duplicateCourseTitle) {
                return reponseError(res, "Course title already exists", 400)
            }

            if (course.semester !== FIRST_SEMESTER && course.semester !== SECOND_SEMESTER) {
                return reponseError(res, "Invalid course semester", 400)
            }

            course.is_allocated = false

            const now = new Date()
            course.created_at = now
            course.updated_at = now

            courseCodeSet.add(code)
            courseTitleSet.add(title)
            processedCourses.push(course)
        }
        
        let result = await collection.insertMany(processedCourses)

        if (!result.acknowledged) {
            return reponseError(res, "failed to add courses", 400)
        }
  
        reponseSuccess(res, "successful", processedCourses)
    } catch(error) {
        console.log("Error: ", error)
        reponseError(res, "failed to add courses")
    }
});

router.get("/courses/", decodeToken, isAuthorized, async (req, res) => {
    try {
        let collection = await db.collection(COLLECTION_COURSES)
        let result = await collection.find({}).limit(50).toArray()

        if (result == null) {
            return reponseError(res, "courses not found", 404)
        }

        const courses = result.map((course) => {
            delete course.allocation

            return course
        })

        reponseSuccess(res, "successful", courses)
    } catch(error) {
        console.log("Error: ", error)
        reponseError(res, "failed to fetch courses")
    }
});

router.put("/courses/:id", decodeToken, isAuthorized, async (req, res) => {
    try {
        const { course } = req.body
        const id = req.params.id

        if (course == null || id == null) {
            return reponseError(res, "Invalid params!", 400)
        }

        let collection = await db.collection(COLLECTION_COURSES)

        const objectId = new ObjectId(id)

        delete course.is_allocated
        delete course.created_at

        const now = new Date()
        course.updated_at = now

        if (course.course_code) {
            const duplicateCourseCode = await courseExists({course_code: course.course_code})

            if (duplicateCourseCode) {
                return reponseError(res, "Course code already exists", 400)
            }
        }

        if (course.course_title) {
            const duplicateCourseTitle = await courseExists({course_title: course.course_title})

            if (duplicateCourseTitle) {
                return reponseError(res, "Course title already exists", 400)
            }
        }   
        
        let result = await collection.updateOne({_id: objectId}, {$set: course})

        if (!result.acknowledged) {
            return reponseError(res, "failed to edit course", 400)
        }

        result = await collection.findOne({_id: objectId})
  
        reponseSuccess(res, "successful", result)
    } catch(error) {
        console.log("Error: ", error)
        reponseError(res, "failed to edit course")
    }
});

router.delete("/courses/:id", decodeToken, isAuthorized, async (req, res) => {
    try {
        const id = req.params.id

        if (id == null) {
            return reponseError(res, "Invalid params!", 400)
        }

        let collection = await db.collection(COLLECTION_COURSES)

        const objectId = new ObjectId(id)
        
        let result = await collection.deleteOne({_id: objectId})

        if (!result.acknowledged) {
            return reponseError(res, "failed to delete course", 400)
        }
  
        reponseSuccess(res, "successful", {_id: id})
    } catch(error) {
        console.log("Error: ", error)
        reponseError(res, "failed to delete course")
    }
});

router.get("/lecturers", decodeToken, isAuthorized, async (req, res) => {
    let collection = await db.collection(COLLECTION_LECTURERS)
        let result = await collection.find().limit(50).toArray()

        if (result == null) {
            return reponseError(res, "lecturers not found", 404)
        }

        const lecturers = result.map((lecturer) => {
            delete lecturer.initial_password
            delete lecturer.password

            return lecturer
        })
  
        reponseSuccess(res, "successful", lecturers)
});

router.post("/courses/allocate", decodeToken, isAuthorized, async (req, res) => {
    try {
        const { allocation } = req.body

        if (allocation == null) {
            return reponseError(res, "Invalid body param!", 400)
        }

        let collection = await db.collection(COLLECTION_COURSES)

        const id = allocation.course_id

        const objectId = new ObjectId(id)

        const courseAvailable = await courseExists({_id: objectId})

        if (!courseAvailable) {
            return reponseError(res, "course does not exist", 400)
        }

        const head = allocation.head_lecturer
        const assistant = allocation.assistant_lecturer

        if (head == assistant) {
            return reponseError(res, "one lecturer cannot head and assist a course", 400)
        }

        const headExists = await lecturerExists({_id: new ObjectId(head)})
        if (!headExists) {
            return reponseError(res, "lecturer does not exist", 400)
        }

        const assistantExists = await lecturerExists({_id: new ObjectId(assistant)})
        if (!assistantExists) {
            return reponseError(res, "lecturer does not exist", 400)
        }

        delete allocation.course_id 

        const now = new Date()

        const course = {
            "is_allocated": true,
            "updated_at": now,
            "allocation": allocation
        }

        let result = await collection.updateOne({_id: objectId}, {$set: course})

        if (!result.acknowledged) {
            return reponseError(res, "failed to allocate course", 400)
        }

        result = await collection.findOne({_id: objectId})

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
        reponseError(res, "failed to allocate course")
    }
});


export default router;