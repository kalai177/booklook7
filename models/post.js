const mongoose=require('mongoose')
const userschema=new mongoose.Schema({
    name:{type:String,required:true},
    title:{type:String,required:true},
    review:{type:String,required:true},
    id:{type:String,required:true}
})
const model1=mongoose.model('posts',userschema)
module.exports=model1;