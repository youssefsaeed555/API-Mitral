const mongoose = require('mongoose')

const schema = mongoose.Schema

const patientSchema = new schema(
    {
        userName :{type:String},
        
        email: {type:String},

        password: {type:String},

        phone: {type:String },

        gender:
        {
            type:String,
            enum:['male','female']
        },

        birthDate:{type:String},
        
        posts:[{
            type:schema.Types.ObjectId,
            ref:'Post'
        }],
        resetToken : String,
        resetTokenExpiration:Date,
        passwordTokenVerfied:Boolean,
        age:String,
        roles:{
            type: [String],
            enum: ['user' , 'doctor' , 'admin' ],
            default: ['user']
        },
    }, { timestamps:true },{discriminatorKey:'role'},{ typeKey: '$type' })

module.exports = mongoose.model('User',patientSchema)






