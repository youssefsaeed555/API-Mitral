const mongoose = require('mongoose')
const schema = mongoose.Schema

const complaints = new schema({
    details:
    {
        type:String
    },
    user:
    {
        type:schema.Types.ObjectId,
        ref:'User'
    },
    doctor:
    {
        type:schema.Types.ObjectId,
        ref:'Doctor'
    }
},{timestamps:true})
module.exports = mongoose.model('Complaints',complaints)