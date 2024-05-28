import express from "express";
import db from "../db/conn.mjs";

import { ObjectId } from "mongodb";
import { decodeToken } from "../middleware.mjs"
import { reponseSuccess, reponseError, hashPassword, verifyPassword, isEmailValid, adminExists, lecturerExists, generatePassword } from "../utils.mjs"
import { COLLECTION_LECTURERS, HOD, LECTURER } from "../constants.mjs";

const router = express.Router();

router.post("/lecturers", decodeToken, async (req, res) => {
    try {
        const { email } = res.locals.decoded_token

        const adminAvailable = await adminExists(email)

        if (!adminAvailable) {
            return reponseError(res, "Invalid credentials!", 401)
        }

        const { lecturers } = req.body

        if (lecturers == null || !Array.isArray(lecturers) || lecturers.length <= 0) {
            return reponseError(res, "Invalid body param!", 400)
        }

        let collection = await db.collection(COLLECTION_LECTURERS)

        const lecturerEmailSet = new Set()
        const lecturerNameSet = new Set()
        const hodMap = {}
        const processedLecturers = []
        const processedLecturersMinified = []

        for (const lecturer of lecturers) {
            const email = lecturer.email
            const name = lecturer.fullname

            if (!isEmailValid(email)) {
                return reponseError(res, "Invalid email address", 400)
            }

            if (lecturerEmailSet.has(email)) {
                return reponseError(res, `Duplicate email: ${email}`, 400)
            }

            const emailNotAvailable = await lecturerExists({email: email})

            if (emailNotAvailable) {
                return reponseError(res, "Email address has been used", 400)
            }

            if (lecturerNameSet.has(name)) {
                return reponseError(res, `Duplicate name: ${name}`, 400)
            }

            const duplicateName = await lecturerExists({fullname: name})

            if (duplicateName) {
                return reponseError(res, "Name already exists", 400)
            }

            if (lecturer.type !== HOD && lecturer.type !== LECTURER) {
                return reponseError(res, "Invalid lecturer role", 400)
            }
            
            const password = generatePassword(name)

            if (password === null) {
                return reponseError(res, "failed to generate password", 400)
            }

            const passwordHash = await hashPassword(password)

            lecturer.initial_password = password
            lecturer.password = passwordHash
            lecturer.updated_password = false

            if (lecturer.type == HOD) {
                let hodResult = await collection.findOne({type: HOD, department: lecturer.department})
                
                if (hodResult !== null) {
                    return reponseError(res, "department already has an HOD", 400)
                }

                if (hodMap[lecturer.department]) {
                    return reponseError(res, "multiple HODs for one department", 400)
                }

                hodMap[lecturer.department] = name
            }

            const now = new Date();
            lecturer.created_at = now
            lecturer.updated_at = now

            lecturerEmailSet.add(email)
            lecturerNameSet.add(name)
            processedLecturers.push(lecturer)

            // processedLecturersMinified.push({
            //     "title": lecturer.title,
            //     "fullname": lecturer.fullname,
            //     "department": lecturer.department,
            //     "designation": lecturer.designation,
            //     "phone_number": lecturer.phone_number,
            //     "email": lecturer.email,
            //     "type": lecturer.type,
            //     "initial_password": lecturer.initial_password,
            //     "updated_password": lecturer.updated_password,
            //     "created_at": lecturer.created_at,
            //     "updated_at": lecturer.updated_at,
            //     "_id": lecturer._id
            // })
        }
        
        let result = await collection.insertMany(processedLecturers)

        if (!result.acknowledged) {
            return reponseError(res, "failed to add lecturers", 400)
        }
  
        
        reponseSuccess(res, "successful", lecturers.map(lecturer => {
            delete lecturer.password
            return lecturer
        }))
    } catch(error) {
        console.log("Error: ", error)
        reponseError(res, "failed to add lecturers")
    } 
});

router.get("/lecturers", decodeToken, async (req, res) => {
    try {
        const { email } = res.locals.decoded_token

        const adminAvailable = await adminExists(email)

        if (!adminAvailable) {
            return reponseError(res, "Invalid credentials!", 401)
        }

        let collection = await db.collection(COLLECTION_LECTURERS)

        let result = await collection.find().limit(50).toArray()

        if (result == null) {
            return reponseError(res, "lecturers not found", 404)
        }

        const lecturers = result.map((lecturer) => {
            delete lecturer.password

            return lecturer
        })
  
        reponseSuccess(res, "successful", lecturers)
    } catch(error) {
        console.log("Error: ", error)
        reponseError(res, "failed to get lecturers")
    } 
});

router.get("/lecturers/:id", decodeToken, async (req, res) => {
    try {
        const { email } = res.locals.decoded_token

        const adminAvailable = await adminExists(email)

        if (!adminAvailable) {
            return reponseError(res, "Invalid credentials!", 401)
        }

        const id = req.params.id
        const objectId = new ObjectId(id)

        let collection = await db.collection(COLLECTION_LECTURERS)
        
        let result = await collection.findOne({_id: objectId})

        if (result == null) {
            return reponseError(res, "failed to get lecturer", 400)
        }

        delete result.password
  
        reponseSuccess(res, "successful", result)
    } catch(error) {
        console.log("Error: ", error)
        reponseError(res, "failed to get lecturer")
    }
});

export default router;