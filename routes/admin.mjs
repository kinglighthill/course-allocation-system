import express from "express";
import db from "../db/conn.mjs";
import { ObjectId } from "mongodb";

const router = express.Router();

router.get("/auth/sign-up", async (req, res) => {
    // let collection = await db.collection("posts");
    // let results = await collection.find({})
    //   .limit(50)
    //   .toArray();
  
    res.json({
        status: true,
        data: "Admin",
        message: "successful"
    }).status(200);
});

export default router;