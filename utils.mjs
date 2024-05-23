import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import crypto from "crypto"
import db from "./db/conn.mjs";
import "./loadEnvironment.mjs";

import { COLLECTION_ADMINS, COLLECTION_COURSES, COLLECTION_LECTURERS, EXPIRED } from "./constants.mjs";
import { ObjectId } from "mongodb";


const saltRounds = 10;

const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
const ACCESS_TOKEN_EXPIRE = process.env.ACCESS_TOKEN_EXPIRE || '1h'

export const reponseSuccess = (res, msg, data, code = 200) => {
    return res.status(code).json(
        {
            status: true,
            data: data,
            message: msg
        }
    )
}

export const reponseError = (res, errMsg, code = 500, data = null) => {
    return res.status(code).json(
        {
            status: false,
            data: data,
            message: errMsg
        }
    )
}

export const hashPassword = async (password) => {
    try {
        const salt = await bcrypt.genSalt(saltRounds)
        const hashedPassword = await bcrypt.hash(password, salt)

        return hashedPassword
    } catch (error) {
        console.error('Error hashing password:', error)
        throw error
    }
}

export const verifyPassword = async (plainPassword, hashedPassword) => {
    try {
        const match = await bcrypt.compare(plainPassword, hashedPassword)
        return match
    } catch (error) {
        console.error('Error verifying password:', error)
        return false
    }
};

export const isEmailValid = (email) => {
    return emailRegex.test(email)
};

export const createCustomToken = (payload) => {
    const options = {
        expiresIn: ACCESS_TOKEN_EXPIRE,
    };

    const token = jwt.sign(payload, JWT_SECRET, options);
    return token
};

export const verifyToken = (token) => {
    try {
        const payload = jwt.verify(token, JWT_SECRET);
        return payload
    } catch (err) {
        if (err.name == 'TokenExpiredError') {
            return EXPIRED
        }

        console.error('Token verification failed:', err);
        return null
    }
};

export const adminExists = async (email) => {
    let collection = await db.collection(COLLECTION_ADMINS)
    let result = await collection.findOne({email: email})

    return result !== null
}

export const lecturerExists = async (doc) => {
    let collection = await db.collection(COLLECTION_LECTURERS)
    let result = await collection.findOne(doc)

    return result !== null
}

export const getLecturer = async (id) => {
    try {
        const objectId = new ObjectId(id)
        let collection = await db.collection(COLLECTION_LECTURERS)
        let result = await collection.findOne({_id: objectId})
        
        if (result != null) {
            return {
                id: id,
                name: result.fullname
            }
        }

        return null
    } catch(error) {
        console.log("Error: ", error)
        return null
    }
}

export const courseExists = async (doc) => {
    let collection = await db.collection(COLLECTION_COURSES)
    let result = await collection.findOne(doc)

    return result !== null
}

export const generatePassword = (fullname) => {
    try {
        let names = fullname.split(' ')
        const initials = `${names[0][0]}${names[1][0]}`
        const password = crypto.randomBytes(6).toString('base64').slice(0, 8)
        return `${initials}-${password}`
    } catch(error) {
        console.log("Error: ", error)
        return null
    }
};