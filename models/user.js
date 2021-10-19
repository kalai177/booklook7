const mongoose=require('mongoose')
const userschema=new mongoose.Schema({
    username:{type:String,required:true,unique:true},
    passcode:{type:String,required :true}
});
const models=mongoose.model('users',userschema)
module.exports=models