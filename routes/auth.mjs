import express from "express";
import db from "../db/conn.mjs";

import { reponseSuccess, reponseError, hashPassword, verifyPassword, isEmailValid, adminExists, createCustomToken } from "../utils.mjs"
import { COLLECTION_ADMINS, COLLECTION_LECTURERS } from "../constants.mjs";

const router = express.Router();



router.post("/admin/sign-up", async (req, res) => {
    try {
        const { email, password } = req.body

        if (!isEmailValid(email)) {
            return reponseError(res, "Invalid email address", 400)
        }

        const emailNotAvailable = await adminExists(email)

        if (emailNotAvailable) {
            return reponseError(res, "Email address has been used", 400)
        }

        const passwordHash = await hashPassword(password)

        var admin = { email: email, password: passwordHash };

        let collection = await db.collection(COLLECTION_ADMINS)
        let result = await collection.insertOne(admin)

        if (!result.acknowledged) {
            return reponseError(res, "sign up failed", 400)
        }

        const customClaims = {
            uid: result.insertedId,
            _id: result.insertedId,
            email: email,
            role: "admin",
        };

        const accessToken = createCustomToken(customClaims)

        let adminResult = await collection.findOne({email: email})
        delete adminResult.password
    
        reponseSuccess(res, "successful", {
            access_token: accessToken,
            admin: adminResult
        })
    } catch(error) {
        reponseError(res, "sign up failed")
    } 
});

router.post("/admin/login", async (req, res) => {
    try {
        const { email, password } = req.body

        if (!isEmailValid(email)) {
            return reponseError(res, "Invalid email address", 400)
        }

        let collection = await db.collection(COLLECTION_ADMINS)
        let result = await collection.findOne({email: email})

        if (result === null) {
            return reponseError(res, "Email or password is incorrect", 404)
        }

        let isValidPassword = await verifyPassword(password, result.password)

        if (!isValidPassword) {
            return reponseError(res, "Email or password is incorrect", 404)
        }

        delete result.password

        const customClaims = {
            uid: result._id,
            email: email,
            role: "admin",
        };

        const accessToken = createCustomToken(customClaims)

        reponseSuccess(res, "successful", {
            access_token: accessToken,
            user_data: result
        })
    } catch(error) {
        reponseError(res, "login failed")
    } 
});

router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body

        if (!isEmailValid(email)) {
            return reponseError(res, "Invalid email address", 400)
        }

        let collection = await db.collection(COLLECTION_LECTURERS)
        let result = await collection.findOne({email: email})

        if (result === null) {
            return reponseError(res, "Email or password is incorrect", 404)
        }

        let isValidPassword = await verifyPassword(password, result.password)

        if (!isValidPassword) {
            return reponseError(res, "Email or password is incorrect", 404)
        }

        const customClaims = {
            uid: result._id,
            email: email,
            role: result.type,
        };

        const accessToken = createCustomToken(customClaims)

        reponseSuccess(res, "successful", {
            access_token: accessToken,
            user_data: {
                _id: result._id,
                email: result.email,
                role: result.type,
            }
        })
    } catch(error) {
        reponseError(res, "login failed")
    } 
});

router.get("/logout", async (req, res) => {
    reponseSuccess(res, "successful", null)
});

export default router;