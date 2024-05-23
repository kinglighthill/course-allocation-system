import { EXPIRED } from "./constants.mjs"
import { reponseError, verifyToken } from "./utils.mjs"

export const decodeToken = async (req, res, next) => {
    try {
        if (!req.headers.authorization) {
            return reponseError(res, "No credentials sent!", 401)
        }

        const accessToken = req.headers.authorization.split(' ')[1]
        
        try {
            const claims = await verifyToken(accessToken)

            if (claims === EXPIRED) {
                return reponseError(res, "token expired", 400)
            }

            if (claims == null) {
                return reponseError(res, "Invalid auth credentials!", 401)
            }

            res.locals.decoded_token = claims
            return next()
        } catch (err) {
            return reponseError(res, "Invalid auth credentials!", 401)
        }
        
    } catch (error) {
        return next(error)
    }
}