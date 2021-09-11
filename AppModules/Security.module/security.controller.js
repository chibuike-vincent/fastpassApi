const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const moment = require("moment");


const __Admin = require("../../AppModels/Admin.model/admin.model");
const __User = require("../../AppModels/User.model/userModel")
const __Visitor = require("../../AppModels/User.model/userModel")
const { getTemplate } = require("../../Utils/Email.Provider/getTemplates");
const { sendEmail } = require("../../Utils/Email.Provider/sendEmail")
const Pin = require("../../Utils/CodeGenerator/pin");
const { validatePassword } = require("../../Utils/Validator/password");

const {
    AUTH_SECRET,
    EXPIRESIN,
    BASE_URI,
} = require("../../config/index");

const getPin = new Pin();



exports.verifyVisitor = async (req, res) => {
    try {
        const { passCode } = req.body

        const visitor = await __Visitor.findOne({ passCode })

        if (visitor) {
            res.json({
                message: "Successful",
                visitor
            })
        } else {
            res.send("Error creating visitor")
        }
    } catch (error) {
        res.send(error)
    }
}

exports.checkinVisitor = async (req, res) => {
    try {
        const security = req.user
        const { passCode } = req.body

        const visitor = await __Visitor.findOne({ passCode })

        if (visitor) {
            visitor.status = "active"
            visitor.checkedInBy = security.sub
            visitor.isActive = true
            visitor.save()

            res.json({
                message: "Successful",
                visitor
            })
        } else {
            res.send("Error creating visitor")
        }
    } catch (error) {
        res.send(error)
    }
}


exports.declineVisitor = async (req, res) => {
    try {
        const security = req.user
        const { passCode, message } = req.body

        const visitor = await __Visitor.findOne({ passCode })

        if (visitor) {
            visitor.status = "declined"
            visitor.passCode = null
            visitor.declinedBy = security.sub
            visitor.declineMessage = message
            visitor.save()

            res.json({
                message: "Successful",
                visitor
            })
        } else {
            res.send("Error creating visitor")
        }
    } catch (error) {
        res.send(error)
    }
}

exports.verifyCheckout = async (req, res) => {
    try {
        const { passCode } = req.body

        const visitor = await __Visitor.findOne({ passCode })

        if (visitor) {
            res.json({
                message: "Successful",
                visitor
            })
        } else {
            res.send("Error creating visitor")
        }
    } catch (error) {
        res.send(error)
    }
}

exports.getVisitors = async (req, res) => {
    try {
        const security = req.user
        const visitor = await __Visitor.find({ $or: [{checkedInBy: security.sub}, {declinedBy:security.sub }] }).sort({ createdAt: -1 })

        if (visitor) {
            res.json({
                message: "Successful",
                visitor
            })
        } else {
            res.send("Error fetching visitors")
        }
    } catch (error) {
        res.send(error)
    }
}

exports.getActiveVisitors = async (req, res) => {
    try {
        const security = req.user
        const visitor = await __Visitor.find({$or: [{checkedInBy: security.sub}, {declinedBy:security.sub }] 
        }).sort({ createdAt: -1 })
        if (visitor) {
            res.json({
                message: "Successful",
                visitor
            })
        } else {
            res.send("Error fetching visitors")
        }
    } catch (error) {
        res.send(error)
    }
}

exports.getCheckedOutVisitors = async (req, res) => {
    try {
        const security = req.user
        const visitor = await __Visitor.find({
            $and: [{
                checkedInBy: security.sub
            }, { status: "checkedOut" }]
        }).sort({ createdAt: -1 })

        if (visitor) {
            res.json({
                message: "Successful",
                visitor
            })
        } else {
            res.send("Error fetching visitors")
        }
    } catch (error) {
        res.send(error)
    }
}

