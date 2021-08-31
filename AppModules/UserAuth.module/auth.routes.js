const express = require('express')
const rateLimit = require("express-rate-limit");

const router = express.Router();

const __UserData = require("./auth.model")
const __Logger = require("../LogModules/log.model")
const {isAuth} =require("../../utils/isAuth")
const {isValidIp} = require("../../utils/whitelistMiddleware")

const controller = require('./auth.contoller');

const limiter = rateLimit({
    max: 5,
    windowMs: 1 * 60 * 1000,
    statusCode: 200,
    message: {
     status: 429,
     error: "Your account is blocked, Please contact admin"
    },
    onLimitReached: async(req, res, optionsUsed) => {
        const user = await __UserData.findOne({email: req.body.email})
            user.isBlocked = true 
            await user.save()
            await __Logger.create({
                userEmail: req.body.email,
                action: "Attempted Login",
                errorMsg: "You exceeded the maximum limit level and account blocked"
            })
    }
})

router.post('/signup', controller.signup);
router.get("/verify-account/:userId/:secretCode", controller.VerifyAccont)
router.post('/login', isValidIp, limiter, controller.loginUser);
router.post('/resetPassword', controller.resetPassword);
router.post('/forgotpassword', controller.forgotPassword);
router.post('/changepassword', isAuth, controller.changePassword);
router.post('/unblock_user', controller.adminUnblockUser);
router.post('/updateProfile', controller.updateProfile);
router.post("/accept", controller.acceptDisclaimer)
router.get("/currentUser", isAuth, controller.getCurrentUser)

module.exports = router;