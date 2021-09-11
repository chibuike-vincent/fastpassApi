const express = require('express')
const rateLimit = require("express-rate-limit");

const router = express.Router();

const __UserData = require("../../AppModels/User.model/userModel")
//const __Logger = require("../LogModules/log.model")
const {isAuth} =require("../../Utils/isAuth")

const controller = require('./auth.controller');

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
            {/*await __Logger.create({
                userEmail: req.body.email,
                action: "Attempted Login",
                errorMsg: "You exceeded the maximum limit level and account blocked"
            }) */}
    }
})

router.post('/login', limiter, controller.loginUser);
router.post('/resetPassword', controller.userResetPassword);
router.post('/forgotpassword', controller.userForgotPassword);
router.post('/changepassword', isAuth, controller.userChangePassword);
router.post('/updateProfile', isAuth, controller.userUpdateProfile);
router.get("/currentUser", isAuth, controller.getCurrentUser)

module.exports = router;