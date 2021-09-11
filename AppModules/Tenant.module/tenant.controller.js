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


exports.tenantCreatevisitor = async(req, res) => {
try {
    const tenant = req.user
const data = req.body 
const passCode = await getPin.pingGen();

const visitor = await __Visitor.create({
  ...data,
  passCode,
  createdBy: tenant.sub
})

if(visitor){
    res.json({
        message: "Successful",
        visitor
    })
}else{
    res.send("Error creating visitor")
}
} catch (error) {
   res.send(error) 
}
}

exports.tenantCheckoutVisitor = async(req, res) => {
  try {
    const tenant = req.user
  const {visitorId, message} = req.body
  const visitor = await __Visitor.findOne({$and: [{_id:visitorId}, {createdBy: tenant.sub}]})
  
  if(visitor){
    visitor.passCode = null
    visitor.message = message
    visitor.isActive = false
    visitor.status = "checkedOut"
    visitor.save()
    res.json({
          message: "Successful",
          visitor
      })
  }else{
      res.send("Error checking out visitor")
  }
  } catch (error) {
     res.send(error) 
  }
  
  }

