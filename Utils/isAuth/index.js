const jwt = require("jsonwebtoken")
const {AUTH_SECRET} = require("../../config/index")

exports.isAuth = async(req, res, next) => {
    try {
        const token = req.headers["authorization"]
        const validToken = await token.split(" ")[1]
        if(validToken){
            const user = await jwt.verify(validToken, AUTH_SECRET)
            req.user = user
            next()
        }else{
            return res.send("login to continue")
        }
    } catch (error) {
        console.log(error)
        res.send("Session expired! Login to continue")
    }
}