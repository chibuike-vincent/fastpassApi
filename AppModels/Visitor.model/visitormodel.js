const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")
const mongoosePaginate = require('mongoose-paginate-v2');


const visitorSchema = new mongoose.Schema({
    visitorName: {
        type: String, 
        required:true
    },
    phone: {
        type: String,
        required:true
    },
    gender: {
        type: String,
        enum: ["Male", "Female"],
        required: true
    },
    email: {
        type: String,
        required: true ,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true
    },
    checkedInBy:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true
    },
    houseNumber: {
        type: String,
        required:true
    },
    passCode: {
        type: Number
    },
    status: {
        type: String,
        enum: ["active", "pending", "checkedOut", "declined"],
        default: "pending"
    },
    isActive:{
        type: Boolean,
        default: false
    },
},
{
    timestamps:true
})


visitorSchema.statics.comparePassword = async (password, callback) =>{
   return await bcrypt.compare(password, this.password);
}

visitorSchema.plugin(mongoosePaginate);

const visitorModel = mongoose.model("visitor", visitorSchema)

module.exports = visitorModel