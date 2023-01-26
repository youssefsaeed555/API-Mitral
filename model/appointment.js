const mongoose = require('mongoose')

const schema = mongoose.Schema

const appointmentSchema = new schema({
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      doctor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Doctor",
        required: true,
      },
      start: {
        type: String, 
        required:true
      },
      end: {
        type: String, 
      },
      time:
      {
        type:String
      },
      name:
      {
        type:String
      },
      phone:{
        type:String
      },
      reservationPlace:
      {
        type:String,
        enum:[this.doctor,'مكالمه فيديو']
      },
      reservationStatus:
      {
        type:Boolean,
        default:false
      },
      meeting:
      {
        type:String
      },
      meetingName:
      {
        type:String
      },
      meetingStart:
      {
        type:Number
      },
      isPaid: {
        type: Boolean,
        default: false,
      },
      totalPaid:
      {
        type:Number
      },
      paidAt: String,

},{timestamps:true})

module.exports = mongoose.model('appointments',appointmentSchema)