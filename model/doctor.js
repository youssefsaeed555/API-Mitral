const mongoose = require('mongoose')

const user = require('../model/users')

const Schema = mongoose.Schema

const doctor = new Schema(
    {
        photo:{type:String},
        photoId:{type:String},
        city:
        {
            type:String,
            enum:['القاهره','الاسماعيليه','السويس','بورسعيد'],
            required:true
        },
        specialty: 
        {
            type:String,
            enum:['التجميل','اسنان','قلب','انف واذن وحنجره','عظام','عيون','تحاليل','اشعه'],
            required:true
        },
        region:
        {
            type:String,
        },
        license:{type:String},
        licenseId:{type:String},
        isverfied:{type:Boolean,default:false},
        online:{type:Boolean,default:false},
        homecare:{type:Boolean,default:false},
        title:{type:String},
        location:{type:String},
        price:{type:Number},
        calender:
        {
            type:[Schema.Types.ObjectId],
            ref:"Calender"
        },
        teleCalender:
        {
            type:[Schema.Types.ObjectId],
            ref:"TeleCalender"
        },
        comments:{
            type:[Schema.Types.ObjectId],
            ref:'Comment'
        },
        reviews:
        [{
            type:Schema.Types.ObjectId,
            ref:'Reviews'
        }],
        raiting:
        {
            type:Number,
            default:0
        },
        numReviews:
        {
            type:Number,
            default:0
        },
        complaints:
        {
            type:[Schema.Types.ObjectId],
            ref:'Complaints'
        },
        complaintsMode:
        {
            type:Boolean,
            default:false
        }
    },{discriminatorKey:'role'}
)

module.exports = user.discriminator ('Doctor',doctor)

