const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")
const mongoosePaginate = require('mongoose-paginate-v2');
const { UpdateTemplateRequest } = require("postmark/dist/client/models");


const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true 
    },
    lastName: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
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
        enum: ["tenant", "security"],
    },
    gender: {
        type:String,
        enum: ["Male", "Female"],
        required: true
    },
    nextOfKin: {
        type: String,
        required: this.userType === "tenant" ? true : false
    },
    occupation: {
        type: String,
        required: this.userType === "tenant" ? true : false
    },
    houseNumber: {
        type: String,
        required: this.userType === "tenant" ? true : false
    },
    resetPasswordPin: {
        type: Number
    },
    resetPasswordExpires: {
        type: String
    },
    unit: {
        type: String,
    },
    block: {
        type: String,
    },
    activationCode: {
        type: Number
    },
    status: {
        type: String,
        enum: ["active", "inactive"],
        default: "inactive"
    },
    isActive:{
        type: Boolean,
        default: false
    },
    isBlocked:{
        type: Boolean,
        default: false
    },
},
{
    timestamps:true
})


userSchema.statics.comparePassword = async (password, callback) =>{
   return await bcrypt.compare(password, this.password);
}


//=============================================================================
userSchema.pre("save", function saveHook(next) {
  const user = this;
  if (!user.isModified("password")) return next();
  const saltRounds = 10;
  const salt = bcrypt.genSaltSync(saltRounds);
  const hash = bcrypt.hashSync(user.password, salt);
  user.password = hash;
  return next();
});

userSchema.plugin(mongoosePaginate);

const userModel = mongoose.model("user", userSchema)

module.exports = userModel