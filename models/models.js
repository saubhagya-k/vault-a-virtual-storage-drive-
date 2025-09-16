const mongoose = require('mongoose');
// const {Schema} = mongoose;


const userSchema = new mongoose.Schema({
    name:{
        type:String,
         required: true,
       
       
        trim:true,
        lowercase:true,
        minlength:[3,"User name must be at Least 3 charactoe Long"]
    },
    email:{
        type:String,
        required:true,
        unique:true,
        trim:true,
        lowercase:true,
        minlength:[13,"the Emailmust be at least 13 charactor long"]

    },
    password:{
        type:String,
        required:true,
        trim:true,
        required: true,
        
        minlength:[3,"the password must contain more 3 characotr long"]
    },
       storageUsed: {
        type: Number,
        default: 0 // Track storage used in bytes
    },
       createdAt: {
        type: Date,
        default: Date.now
    }
    // gender:{
    //     type:String,
    //     enum:['male','female']
    // },
    // age:Number
})

const userModel = mongoose.model('User',userSchema)


module.exports = userModel;