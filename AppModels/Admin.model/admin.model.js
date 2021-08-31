const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")
const mongoosePaginate = require('mongoose-paginate-v2');


const adminSchema = new mongoose.Schema({
    estatename: {
        type: String,
    },
    phone: {
        type: String,
    },
    email: {
        type: String,
        required: true 
    },
    password: {
        type: String, 
        required: true 
    },
    userType: {
        type: String,
        required:true
    },
    resetPasswordPin: {
        type: Number
    },
    resetPasswordExpires: {
        type: String
    },
    status: {
        type: String,
        enum: ["active", "inactive"],
        default: "inactive"
    },
    verificationCode: {
        type: Number
    },
    isActive:{
        type: Boolean,
        default: false
    },
    hasSubscribed:{
        type: Boolean,
        default: false
    },
    subscriptionType:{
        type: String
    },
    subscriptionExpires:{
        type: String
    },
},
{
    timestamps:true
})


adminSchema.statics.comparePassword = async (password, callback) =>{
   return await bcrypt.compare(password, this.password);
}


//=============================================================================
adminSchema.pre("save", function saveHook(next) {
  const admin = this;
  if (!admin.isModified("password")) return next();
  const saltRounds = 10;
  const salt = bcrypt.genSaltSync(saltRounds);
  const hash = bcrypt.hashSync(admin.password, salt);
  admin.password = hash;
  return next();
});

adminSchema.plugin(mongoosePaginate);

const adminModel = mongoose.model("admin", adminSchema)

module.exports = adminModel