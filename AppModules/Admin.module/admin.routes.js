const express = require('express')
const rateLimit = require("express-rate-limit");

const router = express.Router();

const __UserData = require("../../AppModels/Admin.model/admin.model")
//const __Logger = require("../LogModules/log.model")
const {isAuth} =require("../../Utils/isAuth")

const controller = require('./admin.controller');

const limiter = rateLimit({
    max: 5,
    windowMs: 1 * 60 * 1000,
    statusCode: 200,
    message: {
     status: 429,
     error: "Your account is blocked, Please contact fastpass admin"
    },
    onLimitReached: async(req, res, optionsUsed) => {
        const user = await __UserData.findOne({email: req.body.email})
                user.isBlocked = true 
                await user.save()
            {/*await __Logger.create({
                userEmail: req.body.email,
                action: "Attempted Login",
                errorMsg: "You exceeded the maximum limit level and account blocked"
            })*/}
    }
})

router.post('/signup', controller.signupAdmin);
router.get("/verify-account/:userId/:secretCode", controller.adminVerifyAccont);
router.post('/login', limiter, controller.loginAdmin);
router.post('/resetPassword', controller.adminResetPassword);
router.post('/forgotpassword', controller.adminForgotPassword);
router.post('/unblock_admin', controller.superAdminUnblockAdmin);
router.post('/changepassword', isAuth, controller.adminChangePassword);
router.post('/unblock_user', isAuth, controller.adminUnblockUser);
router.post('/updateProfile', isAuth, controller.AdminUpdateProfile);
router.get("/currentUser", isAuth, controller.adminGetCurrentUser);
router.post("/create_tenant", isAuth, controller.adminCreateTenant);
router.post("/create_security", isAuth, controller.adminCreateSecurity);
router.get("/tenants", isAuth, controller.adminGetAllTenants);
router.get("/securities", isAuth, controller.adminGetAllSecurity);
router.get("/tenant/:tenantId", isAuth, controller.adminGetTenant);
router.get("/security/:securityId", isAuth, controller.adminGetSecurity);
router.delete("/tenant/:tenantId", isAuth, controller.adminGetSecurity);
router.delete("/tenant/:securityId", isAuth, controller.adminGetSecurity);

module.exports = router;