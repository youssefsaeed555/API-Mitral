const mongoose = require('mongoose')

const schema = mongoose.Schema

const ReviewsSchema = new schema({
    name:{type:String},
    rating:
    {
        type:Number,
        required:[true, 'من فضلك ادخل التقييم'],
        default:0,
        min:[1,'من فضلك ادخل تقييم لا يقل عن 1'],
        max:[5,'من فضلك ادخل تقييم لا يزيد عن 5']
    },
    comment:{type:String},
    user:
    {
        type:schema.Types.ObjectId,
        ref:'User'
    },
    doctor:
    {
        type:schema.Types.ObjectId,
        ref:'Doctor'
    },
    time:{type:String}
})
  
module.exports = mongoose.model('Reviews',ReviewsSchema)