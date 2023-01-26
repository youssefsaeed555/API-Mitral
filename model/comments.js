const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const commentsSchema = new Schema({

    comment:{type:String},
    post:{
        type:Schema.Types.ObjectId,
        ref:'Post'
    },
    doctorComment:{
        type:Schema.Types.ObjectId,
        ref:'Doctor'
    },
    time:{type:String}
})

module.exports = mongoose.model('Comment',commentsSchema)