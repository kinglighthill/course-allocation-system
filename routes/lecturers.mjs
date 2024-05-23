import express from "express";
import db from "../db/conn.mjs";

import { ObjectId } from "mongodb";
import { decodeToken } from "../middleware.mjs"
import { reponseSuccess, reponseError } from "../utils.mjs"
import { COLLECTION_LECTURERS } from "../constants.mjs";

const router = express.Router();

router.get("/courses", decodeToken, async (req, res) => {
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